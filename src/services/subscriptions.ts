import { request } from './client'

export async function getSubscriptionPlans() {
  return request('/subscription-plans')
}

export async function getActiveSubscription() {
  return request('/subscriptions/active')
}

export async function createSubscriptionOrder(planUuid: string) {
  return request('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ action: 'create_order', plan_uuid: planUuid }),
  })
}

export async function verifySubscription(payload: {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}) {
  return request('/subscriptions', {
    method: 'POST',
    body: JSON.stringify({ action: 'verify', ...payload }),
  })
}
