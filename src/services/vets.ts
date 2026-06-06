import { request } from './client'

export type VetListPayload = {
  vets?: any[]
  nearby_vets?: any[]
  all_vets?: any[]
  city_vets?: any[]
  pagination?: any
}

export type VetDetailPayload = {
  vet?: any
}

export type ReviewsPayload = {
  reviews?: any[]
  avg_rating?: number
  total_reviews?: number
}

export async function getVets(query = '') {
  const suffix = query ? `?${query}` : ''
  return request<VetListPayload>(`/vets${suffix}`)
}

export async function getVet(vetUuid: string) {
  return request<VetDetailPayload>(`/vets/${vetUuid}`)
}

export async function getReviewsForVet(vetUuid: string) {
  return request<ReviewsPayload>(`/reviews/vet/${vetUuid}`)
}

export async function createReview(payload: {
  appointment_uuid: string
  rating: number
  comment: string
}) {
  return request('/reviews', { method: 'POST', body: JSON.stringify(payload) })
}

export async function getAdBanners() {
  return request('/ad-banners')
}
