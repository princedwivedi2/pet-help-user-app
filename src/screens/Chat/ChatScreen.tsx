import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, shadows, spacing, typography } from '../../theme'
import { pickArray } from '../../utils/adapters'
import {
  getChatbotSessions,
  createChatbotSession,
  getChatbotMessages,
  sendChatbotMessage,
} from '../../services/chatbot'
import ErrorCard from '../../components/ErrorCard'
import EmptyState from '../../components/EmptyState'

interface ChatMessage {
  uuid: string
  role: 'user' | 'bot' | 'assistant'
  content: string
  created_at?: string
  _optimistic?: boolean
  _thinking?: boolean
  _error?: boolean
}

function formatTime(iso?: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  } catch {
    return ''
  }
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <View style={styles.userBubble}>
        <Text style={styles.userText}>{message.content}</Text>
        {message.created_at ? (
          <Text style={styles.userTimestamp}>{formatTime(message.created_at)}</Text>
        ) : null}
      </View>
    )
  }

  return (
    <View style={styles.botMessageRow}>
      <View style={styles.botAvatar}><Ionicons name="paw" size={15} color={colors.primary} /></View>
      <View style={styles.botBubble}>
        <Text style={[styles.botText, message._thinking && styles.thinkingText]}>{message.content}</Text>
        {message._error ? <Text style={styles.inlineError}>Message failed to send. Try again.</Text> : null}
        {message.created_at ? <Text style={styles.botTimestamp}>{formatTime(message.created_at)}</Text> : null}
      </View>
    </View>
  )
}

export default function ChatScreen() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionUuid, setSessionUuid] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const inputRef = useRef<TextInput>(null)

  const init = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const sessRes = await getChatbotSessions()
      const sessions = pickArray(sessRes?.data ?? sessRes, ['sessions', 'chatbot_sessions'])
      if (sessions.length > 0) {
        const latest = sessions[0]
        const uuid: string = (latest as any).uuid ?? (latest as any).id
        setSessionUuid(uuid)
        const msgRes = await getChatbotMessages(uuid)
        const msgs = pickArray(msgRes?.data ?? msgRes, ['messages', 'chatbot_messages'])
        setMessages(msgs)
      } else {
        const newSess = await createChatbotSession()
        const newData: any = newSess?.data ?? newSess
        const newUuid: string = newData?.uuid ?? newData?.id ?? ''
        setSessionUuid(newUuid)
        setMessages([])
      }
    } catch {
      setError('Unable to load. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    init()
  }, [init])

  async function handleNewConversation() {
    try {
      const newSess = await createChatbotSession()
      const newData: any = newSess?.data ?? newSess
      const newUuid: string = newData?.uuid ?? newData?.id ?? ''
      setSessionUuid(newUuid)
      setMessages([])
    } catch {
      // silently ignore — user can retry
    }
  }

  async function handleSend() {
    const content = input.trim()
    if (!content || !sessionUuid) return

    const tempUserMsg: ChatMessage = {
      uuid: `temp-user-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    const thinkingMsg: ChatMessage = {
      uuid: `temp-thinking-${Date.now()}`,
      role: 'bot',
      content: 'Thinking...',
      _thinking: true,
    }

    setMessages(prev => [thinkingMsg, tempUserMsg, ...prev])
    setInput('')

    try {
      const res = await sendChatbotMessage(sessionUuid, content)
      const resData: any = res?.data ?? res
      const botMsg: ChatMessage = {
        uuid: `bot-${Date.now()}`,
        role: 'bot',
        content: resData?.content ?? resData?.message ?? 'Got it!',
        created_at: new Date().toISOString(),
        ...resData,
      }
      setMessages(prev =>
        prev.map(m => (m._thinking ? botMsg : m)),
      )
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m._thinking
            ? {
                ...m,
                content: 'Message failed to send. Try again.',
                _thinking: false,
                _error: true,
              }
            : m,
        ),
      )
    }
  }

  const canSend = input.trim().length > 0 && !!sessionUuid

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIdentity}><View style={styles.headerIcon}><Ionicons name="sparkles" size={20} color={colors.primary} /></View><View><Text style={styles.headerTitle}>Respaw assistant</Text><Text style={styles.headerSubtitle}>General guidance for your pet</Text></View></View>
        <Pressable
          onPress={handleNewConversation}
          accessible
          accessibilityLabel="New conversation"
          style={styles.newConversation}
        >
          <Ionicons name="add" size={21} color={colors.primary} />
        </Pressable>
      </View>

      {/* Message area */}
      <View style={styles.messageArea}>
        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} size="large" accessibilityLabel="Loading" />
          </View>
        )}

        {!loading && error ? (
          <ErrorCard message={error} onRetry={init} />
        ) : null}

        {!loading && !error && sessionUuid && messages.length === 0 ? (
          <EmptyState
            emoji="🤖"
            title="Start a conversation"
            subtitle="Ask me anything about your pet's health."
          />
        ) : null}

        {!loading && !error && messages.length > 0 ? (
          <FlatList
            data={messages}
            inverted
            keyExtractor={m => m.uuid}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
            keyboardShouldPersistTaps="handled"
          />
        ) : null}
      </View>

      {/* Input row */}
      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your pet's health..."
          placeholderTextColor={colors.muted}
          multiline
          returnKeyType="send"
          onSubmitEditing={canSend ? handleSend : undefined}
        />
        <Pressable
          style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!canSend}
          accessible
          accessibilityLabel="Send message"
        >
          <Ionicons name="send" size={20} color={colors.onPrimary} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerIdentity: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  headerTitle: { ...typography.h3, color: colors.text },
  headerSubtitle: { ...typography.caption, color: colors.muted, marginTop: 1 },
  newConversation: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
  messageArea: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
  botMessageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, maxWidth: '88%', marginBottom: spacing.md },
  botAvatar: { width: 30, height: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  botBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    flexShrink: 1,
    padding: spacing.md,
    ...shadows.card,
  },
  botText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  thinkingText: { color: colors.muted },
  botTimestamp: { fontSize: 12, color: colors.muted, marginTop: 2 },
  inlineError: { fontSize: 12, color: colors.danger, marginTop: 2 },
  userBubble: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    maxWidth: '75%',
    padding: spacing.md,
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
  },
  userText: { fontSize: 14, color: colors.onPrimary, lineHeight: 20 },
  userTimestamp: { fontSize: 12, color: colors.onPrimary, marginTop: 2, opacity: 0.8 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: colors.border },
})
