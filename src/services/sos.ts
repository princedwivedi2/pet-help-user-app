import { request } from './client'

export async function createSos(payload: {
  pet_id: string | number
  description: string
  urgency: string
  latitude: number
  longitude: number
}) {
  return request('/sos', { method: 'POST', body: JSON.stringify(payload) })
}

export async function getActiveSos() {
  return request('/sos/active')
}
