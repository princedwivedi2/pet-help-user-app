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
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, spacing } from '../../theme'
import { pickArray } from '../../utils/adapters'
import ErrorCard from '../../components/ErrorCard'
import {
  joinConsultation,
  getConsultationMessages,
  sendConsultationMessage,
  completeConsultation,
} from '../../services/consultations'
import { useRtcSession } from '../../services/rtc/useRtcSession'
import { RtcLocalView, RtcRemoteView } from '../../services/rtc/views'

interface ConsultMessage {
  uuid: string
  sender_role?: string
  content: string
  created_at?: string
  _optimistic?: boolean
  _error?: boolean
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

function ConnectionDot({ state }: { state: string }) {
  const bg =
    state === 'connected' ? '#22c55e' :
    state === 'connecting' || state === 'reconnecting' ? '#f59e0b' : '#ef4444'
  return <View style={[styles.dot, { backgroundColor: bg }]} />
}

function MessageBubble({ message, isUser }: { message: ConsultMessage; isUser: boolean }) {
  if (isUser) {
    return (
      <View style={[styles.bubble, styles.userBubble]}>
        <Text style={styles.userText}>{message.content}</Text>
        {message._error ? <Text style={styles.inlineError}>Failed to send.</Text> : null}
      </View>
    )
  }
  return (
    <View style={[styles.bubble, styles.vetBubble]}>
      <Text style={styles.vetText}>{message.content}</Text>
    </View>
  )
}

// ─────────────────────────────────────────────────────────
// Chat-only room (modality === 'chat')
// ─────────────────────────────────────────────────────────
function ChatRoom({
  consultationId,
  vetName,
}: {
  consultationId: string
  vetName?: string
}) {
  const nav = useNavigation<any>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState<ConsultMessage[]>([])
  const [input, setInput] = useState('')

  const init = useCallback(async () => {
    setLoading(true)
    setError('')
    joinConsultation(consultationId).catch(() => undefined)
    try {
      const res = await getConsultationMessages(consultationId)
      setMessages(pickArray(res?.data ?? res, ['messages', 'items']))
    } catch {
      setError('Unable to load messages. Check your connection.')
    } finally {
      setLoading(false)
    }
  }, [consultationId])

  // Silent background poll so the vet's replies appear without a manual refresh.
  // Keeps any still-pending/failed optimistic messages on top of the server list.
  const poll = useCallback(async () => {
    try {
      const res = await getConsultationMessages(consultationId)
      const server = pickArray(res?.data ?? res, ['messages', 'items'])
      setMessages(prev => {
        const temps = prev.filter(
          m => m.uuid.startsWith('t-') &&
            (m._error || !server.some((s: ConsultMessage) => s.content === m.content && s.sender_role === 'user')),
        )
        return [...temps, ...server]
      })
    } catch { /* keep showing what we have */ }
  }, [consultationId])

  useEffect(() => { init() }, [init])

  useEffect(() => {
    const id = setInterval(poll, 5000)
    return () => clearInterval(id)
  }, [poll])

  async function handleSend() {
    const content = input.trim()
    if (!content) return
    const temp: ConsultMessage = {
      uuid: `t-${Date.now()}`,
      sender_role: 'user',
      content,
      _optimistic: true,
    }
    setMessages(prev => [temp, ...prev])
    setInput('')
    try {
      await sendConsultationMessage(consultationId, content)
    } catch {
      setMessages(prev =>
        prev.map(m => m.uuid === temp.uuid ? { ...m, _error: true } : m),
      )
    }
  }

  function handleEnd() {
    Alert.alert('End session?', 'This will close the consultation.', [
      { text: 'Continue' },
      {
        text: 'End',
        style: 'destructive',
        onPress: () => {
          completeConsultation(consultationId).catch(() => undefined)
          nav.goBack()
        },
      },
    ])
  }

  const canSend = input.trim().length > 0

  return (
    <KeyboardAvoidingView
      style={styles.chatScreen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.chatHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.chatHeaderTitle}>
            {vetName ? `Dr. ${vetName}` : 'Your Veterinarian'}
          </Text>
          <Text style={styles.chatBadge}>💬 Chat</Text>
        </View>
        <Pressable onPress={handleEnd} hitSlop={8} accessibilityLabel="End session">
          <Ionicons name="close-circle-outline" size={22} color={colors.danger} />
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        {loading && (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
        {!loading && error ? <ErrorCard message={error} onRetry={init} /> : null}
        {!loading && !error ? (
          <FlatList
            data={messages}
            inverted
            keyExtractor={m => m.uuid}
            renderItem={({ item }) => (
              <MessageBubble message={item} isUser={item.sender_role === 'user'} />
            )}
            contentContainerStyle={{ padding: spacing.md }}
            keyboardShouldPersistTaps="handled"
          />
        ) : null}
      </View>

      <View style={styles.chatInputRow}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message…"
          placeholderTextColor={colors.muted}
          multiline
          returnKeyType="send"
          onSubmitEditing={canSend ? handleSend : undefined}
        />
        <Pressable
          style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!canSend}
          accessibilityLabel="Send"
        >
          <Ionicons name="send" size={20} color={colors.onPrimary} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

// ─────────────────────────────────────────────────────────
// RTC room (modality === 'video' | 'audio')
// ─────────────────────────────────────────────────────────
function RtcRoom({
  consultationId,
  modality,
  vetName,
}: {
  consultationId: string
  modality: 'video' | 'audio'
  vetName?: string
}) {
  const nav = useNavigation<any>()
  const audioOnly = modality === 'audio'
  const rtc = useRtcSession(consultationId, { audioOnly })

  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState<ConsultMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  const [chatInput, setChatInput] = useState('')
  const [ending, setEnding] = useState(false)

  useEffect(() => {
    joinConsultation(consultationId).catch(() => undefined)
  }, [consultationId])

  const loadMessages = useCallback(async () => {
    setChatLoading(true)
    setChatError('')
    try {
      const res = await getConsultationMessages(consultationId)
      setMessages(pickArray(res?.data ?? res, ['messages', 'items']))
    } catch {
      setChatError('Could not load messages.')
    } finally {
      setChatLoading(false)
    }
  }, [consultationId])

  useEffect(() => {
    if (showChat) loadMessages()
  }, [showChat, loadMessages])

  // Poll for new messages while the in-call chat panel is open.
  useEffect(() => {
    if (!showChat) return
    const id = setInterval(async () => {
      try {
        const res = await getConsultationMessages(consultationId)
        const server = pickArray(res?.data ?? res, ['messages', 'items'])
        setMessages(prev => {
          const temps = prev.filter(
            m => m.uuid.startsWith('t-') &&
              (m._error || !server.some((s: ConsultMessage) => s.content === m.content && s.sender_role === 'user')),
          )
          return [...temps, ...server]
        })
      } catch { /* ignore */ }
    }, 5000)
    return () => clearInterval(id)
  }, [showChat, consultationId])

  async function handleSendChat() {
    const content = chatInput.trim()
    if (!content) return
    const temp: ConsultMessage = {
      uuid: `t-${Date.now()}`,
      sender_role: 'user',
      content,
      _optimistic: true,
    }
    setMessages(prev => [temp, ...prev])
    setChatInput('')
    try {
      await sendConsultationMessage(consultationId, content)
    } catch {
      setMessages(prev =>
        prev.map(m => m.uuid === temp.uuid ? { ...m, _error: true } : m),
      )
    }
  }

  function handleEnd() {
    Alert.alert('End Consultation', 'End this session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: async () => {
          setEnding(true)
          try {
            await rtc.leave()
            await completeConsultation(consultationId)
          } catch { /* best effort */ }
          nav.goBack()
        },
      },
    ])
  }

  // Permissions: still checking
  if (rtc.permissionsGranted === null) {
    return (
      <View style={styles.rtcContainer}>
        <ActivityIndicator color="#fff" />
        <Text style={styles.rtcSubtext}>Checking permissions…</Text>
      </View>
    )
  }

  // Permissions denied
  if (rtc.permissionsGranted === false) {
    return (
      <SafeAreaView style={styles.rtcContainer}>
        <View style={styles.stateCentered}>
          <Text style={styles.stateEmoji}>🎙️</Text>
          <Text style={styles.stateTitle}>Permissions Required</Text>
          <Text style={styles.stateBody}>
            {audioOnly
              ? 'Microphone access is required for audio calls. Please enable it in Settings.'
              : 'Camera and microphone access are required for video calls. Please enable them in Settings.'}
          </Text>
          <Pressable style={styles.ghostBtn} onPress={() => nav.goBack()}>
            <Text style={styles.ghostBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  // Token loading
  if (rtc.tokenLoading) {
    return (
      <View style={styles.rtcContainer}>
        <ActivityIndicator color="#fff" size="large" />
        <Text style={styles.rtcSubtext}>Connecting to session…</Text>
      </View>
    )
  }

  // Token error — backend not ready or network failure
  if (rtc.tokenError) {
    return (
      <SafeAreaView style={styles.rtcContainer}>
        <View style={styles.stateCentered}>
          <Text style={styles.stateEmoji}>⚠️</Text>
          <Text style={styles.stateTitle}>Session Unavailable</Text>
          <Text style={styles.stateBody}>
            Could not connect to the call.{'\n'}You can continue via chat.
          </Text>
          <Pressable
            style={styles.chatFallbackBtn}
            onPress={() =>
              nav.replace('ConsultationRoom', {
                consultationId,
                modality: 'chat',
                vetName,
              })
            }
          >
            <Text style={styles.chatFallbackText}>Switch to Chat</Text>
          </Pressable>
          <Pressable style={styles.ghostBtn} onPress={() => nav.goBack()}>
            <Text style={styles.ghostBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  const failed = rtc.connectionState === 'failed'

  return (
    <View style={styles.rtcContainer}>
      {/* Remote video or waiting placeholder */}
      {!audioOnly && rtc.remoteUid !== null ? (
        <RtcRemoteView uid={rtc.remoteUid} style={StyleSheet.absoluteFill as any} />
      ) : (
        <View style={styles.waitingBg}>
          <Text style={styles.waitingEmoji}>{audioOnly ? '📞' : '🐾'}</Text>
          <Text style={styles.waitingText}>
            {rtc.remoteUid === null
              ? 'Waiting for your vet to join…'
              : audioOnly ? 'Audio call in progress' : 'Waiting for vet…'}
          </Text>
        </View>
      )}

      {/* Local video PiP — video mode only */}
      {!audioOnly && (
        <View style={[styles.pip, !rtc.isCameraOn && styles.pipOff]}>
          {rtc.isCameraOn ? (
            <RtcLocalView style={{ flex: 1 }} />
          ) : (
            <Text style={styles.pipOffIcon}>📷</Text>
          )}
        </View>
      )}

      {/* Connection failed overlay */}
      {failed && (
        <View style={styles.failedOverlay}>
          <Text style={styles.stateEmoji}>📡</Text>
          <Text style={styles.stateTitle}>Connection Lost</Text>
          <Text style={styles.stateBody}>
            Your connection to the call was interrupted.{'\n'}
            If you were charged, a refund will be processed automatically.
          </Text>
          <View style={styles.refundBadge}>
            <Text style={styles.refundBadgeText}>⏳ Auto-refund pending</Text>
          </View>
          <Pressable
            style={styles.chatFallbackBtn}
            onPress={() =>
              nav.replace('ConsultationRoom', {
                consultationId,
                modality: 'chat',
                vetName,
              })
            }
          >
            <Text style={styles.chatFallbackText}>Continue via Chat</Text>
          </Pressable>
          <Pressable style={styles.ghostBtn} onPress={() => nav.goBack()}>
            <Text style={styles.ghostBtnText}>Leave Session</Text>
          </Pressable>
        </View>
      )}

      {/* Top status bar */}
      {!failed && (
        <SafeAreaView style={styles.topOverlay} pointerEvents="none">
          <View style={styles.statusBar}>
            <ConnectionDot state={rtc.connectionState} />
            <Text style={styles.statusLabel}>
              {rtc.connectionState === 'connected'
                ? formatDuration(rtc.callSeconds)
                : rtc.connectionState}
            </Text>
            {vetName ? (
              <Text style={styles.vetNameLabel} numberOfLines={1}>
                Dr. {vetName}
              </Text>
            ) : null}
          </View>
        </SafeAreaView>
      )}

      {/* Inline chat panel overlay */}
      {showChat && (
        <KeyboardAvoidingView
          style={styles.chatPanel}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.chatPanelHeader}>
            <Text style={styles.chatPanelTitle}>Chat</Text>
            <Pressable onPress={() => setShowChat(false)} hitSlop={8}>
              <Ionicons name="chevron-down" size={22} color="#fff" />
            </Pressable>
          </View>
          <View style={{ flex: 1 }}>
            {chatLoading && (
              <ActivityIndicator color="#fff" style={{ marginTop: 16 }} />
            )}
            {chatError ? (
              <Text style={styles.chatErrText}>{chatError}</Text>
            ) : null}
            {!chatLoading && !chatError ? (
              <FlatList
                data={messages}
                inverted
                keyExtractor={m => m.uuid}
                renderItem={({ item }) => (
                  <MessageBubble message={item} isUser={item.sender_role === 'user'} />
                )}
                contentContainerStyle={{ padding: spacing.sm }}
                keyboardShouldPersistTaps="handled"
              />
            ) : null}
          </View>
          <View style={styles.chatPanelInputRow}>
            <TextInput
              style={styles.chatPanelInput}
              value={chatInput}
              onChangeText={setChatInput}
              placeholder="Type a message…"
              placeholderTextColor="rgba(255,255,255,0.4)"
              multiline
            />
            <Pressable
              style={[styles.sendBtn, !chatInput.trim() && styles.sendBtnDisabled]}
              onPress={handleSendChat}
              disabled={!chatInput.trim()}
              accessibilityLabel="Send"
            >
              <Ionicons name="send" size={18} color={colors.onPrimary} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Bottom controls */}
      {!failed && (
        <SafeAreaView style={styles.bottomSafe}>
          <View style={styles.controls}>
            {/* Mic */}
            <Pressable
              style={[styles.ctrl, !rtc.isMicOn && styles.ctrlOff]}
              onPress={rtc.toggleMic}
              accessibilityLabel={rtc.isMicOn ? 'Mute microphone' : 'Unmute microphone'}
            >
              <Text style={styles.ctrlIcon}>{rtc.isMicOn ? '🎙️' : '🔇'}</Text>
            </Pressable>

            {/* Camera (video mode only) */}
            {!audioOnly && (
              <Pressable
                style={[styles.ctrl, !rtc.isCameraOn && styles.ctrlOff]}
                onPress={rtc.toggleCamera}
                accessibilityLabel={rtc.isCameraOn ? 'Turn off camera' : 'Turn on camera'}
              >
                <Text style={styles.ctrlIcon}>{rtc.isCameraOn ? '📹' : '📷'}</Text>
              </Pressable>
            )}

            {/* End call */}
            <Pressable
              style={styles.ctrlEnd}
              onPress={handleEnd}
              disabled={ending}
              accessibilityLabel="End call"
            >
              {ending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.ctrlEndText}>End</Text>
              )}
            </Pressable>

            {/* Flip camera (video only) */}
            {!audioOnly && (
              <Pressable
                style={styles.ctrl}
                onPress={rtc.switchCamera}
                accessibilityLabel="Switch camera"
              >
                <Text style={styles.ctrlIcon}>🔄</Text>
              </Pressable>
            )}

            {/* Chat toggle */}
            <Pressable
              style={[styles.ctrl, showChat && styles.ctrlActive]}
              onPress={() => setShowChat(v => !v)}
              accessibilityLabel="Toggle chat"
            >
              <Text style={styles.ctrlIcon}>💬</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      )}
    </View>
  )
}

// ─────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────
export default function ConsultationRoomScreen() {
  const route = useRoute<any>()
  const { consultationId, modality, vetName } = (route.params ?? {}) as {
    consultationId?: string
    modality?: 'video' | 'audio' | 'chat'
    vetName?: string
  }

  if (!consultationId) {
    return (
      <View style={styles.centered}>
        <ErrorCard message="No consultation ID provided." onRetry={() => undefined} />
      </View>
    )
  }

  if (modality === 'chat') {
    return <ChatRoom consultationId={consultationId} vetName={vetName} />
  }

  return (
    <RtcRoom
      consultationId={consultationId}
      modality={modality ?? 'video'}
      vetName={vetName}
    />
  )
}

const styles = StyleSheet.create({
  // ── Chat room ──
  chatScreen: { flex: 1, backgroundColor: colors.bg },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  chatHeaderTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  chatBadge: { fontSize: 12, color: colors.muted, marginTop: 2 },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  textInput: {
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

  // ── Shared message bubbles ──
  bubble: {
    maxWidth: '75%',
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  userBubble: { backgroundColor: colors.primary, alignSelf: 'flex-end' },
  vetBubble: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  userText: { fontSize: 14, color: colors.onPrimary, lineHeight: 20 },
  vetText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  inlineError: { fontSize: 12, color: colors.danger, marginTop: 2 },

  // ── Shared buttons ──
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: colors.border },

  // ── RTC room ──
  rtcContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rtcSubtext: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 12,
  },
  waitingBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  waitingEmoji: { fontSize: 56 },
  waitingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
  },

  // Local video PiP
  pip: {
    position: 'absolute',
    top: 90,
    right: 16,
    width: 100,
    height: 140,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  pipOff: {
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pipOffIcon: { fontSize: 28 },

  // Top status bar
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  vetNameLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginLeft: 6,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Bottom controls
  bottomSafe: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 20,
    paddingBottom: 28,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  ctrl: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctrlOff: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    opacity: 0.6,
  },
  ctrlActive: {
    backgroundColor: 'rgba(255,107,44,0.5)',
  },
  ctrlIcon: { fontSize: 22 },
  ctrlEnd: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctrlEndText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Chat panel overlay
  chatPanel: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    height: 320,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  chatPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  chatPanelTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  chatPanelInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  chatPanelInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.sm,
    padding: spacing.sm,
    color: '#fff',
    fontSize: 14,
    maxHeight: 80,
  },
  chatErrText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 16, fontSize: 13 },

  // State screens
  stateCentered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  stateEmoji: { fontSize: 52, marginBottom: spacing.md },
  stateTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  stateBody: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },

  // Connection failed overlay
  failedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  refundBadge: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.5)',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xl,
  },
  refundBadgeText: { color: '#f59e0b', fontWeight: '600', fontSize: 13 },

  chatFallbackBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  chatFallbackText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  ghostBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  ghostBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },

  // Misc
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
