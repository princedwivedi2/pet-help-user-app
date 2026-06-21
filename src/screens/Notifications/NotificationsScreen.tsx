import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import ErrorCard from '../../components/ErrorCard'
import EmptyState from '../../components/EmptyState'
import { useNavigation } from '@react-navigation/native'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services'
import { colors, radius, spacing } from '../../theme'
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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 ? <Text style={styles.subtitle}>{unreadCount} unread</Text> : null}
        </View>
        {unreadCount > 0 ? (
          <Pressable style={styles.markAllBtn} onPress={handleMarkAll} disabled={markingAll}>
            {markingAll ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={styles.markAllText}>Mark all read</Text>}
          </Pressable>
        ) : null}
      </View>

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
            {!isRead ? <View style={styles.unreadDot} /> : null}
            <View style={styles.notifBody}>
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
  content: { padding: spacing.lg, paddingBottom: 48 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.primary, fontWeight: '700', marginTop: 4 },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary },
  markAllText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  notifCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  notifCardRead: { borderColor: colors.border, backgroundColor: colors.surfaceSoft },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
  notifBody: { flex: 1 },
  notifTitle: { fontWeight: '800', color: colors.text },
  notifTitleRead: { fontWeight: '600', color: colors.muted },
  notifMessage: { color: colors.muted, marginTop: 4, lineHeight: 18 },
  notifTime: { color: colors.muted, fontSize: 11, marginTop: 6 },
})
