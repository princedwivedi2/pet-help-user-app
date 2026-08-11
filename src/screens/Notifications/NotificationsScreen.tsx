import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import ErrorCard from '../../components/ErrorCard'
import EmptyState from '../../components/EmptyState'
import PageHeader from '../../components/PageHeader'
import { useNavigation } from '@react-navigation/native'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services'
import { colors, radius, shadows, spacing, typography } from '../../theme'
import { pickArray } from '../../utils/backendAdapters'
import { parseApiError } from '../../utils/apiError'

export default function NotificationsScreen() {
  const nav = useNavigation<any>()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [markingAll, setMarkingAll] = useState(false)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getNotifications('per_page=30')
      const list = pickArray(res?.data, ['notifications', 'items'])
      setNotifications(list)
    } catch (e) {
      setError(parseApiError(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refetch() }, [refetch])

  async function handleMarkRead(id: string) {
    try {
      await markNotificationRead(id)
      setNotifications(prev => prev.map(n => (String(n.id || n.uuid) === id ? { ...n, read_at: new Date().toISOString() } : n)))
    } catch (e) {
      Alert.alert('Error', parseApiError(e))
    }
  }

  async function handleMarkAll() {
    setMarkingAll(true)
    try {
      await markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
    } catch (e) {
      Alert.alert('Error', parseApiError(e))
    } finally {
      setMarkingAll(false)
    }
  }

  // Best-effort in-app deep link: route to the relevant screen when a
  // notification carries a target, mirroring the push-tap handler.
  function handleOpen(n: any, id: string) {
    if (!n.read_at) handleMarkRead(id)
    const data = n.data ?? n
    const screen: string | undefined = data?.screen
    const params = (data?.params ?? {}) as Record<string, unknown>
    const apptId = data?.appointment_uuid ?? params?.appointmentId
    const type = String(n.type ?? data?.type ?? '')

    if (screen === 'AppointmentDetail' || apptId) {
      nav.navigate('AppointmentDetail', { appointmentId: apptId, ...params })
    } else if (screen === 'PaymentHistory' || type.includes('payment') || type.includes('refund')) {
      nav.navigate('PaymentHistory')
    } else if (screen === 'ConsultationRoom' && (data?.consultationId || params?.consultationId)) {
      nav.navigate('ConsultationRoom', { consultationId: data?.consultationId ?? params?.consultationId, ...params })
    }
    // Otherwise stay on the list — nothing actionable to navigate to.
  }

  const unreadCount = notifications.filter(n => !n.read_at).length

  function iconFor(n: any): React.ComponentProps<typeof Ionicons>['name'] {
    const type = String(n.type ?? n.data?.type ?? '').toLowerCase()
    if (type.includes('payment') || type.includes('refund')) return 'card-outline'
    if (type.includes('appointment') || type.includes('booking')) return 'calendar-outline'
    if (type.includes('consult')) return 'videocam-outline'
    if (type.includes('prescription')) return 'medical-outline'
    return 'notifications-outline'
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <PageHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} update${unreadCount === 1 ? '' : 's'} waiting for you` : 'Everything important, in one place'}
        rightIcon={unreadCount > 0 ? 'checkmark-done' : undefined}
        rightLabel="Mark all notifications as read"
        onRightPress={unreadCount > 0 ? handleMarkAll : undefined}
      />
      {markingAll ? <View style={styles.syncRow}><ActivityIndicator size="small" color={colors.primary} /><Text style={styles.syncText}>Updating notifications…</Text></View> : null}

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : null}

      {!loading && error ? <ErrorCard message={error} onRetry={refetch} /> : null}

      {!loading && !error && !notifications.length ? (
        <EmptyState
          emoji="🔔"
          title="All caught up!"
          subtitle="No new notifications right now."
        />
      ) : null}

      {!error && notifications.map(n => {
        const id = String(n.id || n.uuid || '')
        const isRead = Boolean(n.read_at)
        const title = n.title || n.data?.title || n.type?.replace(/_/g, ' ') || 'Notification'
        const body = n.body || n.data?.body || n.message || ''
        const createdAt = n.created_at ? new Date(n.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''

        return (
          <Pressable
            key={id}
            style={[styles.notifCard, isRead && styles.notifCardRead]}
            onPress={() => handleOpen(n, id)}
          >
            <View style={[styles.notifIcon, !isRead && styles.notifIconUnread]}>
              <Ionicons name={iconFor(n)} size={20} color={!isRead ? colors.primary : colors.muted} />
            </View>
            <View style={styles.notifBody}>
              {!isRead ? <Text style={styles.newLabel}>NEW</Text> : null}
              <Text style={[styles.notifTitle, isRead && styles.notifTitleRead]}>{title}</Text>
              {body ? <Text style={styles.notifMessage}>{body}</Text> : null}
              {createdAt ? <Text style={styles.notifTime}>{createdAt}</Text> : null}
            </View>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 48 },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, marginBottom: spacing.md, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  syncText: { ...typography.caption, color: colors.primary },
  notifCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.card,
  },
  notifCardRead: { backgroundColor: colors.surface, shadowOpacity: 0.02 },
  notifIcon: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft },
  notifIconUnread: { backgroundColor: colors.primarySoft },
  notifBody: { flex: 1 },
  newLabel: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 3 },
  notifTitle: { ...typography.bodyStrong, color: colors.text },
  notifTitleRead: { color: colors.text },
  notifMessage: { ...typography.caption, color: colors.muted, marginTop: 3 },
  notifTime: { color: colors.subtle, fontSize: 11, marginTop: 7, fontWeight: '600' },
})
