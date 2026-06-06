import { request } from './client'

export type AppointmentPayload = {
  id: string
  uuid?: string
  amount?: number
}

export type AppointmentsPayload = {
  appointments?: any[]
  pagination?: any
}

export type SlotsPayload = {
  slots?: any[]
}

export async function getAppointments(query = '') {
  const suffix = query ? `?${query}` : ''
  return request<AppointmentsPayload>(`/appointments${suffix}`)
}

export async function getAppointment(appointmentId: string) {
  return request(`/appointments/${appointmentId}`)
}

export async function createAppointment(payload: {
  vet_uuid: string
  vet_id?: string
  pet_id: string | number
  scheduled_at: string
  slot?: string
  appointment_type: 'clinic_visit' | 'home_visit' | 'online' | string
  type?: string
  reason: string
  notes?: string
  home_address?: string
  home_latitude?: number
  home_longitude?: number
}) {
  return request<AppointmentPayload>('/appointments', { method: 'POST', body: JSON.stringify(payload) })
}

export async function cancelAppointment(appointmentId: string, reason: string) {
  return request(`/appointments/${appointmentId}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  })
}

export async function rescheduleAppointment(appointmentId: string, payload: { scheduled_at: string }) {
  return request(`/appointments/${appointmentId}/reschedule`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getAppointmentSlots(vetUuid: string, date: string) {
  return request<SlotsPayload>(`/appointments/slots/${vetUuid}?date=${encodeURIComponent(date)}`)
}
