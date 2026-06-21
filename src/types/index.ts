// Re-export API types for use across the app
export type { AuthUser, LoginPayload } from '../services/auth'
export type { AppointmentPayload, AppointmentsPayload, SlotsPayload } from '../services/appointments'
export type { PaymentOrderPayload } from '../services/payments'
export type { VetListPayload, VetDetailPayload, ReviewsPayload } from '../services/vets'
export type { PetsPayload } from '../services/pets'
export type { NotificationsPayload } from '../services/notifications'
export type { ApiResponse } from '../services/client'
export type { SelectOption } from '../utils/adapters'

// Navigation param types
export type RootStackParamList = {
  Splash: undefined
  'Auth.Login': undefined
  Main: undefined
  NearbyVets: undefined
  VetDetail: { vetId?: string; vet?: any }
  Booking: { vetId?: string; vet?: any }
  Payment: { appointmentId: string; amount: number; appointment?: any; vetName?: string }
  Notifications: undefined
  PetRecords: { petId: string; pet?: any }
  Blog: undefined
  Subscriptions: undefined
  Consultation: { consultationId?: string }
  Chat: undefined
}
