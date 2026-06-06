import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, spacing } from '../../theme'
import { pickArray } from '../../utils/adapters'
import ErrorCard from '../../components/ErrorCard'
import {
  joinConsultation,
  getConsultation,
  getConsultationMessages,
  sendConsultationMessage,
} from '../../services/consultations'

interface ConsultMessage {
  uuid: string
  sender_role?: 'user' | 'vet' | string
  content: string
  created_at?: string
  _optimistic?: boolean
  _error?: boolean
}

function MessageBubble({ message, isUser }: { message: ConsultMessage; isUser: boolean }) {
  if (isUser) {
    return (
      <View style={styles.userBubble}>
        <Text style={styles.userText}>{message.content}</Text>
        {message._error ? (
          <Text style={styles.inlineError}>Message failed to send. Try again.</Text>
        ) : null}
      </View>
    )
  }
  return (
    <View style={styles.vetBubble}>
      <Text style={styles.vetText}>{message.content}</Text>
    </View>
  )
}

function modalityEmoji(modality?: string): string {
  if (modality === 'video') return '🎥'
  if (modality === 'audio') return '📞'
  return '💬'
}

function modalityLabel(modality?: string): string {
  if (modality === 'video') return 'Video Call'
  if (modality === 'audio') return 'Audio Call'
  return 'Chat'
}

export default function ConsultationRoomScreen() {
  const nav = useNavigation<any>()
  const route = useRoute<any>()
  const { consultationId, modality, vetName } = (route.params ?? {}) as {
    consultationId?: string
    modality?: 'video' | 'audio' | 'chat'
    vetName?: string
  }

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState<ConsultMessage[]>([])
  const [input, setInput] = useState('')

  const init = useCallback(async () => {
    if (!consultationId) return
    setLoading(true)
    setError('')

    // Fire-and-forget join
    joinConsultation(consultationId).catch(() => undefined)

    try {
      // Tolerate failure on consultation detail
      getConsultation(consultationId).catch(() => undefined)

      const msgRes = await getConsultationMessages(consultationId)
      const msgs = pickArray(msgRes?.data ?? msgRes, ['messages', 'items'])
      setMessages(msgs)
    } catch {
      setError('Unable to load. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [consultationId])

  useEffect(() => {
    init()
  }, [init])

  async function handleSend() {
    const content = input.trim()
    if (!content || !consultationId) return

    const tempMsg: ConsultMessage = {
      uuid: `temp-${Date.now()}`,
      sender_role: 'user',
      content,
      created_at: new Date().toISOString(),
      _optimistic: true,
    }

    setMessages(prev => [tempMsg, ...prev])
    setInput('')

    try {
      await sendConsultationMessage(consultationId, content)
    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.uuid === tempMsg.uuid ? { ...m, _error: true } : m,
        ),
      )
    }
  }

  function handleEndSession() {
    Alert.alert(
      'End session?',
      'This will close the consultation.',
      [
        { text: 'Continue' },
        { text: 'End session', style: 'destructive', onPress: () => nav.goBack() },
      ],
    )
  }

  const canSend = input.trim().length > 0 && !!consultationId
  const showVideoBanner = modality === 'video' || modality === 'audio'

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>
            {vetName ? `Dr. ${vetName}` : 'Your Veterinarian'}
          </Text>
          <View style={styles.modalityBadge}>
            <Text style={styles.modalityBadgeText}>
              {modalityEmoji(modality)} {modalityLabel(modality)}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={handleEndSession}
          accessible
          accessibilityLabel="End session"
          hitSlop={8}
        >
          <Ionicons name="close-circle-outline" size={22} color={colors.danger} />
        </Pressable>
      </View>

      {/* Video/audio coming-soon banner */}
      {showVideoBanner ? (
        <View style={styles.videoBanner}>
          <Text style={styles.videoBannerText}>
            Video/audio call functionality is coming soon. You can chat below.
          </Text>
        </View>
      ) : null}

      {/* Message area */}
      <View style={styles.messageArea}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} size="large" accessibilityLabel="Loading" />
          </View>
        ) : null}

        {!loading && error ? (
          <ErrorCard message={error} onRetry={init} />
        ) : null}

        {!loading && !error ? (
          <FlatList
            data={messages}
            inverted
            keyExtractor={m => m.uuid}
            renderItem={({ item }) => {
              const isUser = item.sender_role === 'user'
              return <MessageBubble message={item} isUser={isUser} />
            }}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        ) : null}
      </View>

      {/* Input row */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: { flex: 1, gap: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  modalityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalityBadgeText: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  videoBanner: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: spacing.md,
    margin: spacing.md,
  },
  videoBannerText: { fontSize: 14, color: colors.text },
  messageArea: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
  listContent: { padding: spacing.md },
  vetBubble: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    maxWidth: '75%',
    padding: spacing.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  vetText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  userBubble: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    maxWidth: '75%',
    padding: spacing.sm,
    alignSelf: 'flex-end',
    marginBottom: spacing.sm,
  },
  userText: { fontSize: 14, color: colors.onPrimary, lineHeight: 20 },
  inlineError: { fontSize: 12, color: colors.danger, marginTop: 2 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
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
