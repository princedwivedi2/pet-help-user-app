/** Typed API error that carries the HTTP status code. */
export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly validationErrors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Converts any caught value from a request() call into a user-facing string.
 * Keeps network, rate-limit, server-down, and validation cases distinct.
 */
export function parseApiError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 401) return e.message || 'Your session has expired. Please sign in again.'
    if (e.status === 403) return 'You don\'t have permission to do that.'
    if (e.status === 422) {
      // Prefer the first field-level message if present
      const firstField = e.validationErrors && Object.values(e.validationErrors)[0]
      if (firstField?.[0]) return firstField[0]
      return e.message || 'Please check your input and try again.'
    }
    if (e.status === 429) return 'Too many requests — please slow down and try again.'
    if (e.status === 503) return 'Service temporarily unavailable. Try again in a moment.'
    if (e.status >= 500) return 'Something went wrong on our end. Please try again.'
    return e.message || 'An error occurred.'
  }

  if (e instanceof Error) {
    const msg = e.message.toLowerCase()
    if (
      msg.includes('network') ||
      msg.includes('failed to fetch') ||
      msg.includes('econnrefused') ||
      msg.includes('timeout') ||
      msg.includes('abort') ||
      msg.includes('request failed')
    ) {
      return 'Check your connection and try again.'
    }
    return e.message
  }

  return 'An unexpected error occurred.'
}

/**
 * Extracts per-field validation errors from a 422 ApiError.
 * Returns an empty object for any other error type.
 */
export function getValidationErrors(e: unknown): Record<string, string> {
  if (e instanceof ApiError && e.status === 422 && e.validationErrors) {
    const out: Record<string, string> = {}
    for (const [field, msgs] of Object.entries(e.validationErrors)) {
      if (msgs[0]) out[field] = msgs[0]
    }
    return out
  }
  return {}
}
