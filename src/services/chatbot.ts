import { request } from './client'

export async function getChatbotSessions() {
  return request('/chatbot/sessions')
}

export async function createChatbotSession() {
  return request('/chatbot/sessions', { method: 'POST' })
}

export async function deleteChatbotSession(sessionUuid: string) {
  return request(`/chatbot/sessions/${sessionUuid}`, { method: 'DELETE' })
}

export async function getChatbotMessages(sessionUuid: string) {
  return request(`/chatbot/sessions/${sessionUuid}/messages`)
}

export async function sendChatbotMessage(sessionUuid: string, content: string) {
  return request(`/chatbot/sessions/${sessionUuid}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}
