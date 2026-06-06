import { request } from './client'

export async function createConsultation(payload: {
  modality: 'video' | 'audio' | 'chat'
  pet_uuid?: string | null
  issue_category?: string
  issue_description?: string
  fee_amount?: number | null
  payment_uuid?: string | null
}) {
  return request('/consultations', { method: 'POST', body: JSON.stringify(payload) })
}

export async function joinConsultation(uuid: string) {
  return request(`/consultations/${uuid}/join`, { method: 'POST' })
}

export async function getConsultation(uuid: string) {
  return request(`/consultations/${uuid}`)
}

export async function getConsultationMessages(uuid: string) {
  return request(`/consultations/${uuid}/messages`)
}

export async function sendConsultationMessage(uuid: string, content: string) {
  return request(`/consultations/${uuid}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}
