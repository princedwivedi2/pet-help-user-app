import Constants from 'expo-constants'
import * as SecureStore from 'expo-secure-store'

function getApiBase() {
  return (
    Constants.expoConfig?.extra?.apiUrl ||
    Constants.manifest?.extra?.apiUrl ||
    'http://192.168.1.26:8002/api/v1'
  )
}

const API_BASE = getApiBase()

export { API_BASE }

export type ApiResponse<T = unknown> = {
  success: boolean
  message?: string
  data?: T
  errors?: any
}

export async function request<T = unknown>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${path}`
  const token = await SecureStore.getItemAsync('authToken')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(url, { headers, ...options })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Request failed for ${url}: ${message}`)
  }

  const body = await res.json().catch(() => ({}))
  return body as ApiResponse<T>
}
