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

export async function createPaymentOrder(payload: {
  payable_type: 'appointment' | 'sos'
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

export async function refundPayment(paymentUuid: string) {
  return request(`/payments/${paymentUuid}/refund`, { method: 'POST' })
}
