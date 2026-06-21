import { request } from './client'

export type PaymentOrderPayload = {
  id: string
  uuid?: string
  amount?: number
  payment_uuid?: string
  order_id?: string
  razorpay_order_id?: string
  razorpay_key?: string
  payment?: any
}

export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'refund_pending'
  | 'refund_failed'

export interface Payment {
  uuid: string
  amount: number
  currency: string
  status: PaymentStatus
  payable_type: string
  payable_uuid: string
  razorpay_order_id?: string
  razorpay_payment_id?: string
  payment_model?: string
  refund_amount?: number
  refund_reason?: string
  refunded_at?: string
  created_at: string
  updated_at: string
}

export async function createPaymentOrder(payload: {
  payable_type: 'appointment' | 'sos' | 'consultation'
  payable_uuid: string
  payment_model?: 'platform_fee' | 'full_payment'
  amount?: number
}) {
  return request<PaymentOrderPayload>('/payments/create-order', { method: 'POST', body: JSON.stringify(payload) })
}

export async function verifyPayment(payload: {
  payment_uuid: string
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}) {
  return request('/payments/verify', { method: 'POST', body: JSON.stringify(payload) })
}

export async function getPayments(params?: { page?: number; status?: PaymentStatus }) {
  const qs = new URLSearchParams()
  if (params?.page) qs.set('page', String(params.page))
  if (params?.status) qs.set('status', params.status)
  const query = qs.toString() ? `?${qs.toString()}` : ''
  return request<Payment[]>(`/payments${query}`)
}

export async function getPayment(uuid: string) {
  return request<Payment>(`/payments/${uuid}`)
}

export async function refundPayment(paymentUuid: string) {
  return request(`/payments/${paymentUuid}/refund`, { method: 'POST' })
}

export async function mockConfirmPayment(payload: { payment_uuid: string }) {
  return request('/payments/mock-confirm', { method: 'POST', body: JSON.stringify(payload) })
}

export async function getWallet() {
  return request('/payments/wallet')
}
