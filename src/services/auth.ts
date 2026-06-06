import { request } from './client'

export type AuthUser = {
  id: string
  name: string
  email?: string
  phone?: string
  role?: string
  avatar_url?: string
  email_verified_at?: string | null
}

export type LoginPayload = {
  token: string
  user?: AuthUser
  loginNotice?: string
}

export async function me() {
  return request<AuthUser>('/auth/me')
}

export async function login(payload: { email?: string; phone?: string; password?: string }) {
  return request<LoginPayload>('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
}

export async function register(payload: {
  name: string
  email?: string
  phone?: string
  password: string
  password_confirmation?: string
}) {
  return request<LoginPayload>('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
}

export async function sendOtp(payload: { identifier: string }) {
  return request<{ message?: string }>('/auth/otp/send', { method: 'POST', body: JSON.stringify(payload) })
}

export async function verifyOtp(payload: { identifier: string; code: string }) {
  return request<LoginPayload>('/auth/otp/verify', { method: 'POST', body: JSON.stringify(payload) })
}

export async function forgotPassword(payload: { email: string }) {
  return request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload) })
}

export async function resetPassword(payload: {
  email: string
  password: string
  password_confirmation: string
  token: string
}) {
  return request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) })
}

export async function logout() {
  return request('/auth/logout', { method: 'POST' })
}

export async function updateProfile(payload: Record<string, unknown>) {
  return request('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) })
}

export async function changePassword(payload: {
  current_password: string
  password: string
  password_confirmation: string
}) {
  return request('/auth/change-password', { method: 'PUT', body: JSON.stringify(payload) })
}

export async function deleteAccount() {
  return request('/auth/account', { method: 'DELETE' })
}

export async function resendVerificationEmail() {
  return request('/auth/email/resend', { method: 'POST' })
}

export async function registerDeviceToken(payload: { token: string; platform: string }) {
  return request('/auth/device-token', { method: 'POST', body: JSON.stringify(payload) })
}
