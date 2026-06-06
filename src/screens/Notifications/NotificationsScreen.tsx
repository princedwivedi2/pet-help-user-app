import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../services'
import { colors, radius, spacing } from '../../theme'
import { pickArray } from '../../utils/backendAdapters'

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getNotifications('per_page=30')
      const list = pickArray(res?.data, ['notifications', 'items'])
      setNotifications(list)
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleMarkRead(id: string) {
    try {
      await markNotificationRead(id)
      setNotifications(prev => prev.map(n => (String(n.id || n.uuid) === id ? { ...n, read_at: new Date().toISOString() } : n)))
    } catch {
      Alert.alert('Error', 'Could not mark notification as read.')
    }
  }

  async function handleMarkAll() {
    setMarkingAll(true)
    try {
      await markAllNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })))
    } catch {
      Alert.alert('Error', 'Could not mark all as read.')
    } finally {
      setMarkingAll(false)
    }
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
      {!loading && !notifications.length ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>No notifications</Text>
          <Text style={styles.emptyMeta}>You're all caught up.</Text>
        </View>
      ) : null}

      {notifications.map(n => {
        const id = String(n.id || n.uuid || '')
        const isRead = Boolean(n.read_at)
        const title = n.title || n.data?.title || n.type?.replace(/_/g, ' ') || 'Notification'
        const body = n.body || n.data?.body || n.message || ''
        const createdAt = n.created_at ? new Date(n.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''

        return (
          <Pressable
            key={id}
            style={[styles.notifCard, isRead && styles.notifCardRead]}
            onPress={() => { if (!isRead) handleMarkRead(id) }}
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
  content: { padding: spacing.lg, paddingBottom: 44 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.primary, fontWeight: '700', marginTop: 4 },
  markAllBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary },
  markAllText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  emptyMeta: { color: colors.muted, marginTop: 6 },
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
