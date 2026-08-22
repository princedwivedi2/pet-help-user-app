import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRoute } from '@react-navigation/native'
import { getPayment } from '../../services'
import type { Payment } from '../../services/payments'
import ErrorCard from '../../components/ErrorCard'
import PageHeader from '../../components/PageHeader'
import { colors, radius, shadows, spacing, typography } from '../../theme'

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

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString([], {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  )
}

export default function PaymentDetailScreen() {
  const route = useRoute<any>()
  const { paymentUuid } = (route.params || {}) as { paymentUuid: string }

  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getPayment(paymentUuid)
      if (res?.success && res.data) {
        setPayment(res.data as Payment)
      } else {
        setError(res?.message || 'Could not load payment details.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }, [paymentUuid])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <PageHeader title="Payment details" subtitle="A clear record of this transaction" />

      {error ? (
        <ErrorCard message={error} onRetry={load} />
      ) : payment ? (
        <>
          <View style={[styles.statusBanner, { backgroundColor: statusColor(payment.status) + '18', borderColor: statusColor(payment.status) + '55' }]}>
            <Ionicons name={payment.status === 'paid' ? 'checkmark-circle' : payment.status === 'failed' ? 'alert-circle' : 'time'} size={20} color={statusColor(payment.status)} />
            <Text style={[styles.statusText, { color: statusColor(payment.status) }]}>
              {statusLabel(payment.status)}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.amountHeader}><View style={styles.amountIcon}><Ionicons name="receipt-outline" size={20} color={colors.primary} /></View><Text style={styles.amountLabel}>TOTAL PAID</Text></View>
            <Text style={styles.amount}>₹{(payment.amount / 100).toFixed(0)}</Text>

            <View style={styles.divider} />

            <Row label="Payment ID" value={payment.uuid.slice(0, 8).toUpperCase()} />
            <Row label="Type" value={payment.payable_type.replace(/_/g, ' ')} />
            <Row label="Date" value={formatDate(payment.created_at)} />
            {payment.razorpay_order_id ? <Row label="Razorpay order" value={payment.razorpay_order_id} /> : null}
            {payment.razorpay_payment_id ? <Row label="Razorpay payment" value={payment.razorpay_payment_id} /> : null}
          </View>

          {(payment.status === 'refunded' || payment.status === 'refund_pending' || payment.status === 'refund_failed') ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Refund details</Text>
              {payment.refund_amount != null ? (
                <Row label="Refund amount" value={`₹${(payment.refund_amount / 100).toFixed(0)}`} />
              ) : null}
              {payment.refund_reason ? <Row label="Reason" value={payment.refund_reason} /> : null}
              {payment.refunded_at ? <Row label="Processed at" value={formatDate(payment.refunded_at)} /> : null}
              {payment.status === 'refund_pending' ? (
                <Text style={styles.refundNote}>Your refund has been initiated and typically arrives in 5–7 business days.</Text>
              ) : null}
              {payment.status === 'refund_failed' ? (
                <Text style={[styles.refundNote, { color: colors.danger }]}>The refund attempt failed. Please contact support.</Text>
              ) : null}
            </View>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  statusBanner: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statusText: { fontWeight: '800', fontSize: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardTitle: { fontWeight: '800', color: colors.text, fontSize: 15, marginBottom: spacing.sm },
  amountHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  amountIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  amountLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  amount: { fontSize: 42, fontWeight: '900', color: colors.text, marginTop: spacing.md, letterSpacing: -1.2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: { ...typography.caption, color: colors.muted, flex: 1 },
  rowValue: { ...typography.caption, color: colors.text, fontWeight: '700', flex: 1, textAlign: 'right' },
  refundNote: { marginTop: spacing.sm, color: colors.muted, lineHeight: 18, fontSize: 13 },
})
