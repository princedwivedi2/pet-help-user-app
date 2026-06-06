import { request } from './client'

export type PetsPayload = {
  pets?: any[]
}

export async function getPets() {
  return request<PetsPayload>('/pets')
}

export async function getPet(petId: string) {
  return request(`/pets/${petId}`)
}

export async function createPet(payload: {
  name: string
  species: string
  breed?: string
  birth_date?: string
}) {
  return request('/pets', { method: 'POST', body: JSON.stringify(payload) })
}

export async function updatePet(petId: string, payload: Record<string, unknown>) {
  return request(`/pets/${petId}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export async function deletePet(petId: string) {
  return request(`/pets/${petId}`, { method: 'DELETE' })
}

export async function getPetDashboard(petId: string) {
  return request(`/pets/${petId}/dashboard`)
}

export async function getPetMedicalRecords(petId: string, query = '') {
  const suffix = query ? `?${query}` : ''
  return request(`/pets/${petId}/medical-records${suffix}`)
}

export async function getPetVisitRecords(petId: string) {
  return request(`/pets/${petId}/visit-records`)
}

export async function getPetDocuments(petId: string) {
  return request(`/pets/${petId}/documents`)
}

export async function getPetMedications(petId: string, query = '') {
  const suffix = query ? `?${query}` : ''
  return request(`/pets/${petId}/medications${suffix}`)
}

export async function getPetReminders(petId: string) {
  return request(`/pets/${petId}/reminders`)
}

export async function getPetNotes(petId: string) {
  return request(`/pets/${petId}/notes`)
}
