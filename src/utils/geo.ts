import { Linking, Platform } from 'react-native'

export type LatLng = { latitude: number; longitude: number }

// Google Maps key is exposed to JS via the EXPO_PUBLIC_ prefix. We use this to
// decide whether it's safe to mount a native MapView — rendering a map with a
// missing/placeholder key can fail on some devices, so we degrade to a non-map
// fallback instead. (Directions via Linking still work without a key.)
const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
export const HAS_MAPS_KEY = MAPS_KEY.length > 0 && MAPS_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY'

// Fallback map center used when the user's location is unavailable or denied.
// Picked as a central, recognisable city so the map never renders on the ocean.
export const DEFAULT_REGION = {
  latitude: 12.9716,
  longitude: 77.5946,
  label: 'Bengaluru',
}

// Default zoom deltas for a "neighbourhood" level view (~5–6 km across).
export const DEFAULT_DELTA = {
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
}

function isValidCoord(lat: any, lng: any): boolean {
  const a = Number(lat)
  const b = Number(lng)
  return (
    Number.isFinite(a) &&
    Number.isFinite(b) &&
    Math.abs(a) <= 90 &&
    Math.abs(b) <= 180 &&
    // Treat 0,0 (null island) as "no coordinates" — almost always missing data.
    !(a === 0 && b === 0)
  )
}

/**
 * Pulls a {latitude, longitude} pair out of a raw vet/clinic record, tolerating
 * the many key spellings a backend might use. Returns null when coordinates are
 * missing or invalid so callers can degrade gracefully.
 */
export function extractCoords(raw: any): LatLng | null {
  if (!raw) return null
  const lat =
    raw.latitude ?? raw.lat ?? raw.clinic_latitude ?? raw.location_lat ?? raw.geo_lat
  const lng =
    raw.longitude ?? raw.lng ?? raw.lon ?? raw.clinic_longitude ?? raw.location_lng ?? raw.geo_lng
  if (!isValidCoord(lat, lng)) return null
  return { latitude: Number(lat), longitude: Number(lng) }
}

const EARTH_RADIUS_KM = 6371

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Great-circle distance between two points in kilometres (haversine). */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude)
  const dLng = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude)
  const lat2 = toRad(b.latitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Human-friendly distance label, e.g. "850 m away" / "3.2 km away". */
export function formatDistance(km: number | null | undefined): string {
  if (km == null || !Number.isFinite(km)) return 'Nearby'
  if (km < 1) return `${Math.round(km * 1000)} m away`
  if (km < 10) return `${km.toFixed(1)} km away`
  return `${Math.round(km)} km away`
}

/**
 * Opens the device's maps app with directions to a destination.
 * Uses the platform-native scheme when possible, falling back to a Google Maps
 * web URL (also handles the case where coordinates are missing but an address is).
 */
export async function openDirections(opts: {
  latitude?: number | null
  longitude?: number | null
  label?: string
  address?: string
}): Promise<boolean> {
  const { latitude, longitude, label, address } = opts
  const hasCoords = isValidCoord(latitude, longitude)

  let url: string
  if (hasCoords) {
    const coords = `${latitude},${longitude}`
    const name = encodeURIComponent(label || 'Destination')
    if (Platform.OS === 'ios') {
      url = `maps://?daddr=${coords}&q=${name}`
    } else {
      // Android geo: URI launches the system map chooser.
      url = `geo:${coords}?q=${coords}(${name})`
    }
  } else if (address) {
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  } else {
    return false
  }

  try {
    const supported = await Linking.canOpenURL(url)
    if (supported) {
      await Linking.openURL(url)
      return true
    }
  } catch {
    // fall through to web fallback
  }

  // Universal fallback: Google Maps over https (always openable in a browser).
  const webUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`
  try {
    await Linking.openURL(webUrl)
    return true
  } catch {
    return false
  }
}
