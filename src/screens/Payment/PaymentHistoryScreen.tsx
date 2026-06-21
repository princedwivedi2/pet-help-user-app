import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, FlatList, Pressable, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { getPayments } from '../../services'
import { parseApiError } from '../../utils/apiError'
import type { Payment } from '../../services/payments'
import ErrorCard from '../../components/ErrorCard'
import EmptyState from '../../components/EmptyState'
import { colors, radius, spacing } from '../../theme'

function statusColor(s: Payment['status']): string {
  switch (s) {
    case 'paid': return colors.accent
    case 'refunded': return colors.warning
    case 'refund_pending': return colors.warning
    case 'failed':
    case 'refund_failed': return colors.danger
    default: return colors.muted
  }
}

function statusLabel(s: Payment['status']): string {
  switch (s) {
    case 'paid': return 'Paid'
    case 'pending': return 'Pending'
    case 'failed': return 'Failed'
    case 'refunded': return 'Refunded'
    case 'refund_pending': return 'Refund pending'
    case 'refund_failed': return 'Refund failed'
    default: return s
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
}

function payableLabel(type: string) {
  switch (type) {
    case 'appointment': return 'Appointment'
    case 'consultation': return 'Consultation'
    default: return type.replace(/_/g, ' ')
  }
}

export default function PaymentHistoryScreen() {
  const nav = useNavigation<any>()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError('')
    try {
      const res = await getPayments()
      if (res?.success) {
        const list: Payment[] = Array.isArray(res.data)
          ? res.data
          : Array.isArray((res.data as any)?.payments)
            ? (res.data as any).payments
            : []
        setPayments(list)
      } else {
        setError(res?.message || 'Could not load payment history.')
      }
    } catch (e) {
      setError(parseApiError(e))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    load(true)
  }, [load])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Payment history</Text>
      </View>

      {error ? (
        <View style={styles.pad}>
          <ErrorCard message={error} onRetry={() => load()} />
        </View>
      ) : (
        <FlatList
          data={payments}
          keyExtractor={item => item.uuid}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState emoji="💳" title="No payments yet" subtitle="Completed payments will appear here." />}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => nav.navigate('PaymentDetail', { paymentUuid: item.uuid })}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowType}>{payableLabel(item.payable_type)}</Text>
                <Text style={styles.rowDate}>{formatDate(item.created_at)}</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.rowAmount}>₹{(item.amount / 100).toFixed(0)}</Text>
                <View style={[styles.badge, { borderColor: statusColor(item.status) }]}>
                  <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>{statusLabel(item.status)}</Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: 56, paddingBottom: spacing.md },
  backBtn: { marginBottom: spacing.sm },
  backText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  pad: { padding: spacing.lg },
  list: { padding: spacing.lg, paddingBottom: 48, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  rowLeft: { flex: 1 },
  rowType: { fontWeight: '700', color: colors.text, fontSize: 15 },
  rowDate: { color: colors.muted, fontSize: 12, marginTop: 4 },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  rowAmount: { fontWeight: '900', color: colors.text, fontSize: 18 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
})
