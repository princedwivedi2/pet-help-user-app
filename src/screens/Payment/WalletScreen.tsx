import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, shadows, spacing, typography } from '../../theme'
import ErrorCard from '../../components/ErrorCard'
import EmptyState from '../../components/EmptyState'
import PageHeader from '../../components/PageHeader'
import { getPayments, getWallet } from '../../services'
import { pickArray } from '../../utils/backendAdapters'
import { parseApiError } from '../../utils/apiError'

const STATUS_COLOR: Record<string, string> = {
  paid: colors.accent,
  pending: colors.warning,
  failed: colors.danger,
  refunded: colors.muted,
  refund_pending: colors.warning,
  refund_failed: colors.danger,
}

export default function WalletScreen() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [wallet, setWallet] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])

  const refetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [walletRes, paymentsRes] = await Promise.allSettled([
        getWallet(),
        getPayments(),
      ])

      if (walletRes.status === 'fulfilled') {
        const data = walletRes.value?.data as any
        setWallet(data?.wallet ?? null)
        const txList = pickArray(data, ['transactions'])
        if (txList.length) setTransactions(txList)
      }

      if (paymentsRes.status === 'fulfilled') {
        const data = paymentsRes.value?.data as any
        const list = pickArray(data, ['payments', 'items'])
        if (list.length) setTransactions(prev => prev.length ? prev : list)
      }
    } catch (e) {
      setError(parseApiError(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refetch() }, [refetch])

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <PageHeader title="Payments & wallet" subtitle="Balance, refunds, and recent activity" />

      {wallet ? (
        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}><View style={styles.balanceIcon}><Ionicons name="wallet-outline" size={22} color={colors.onPrimary} /></View><Text style={styles.balanceLabel}>RESPAW WALLET</Text></View>
          <Text style={styles.balanceAmount}>₹{wallet.balance ?? 0}</Text>
          <Text style={styles.balanceHint}>Available for upcoming care and eligible refunds</Text>
        </View>
      ) : null}

      {loading ? <ActivityIndicator color={colors.primary} style={styles.spinner} /> : null}
      {!loading && error ? <ErrorCard message={error} onRetry={refetch} /> : null}

      {!loading && !error ? (
        <>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {transactions.length === 0 ? (
            <EmptyState emoji="💳" title="No transactions yet" subtitle="Your payment history will appear here." />
          ) : (
            transactions.map((tx: any, i: number) => (
              <TransactionRow key={tx.uuid || tx.id || String(i)} tx={tx} />
            ))
          )}
        </>
      ) : null}
    </ScrollView>
  )
}

function TransactionRow({ tx }: { tx: any }) {
  const status = tx.status ?? 'pending'
  const amount = tx.amount ?? 0
  const type = tx.payable_type ?? tx.payment_model ?? ''
  const date = tx.created_at
    ? new Date(tx.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })
    : ''
  const typeLabel = type === 'appointment' ? 'Appointment'
    : type === 'consultation' ? 'Consultation'
    : type === 'subscription' ? 'Subscription'
    : type || 'Payment'

  return (
    <View style={styles.txRow}>
      <View style={styles.txIcon}><Ionicons name={type === 'subscription' ? 'sparkles-outline' : type === 'consultation' ? 'videocam-outline' : 'calendar-outline'} size={18} color={colors.primary} /></View>
      <View style={styles.txLeft}>
        <Text style={styles.txType}>{typeLabel}</Text>
        {date ? <Text style={styles.txDate}>{date}</Text> : null}
      </View>
      <View style={styles.txRight}>
        <Text style={styles.txAmount}>₹{amount}</Text>
        <View style={[styles.txBadge, { backgroundColor: `${STATUS_COLOR[status] ?? colors.muted}22` }]}>
          <Text style={[styles.txBadgeText, { color: STATUS_COLOR[status] ?? colors.muted }]}>{status.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 48 },
  spinner: { marginTop: spacing.xl },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadows.floating,
  },
  balanceTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  balanceIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)' },
  balanceLabel: { color: 'rgba(255,247,241,0.82)', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  balanceAmount: { color: colors.onPrimary, fontSize: 42, fontWeight: '900', marginTop: spacing.lg, letterSpacing: -1.2 },
  balanceHint: { ...typography.caption, color: 'rgba(255,247,241,0.72)', marginTop: 5, maxWidth: 250 },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
    ...shadows.card,
  },
  txIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  txLeft: { flex: 1 },
  txType: { ...typography.bodyStrong, color: colors.text },
  txDate: { ...typography.caption, color: colors.muted, marginTop: 2 },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontSize: 16, fontWeight: '800', color: colors.text },
  txBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  txBadgeText: { fontSize: 11, fontWeight: '700' },
})
