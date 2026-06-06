import { request } from './client'

export type NotificationsPayload = {
  notifications?: any[]
  unread_count?: number
  pagination?: any
}

export async function getUnreadNotificationCount() {
  return request<{ unread_count?: number }>('/notifications/unread-count')
}

export async function getNotifications(query = '') {
  const suffix = query ? `?${query}` : ''
  return request<NotificationsPayload>(`/notifications${suffix}`)
}

export async function markNotificationRead(notificationId: string) {
  return request(`/notifications/${notificationId}/read`, { method: 'PUT' })
}

export async function markAllNotificationsRead() {
  return request('/notifications/read-all', { method: 'PUT' })
}
