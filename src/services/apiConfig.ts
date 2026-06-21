import * as SecureStore from 'expo-secure-store'

/**
 * Single source of truth for the backend base URL.
 *
 * EXPO_PUBLIC_API_BASE_URL is inlined at BUNDLE time — editing .env without a
 * rebuild + cache-clear keeps the old value compiled in. To make the IP easy to
 * change on a physical device without rebuilding, we layer a RUNTIME override on
 * top: a value the user types in the in-app "Server settings" screen, persisted
 * in SecureStore and read first by the API client.
 *
 * Resolution order: persisted override → EXPO_PUBLIC_API_BASE_URL → built-in default.
 */
const OVERRIDE_KEY = 'apiBaseOverride'

export const DEFAULT_API_BASE = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://192.168.1.100:8002/api/v1',
)

// Synchronous cache so request() doesn't await SecureStore on every call.
let currentBase = DEFAULT_API_BASE
let loadPromise: Promise<void> | null = null

/**
 * Normalizes a base URL: trims, adds http:// if no scheme, drops trailing
 * slashes, and appends /api/v1 if the user typed only a host:port.
 */
export function normalizeBaseUrl(raw: string): string {
  let s = String(raw ?? '').trim()
  if (!s) return DEFAULT_API_BASE ?? ''
  if (!/^https?:\/\//i.test(s)) s = `http://${s}`
  s = s.replace(/\/+$/, '')
  // If they entered just an origin (no path), assume the standard API prefix.
  if (!/\/api(\/|$)/i.test(s)) s = `${s}/api/v1`
  return s
}

/** Current base URL (synchronous — reflects the loaded override). */
export function getApiBase(): string {
  return currentBase
}

/** Loads the persisted override once; safe to call repeatedly. */
export function ensureApiBaseLoaded(): Promise<void> {
  if (!loadPromise) {
    loadPromise = SecureStore.getItemAsync(OVERRIDE_KEY)
      .then((stored) => {
        if (stored && stored.trim()) currentBase = normalizeBaseUrl(stored)
      })
      .catch(() => {
        /* keep default — non-fatal */
      })
  }
  return loadPromise
}

/** Persists a new base URL override and updates the live value. */
export async function setApiBase(url: string): Promise<string> {
  const normalized = normalizeBaseUrl(url)
  currentBase = normalized
  await SecureStore.setItemAsync(OVERRIDE_KEY, normalized).catch(() => {})
  return normalized
}

/** Clears the override and reverts to the build-time default. */
export async function clearApiBase(): Promise<string> {
  currentBase = DEFAULT_API_BASE
  await SecureStore.deleteItemAsync(OVERRIDE_KEY).catch(() => {})
  return currentBase
}

/** Whether a runtime override is currently active (differs from the default). */
export function hasOverride(): boolean {
  return currentBase !== DEFAULT_API_BASE
}
