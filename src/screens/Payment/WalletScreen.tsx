import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, spacing } from '../../theme'
import ErrorCard from '../../components/ErrorCard'
import EmptyState from '../../components/EmptyState'
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
  const nav = useNavigation<any>()
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
      <View style={styles.headerRow}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.pageTitle}>Payments & Wallet</Text>
      </View>

      {wallet ? (
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Wallet Balance</Text>
          <Text style={styles.balanceAmount}>₹{wallet.balance ?? 0}</Text>
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
  content: { padding: spacing.lg, paddingBottom: 48 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, gap: spacing.sm },
  backBtn: { padding: 4 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: colors.text, flex: 1 },
  spinner: { marginTop: spacing.xl },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  balanceLabel: { color: 'rgba(255,247,241,0.85)', fontSize: 13, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  balanceAmount: { color: colors.onPrimary, fontSize: 40, fontWeight: '800', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
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
  },
  txLeft: { flex: 1 },
  txType: { fontSize: 14, fontWeight: '700', color: colors.text },
  txDate: { fontSize: 12, color: colors.muted, marginTop: 2 },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontSize: 16, fontWeight: '800', color: colors.text },
  txBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  txBadgeText: { fontSize: 11, fontWeight: '700' },
})
