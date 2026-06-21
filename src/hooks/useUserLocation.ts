import { useCallback, useEffect, useState } from 'react'
import * as Location from 'expo-location'
import type { LatLng } from '../utils/geo'

export type LocationStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable'

export type UseUserLocation = {
  status: LocationStatus
  coords: LatLng | null
  /** True while actively acquiring a fix. */
  loading: boolean
  /** Request permission (if needed) and fetch the current position. */
  request: () => Promise<void>
}

/**
 * Foreground-only location hook.
 * - Asks for permission, then fetches a single position fix.
 * - Surfaces distinct `denied` / `unavailable` states so the UI can offer a
 *   sensible fallback (default city, manual search) rather than crashing.
 */
export function useUserLocation(autoRequest = true): UseUserLocation {
  const [status, setStatus] = useState<LocationStatus>('idle')
  const [coords, setCoords] = useState<LatLng | null>(null)
  const [loading, setLoading] = useState(false)

  const request = useCallback(async () => {
    setLoading(true)
    setStatus('requesting')
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync()
      if (perm !== 'granted') {
        setStatus('denied')
        return
      }

      // Some devices/emulators have location services off entirely.
      const enabled = await Location.hasServicesEnabledAsync().catch(() => true)
      if (!enabled) {
        setStatus('unavailable')
        return
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
      setStatus('granted')
    } catch {
      setStatus('unavailable')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autoRequest) void request()
  }, [autoRequest, request])

  return { status, coords, loading, request }
}
