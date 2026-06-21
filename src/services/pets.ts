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

export type PetWritePayload = {
  name: string
  species: string
  breed?: string
  birth_date?: string
  weight_kg?: number
  photo_url?: string
  medical_notes?: string
  // Local file URI from the image picker. When present the pet is saved as
  // multipart/form-data so the backend stores the image and sets photo_url.
  photoUri?: string
}

function buildPetForm(payload: PetWritePayload, method?: 'PUT'): FormData {
  const form = new FormData()
  form.append('name', payload.name)
  form.append('species', payload.species)
  if (payload.breed) form.append('breed', payload.breed)
  if (payload.birth_date) form.append('birth_date', payload.birth_date)
  if (payload.weight_kg != null) form.append('weight_kg', String(payload.weight_kg))
  if (payload.medical_notes) form.append('medical_notes', payload.medical_notes)
  if (method) form.append('_method', method) // Laravel method spoofing for multipart updates

  const uri = payload.photoUri as string
  const fileName = uri.split('/').pop() || `pet-${Date.now()}.jpg`
  const ext = fileName.split('.').pop()?.toLowerCase()
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
  form.append('photo', { uri, name: fileName, type: mime } as any)
  return form
}

export async function createPet(payload: PetWritePayload) {
  if (payload.photoUri) {
    return request('/pets', { method: 'POST', body: buildPetForm(payload) })
  }
  const { photoUri, ...json } = payload
  return request('/pets', { method: 'POST', body: JSON.stringify(json) })
}

export async function updatePet(petId: string, payload: PetWritePayload) {
  if (payload.photoUri) {
    return request(`/pets/${petId}`, { method: 'POST', body: buildPetForm(payload, 'PUT') })
  }
  const { photoUri, ...json } = payload
  return request(`/pets/${petId}`, { method: 'PUT', body: JSON.stringify(json) })
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

export async function createMedicalRecord(petId: string, payload: {
  record_type: 'diagnosis' | 'vaccination' | 'medicine' | 'lab_report' | 'general'
  title: string
  notes?: string
  date?: string
}) {
  return request(`/pets/${petId}/medical-records`, { method: 'POST', body: JSON.stringify(payload) })
}

export async function createMedication(petId: string, payload: {
  medication_name: string
  dosage: string
  dosage_unit: string
  frequency: number
  frequency_unit: 'daily' | 'weekly' | 'monthly' | 'as_needed' | 'hours'
  start_date: string
  administration_method: 'oral' | 'topical' | 'injection' | 'drops' | 'spray' | 'inhaler' | 'patch' | 'suppository' | 'other'
  instructions?: string
}) {
  return request(`/pets/${petId}/medications`, { method: 'POST', body: JSON.stringify(payload) })
}

export async function createReminder(petId: string, payload: {
  title: string
  description?: string
  reminder_type: 'vaccination' | 'medication' | 'checkup' | 'grooming' | 'feeding' | 'exercise' | 'training' | 'deworming' | 'flea_treatment' | 'dental_care' | 'weight_check' | 'other'
  scheduled_at: string
}) {
  return request(`/pets/${petId}/reminders`, { method: 'POST', body: JSON.stringify(payload) })
}
