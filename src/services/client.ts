import * as SecureStore from 'expo-secure-store'
import { ApiError } from '../utils/apiError'
import { fireUnauthorized } from '../utils/authEvents'
import { getApiBase, ensureApiBaseLoaded, DEFAULT_API_BASE } from './apiConfig'

const REQUEST_TIMEOUT_MS = 30000

// Back-compat export. Prefer getApiBase() for the live (override-aware) value.
export const API_BASE = DEFAULT_API_BASE

export type ApiResponse<T = unknown> = {
  success: boolean
  message?: string
  data?: T
  errors?: any
}

export async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  // Make sure any persisted runtime override is applied before the first call.
  await ensureApiBaseLoaded()
  const base = getApiBase()
  // Join safely so we never get a double slash or a missing one.
  const url = `${base.replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`
  const token = await SecureStore.getItemAsync('authToken')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(url, { ...options, headers, signal: options.signal ?? controller.signal })
  } catch (error) {
    clearTimeout(timeout)
    const isAbort = error instanceof Error && error.name === 'AbortError'
    const message = isAbort
      ? `Request timed out reaching ${base} — check the server is running and reachable.`
      : `Couldn't reach the server at ${base}. Check the IP/port and your Wi-Fi, or update it in Server settings.`
    throw new ApiError(message, 0)
  }
  clearTimeout(timeout)

  // Parse body (best-effort — some endpoints return empty 204)
  const body: ApiResponse<T> = await res.json().catch(() => ({} as ApiResponse<T>))

  // 401 — on public auth endpoints this means bad credentials (NOT an expired
  // session), so surface the real message and do NOT trigger a global sign-out.
  if (res.status === 401) {
    const p = String(path)
    const isAuthEndpoint = ['/auth/login', '/auth/register', '/auth/otp/send', '/auth/otp/verify', '/auth/forgot-password', '/auth/reset-password']
      .some((a) => p === a || p.startsWith(`${a}?`))
    if (isAuthEndpoint) {
      throw new ApiError(body.message || 'Invalid credentials. Please check your details and try again.', 401)
    }
    fireUnauthorized()
    throw new ApiError(body.message || 'Your session has expired. Please sign in again.', 401)
  }

  // 422 — validation error; surface field errors
  if (res.status === 422) {
    const validationErrors = body.errors as Record<string, string[]> | undefined
    const firstMsg = validationErrors ? Object.values(validationErrors)[0]?.[0] : undefined
    throw new ApiError(firstMsg || body.message || 'Please check your input.', 422, validationErrors)
  }

  // 429 — rate-limited
  if (res.status === 429) {
    throw new ApiError('Too many requests — please slow down and try again.', 429)
  }

  // 503 — server down / maintenance
  if (res.status === 503) {
    throw new ApiError('Service temporarily unavailable. Try again in a moment.', 503)
  }

  // Other 5xx
  if (res.status >= 500) {
    throw new ApiError(body.message || 'Something went wrong on our end. Please try again.', res.status)
  }

  // 4xx that aren't 401/422/429 — return body as-is so callers can inspect success/message
  return body
}
