import { getApiBase } from '../services/apiConfig'
import { extractCoords } from './geo'

type AnyRecord = Record<string, any>

// Origin of the backend (strip the /api/v1 suffix) so we can reach /storage/* assets.
// Computed at call time so it respects the runtime base-URL override.
function apiOrigin(): string {
  return getApiBase().replace(/\/api\/v\d+\/?$/, '')
}

// The backend builds asset URLs from APP_URL (often http://localhost in dev), which a
// phone can't reach. Rewrite those to the API origin, and absolutize relative paths.
export function resolveMediaUrl(url?: string | null): string {
  if (!url) return ''
  const s = String(url).trim()
  if (!s) return ''
  const origin = apiOrigin()
  if (s.startsWith('/')) return `${origin}${s}`
  return s.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, origin)
}

export type SelectOption = {
  value: string
  label: string
}

export function pickArray(payload: AnyRecord | any[] | null | undefined, keys: string[] = []): any[] {
  if (Array.isArray(payload)) return payload
  if (!payload) return []
  for (const key of keys) {
    const value = payload[key]
    if (Array.isArray(value)) return value
  }
  if (Array.isArray(payload.items)) return payload.items
  if (Array.isArray(payload.data)) return payload.data
  return []
}

function asNumber(value: any, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function money(value: any) {
  const amount = asNumber(value, 0)
  if (!amount) return '₹0'
  return `₹${Math.round(amount)}`
}

export function moneyLabel(value: any) {
  return money(value)
}

export function normalizeVet(raw: AnyRecord = {}, index = 0) {
  const specializations = Array.isArray(raw.specializations)
    ? raw.specializations
    : typeof raw.specialization === 'string'
      ? [raw.specialization]
      : []

  const chips = [
    raw.is_emergency_available ? 'Emergency' : null,
    raw.is_24_hours ? '24/7' : null,
    raw.online_consult_available ?? raw.online_available ? 'Online consult' : null,
    raw.available_now || raw.is_available ? 'Available now' : null,
  ].filter((item): item is string => Boolean(item))

  const coords = extractCoords(raw)
  const distanceKm =
    raw.distance_km != null && Number.isFinite(Number(raw.distance_km)) ? Number(raw.distance_km) : null

  return {
    id: String(raw.uuid || raw.id || `vet-${index}`),
    uuid: raw.uuid || raw.id,
    name: raw.vet_name || raw.name || raw.full_name || 'Veterinarian',
    clinic: raw.clinic_name || raw.clinic || raw.practice_name || raw.hospital_name || 'Clinic',
    specialization: specializations.join(', ') || raw.specialization || 'General care',
    rating: asNumber(raw.avg_rating ?? raw.rating ?? raw.review_score, 0),
    reviews: asNumber(raw.total_reviews ?? raw.reviews_count ?? raw.reviews, 0),
    distance: raw.distance_label || raw.distance || (distanceKm != null ? `${distanceKm} km away` : 'Nearby'),
    distanceKm,
    latitude: coords?.latitude ?? null,
    longitude: coords?.longitude ?? null,
    address:
      raw.clinic_address || raw.address || raw.full_address || raw.location_address ||
      [raw.address_line1, raw.city, raw.state].filter(Boolean).join(', ') || '',
    chips,
    fee: money(raw.consultation_fee ?? raw.online_fee ?? raw.home_visit_fee ?? raw.fee_amount ?? raw.fee),
    phone: raw.phone || raw.contact_phone || raw.mobile || '',
    raw,
  }
}

const SPECIES_EMOJI: Record<string, string> = {
  dog: '🐶',
  cat: '🐱',
  bird: '🐦',
  rabbit: '🐰',
  hamster: '🐹',
  fish: '🐠',
  reptile: '🦎',
  other: '🐾',
}

export function petAgeLabel(birthDate: any): string | null {
  if (!birthDate) return null
  const date = new Date(birthDate)
  if (!Number.isFinite(date.getTime())) return null
  const now = new Date()
  let months = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth())
  if (now.getDate() < date.getDate()) months -= 1
  if (months < 0) return null
  const years = Math.floor(months / 12)
  const rem = months % 12
  if (years <= 0) return `${rem} mo old`
  return rem ? `${years}y ${rem}m old` : `${years} ${years === 1 ? 'year' : 'years'} old`
}

export function normalizePet(raw: AnyRecord = {}, index = 0) {
  const species = String(raw.species || raw.type || '').toLowerCase()
  const breed = raw.breed || ''
  const age = petAgeLabel(raw.birth_date)
  const weight = raw.weight_kg != null && raw.weight_kg !== '' ? `${raw.weight_kg} kg` : ''

  return {
    id: String(raw.id || `pet-${index}`),
    uuid: raw.uuid || undefined,
    name: raw.name || raw.pet_name || 'Pet',
    species: raw.species || raw.breed || raw.type || 'Pet',
    breed,
    age,
    weight,
    photoUrl: resolveMediaUrl(raw.photo_url),
    emoji: raw.emoji || raw.icon || SPECIES_EMOJI[species] || '🐾',
    reminder: raw.reminder || raw.next_reminder || raw.medical_note || 'No reminders yet',
    medication: raw.medication || raw.current_medication || raw.notes || 'No active medication',
    raw,
  }
}

export function normalizeAppointment(raw: AnyRecord = {}, index = 0) {
  const scheduledAt = raw.scheduled_at || raw.start_at || raw.when || raw.date_time || ''
  const status = raw.status || 'pending'

  return {
    id: String(raw.uuid || raw.id || `appointment-${index}`),
    uuid: raw.uuid || raw.id,
    title: raw.title || raw.reason || raw.appointment_type || 'Appointment',
    vet: raw.vet_name || raw.vet?.name || raw.vet?.vet_name || 'Veterinarian',
    when: scheduledAt
      ? new Date(scheduledAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
      : raw.when || 'Scheduled soon',
    status,
    pet: raw.pet_name || raw.pet?.name || raw.pet || 'Pet',
    raw,
  }
}

export function normalizeSlot(raw: any): SelectOption | null {
  if (!raw) return null

  if (typeof raw === 'string') {
    const value = raw.trim()
    if (!value) return null
    return {
      value,
      label: new Date(value).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    }
  }

  const value = String(raw.scheduled_at || raw.start_at || raw.value || raw.slot || raw.time || '').trim()
  if (!value) return null

  return {
    value,
    label: raw.label || raw.display || new Date(value).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
  }
}
