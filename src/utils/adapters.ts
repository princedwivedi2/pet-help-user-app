type AnyRecord = Record<string, any>

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
    raw.home_visit_available ? 'Home visit' : null,
    raw.online_consult_available ?? raw.online_available ? 'Online consult' : null,
    raw.available_now || raw.is_available ? 'Available now' : null,
  ].filter((item): item is string => Boolean(item))

  return {
    id: String(raw.uuid || raw.id || `vet-${index}`),
    uuid: raw.uuid || raw.id,
    name: raw.vet_name || raw.name || raw.full_name || 'Veterinarian',
    clinic: raw.clinic_name || raw.clinic || raw.practice_name || raw.hospital_name || 'Clinic',
    specialization: specializations.join(', ') || raw.specialization || 'General care',
    rating: asNumber(raw.avg_rating ?? raw.rating ?? raw.review_score, 0),
    reviews: asNumber(raw.total_reviews ?? raw.reviews_count ?? raw.reviews, 0),
    distance: raw.distance_label || raw.distance || (raw.distance_km != null ? `${raw.distance_km} km away` : 'Nearby'),
    chips,
    fee: money(raw.consultation_fee ?? raw.online_fee ?? raw.home_visit_fee ?? raw.fee_amount ?? raw.fee),
    phone: raw.phone || raw.contact_phone || raw.mobile || '',
    raw,
  }
}

export function normalizePet(raw: AnyRecord = {}, index = 0) {
  return {
    id: String(raw.uuid || raw.id || `pet-${index}`),
    uuid: raw.uuid || raw.id,
    name: raw.name || raw.pet_name || 'Pet',
    species: raw.species || raw.breed || raw.type || 'Pet',
    emoji: raw.emoji || raw.icon || '🐾',
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
