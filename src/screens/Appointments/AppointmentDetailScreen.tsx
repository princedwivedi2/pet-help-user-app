import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, spacing } from '../../theme'
import ErrorCard from '../../components/ErrorCard'
import { getAppointment, cancelAppointment } from '../../services/appointments'

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  pending: { bg: colors.sky, text: colors.warning },
  confirmed: { bg: colors.primarySoft, text: colors.primary },
  completed: { bg: colors.mint, text: colors.accent },
  cancelled: { bg: colors.dangerSoft, text: colors.danger },
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_BADGE[status] ?? STATUS_BADGE.pending
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.badgeText, { color: style.text }]}>{status.toUpperCase()}</Text>
    </View>
  )
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  )
}

export default function AppointmentDetailScreen() {
  const nav = useNavigation<any>()
  const route = useRoute<any>()
  const { appointmentId, appointment: routeAppt } = route.params ?? {}

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState<any>(routeAppt ?? null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAppointment(appointmentId)
      setData(res?.data ?? res)
    } catch {
      setError('Unable to load. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [appointmentId])

  useEffect(() => { refetch() }, [refetch])

  const appt = data?.appointment ?? data ?? {}
  const raw = appt.raw ?? appt

  const vetName = raw.vet_name ?? raw.vet?.name ?? appt.vet ?? 'Veterinarian'
  const scheduledAt = raw.scheduled_at ?? raw.start_at ?? appt.when ?? ''
  const formattedDate = scheduledAt
    ? new Date(scheduledAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : appt.when ?? 'Scheduled soon'
  const status = raw.status ?? appt.status ?? 'pending'
  const type = raw.appointment_type ?? raw.type ?? ''
  const petName = raw.pet_name ?? raw.pet?.name ?? appt.pet ?? ''
  const reason = raw.reason ?? appt.title ?? ''
  const address = raw.home_address ?? raw.address ?? ''
  const isHomeVisit = type === 'home_visit' || type === 'home visit'
  const fee = raw.consultation_fee ?? raw.fee ?? ''
  const paymentStatus = raw.payment_status ?? raw.payment?.status ?? ''

  function handleCancel() {
    Alert.alert(
      'Cancel appointment?',
      'This will cancel your booking. This action cannot be undone.',
      [
        { text: 'Keep it' },
        {
          text: 'Cancel appointment',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAppointment(appointmentId, 'Cancelled by user')
            } catch { /* ignore */ }
            nav.goBack()
          },
        },
      ],
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => nav.goBack()} accessibilityLabel="Go back" style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.pageTitle}>Appointment Details</Text>
      </View>

      {loading && !data ? <ActivityIndicator color={colors.primary} style={styles.spinner} /> : null}
      {!loading && error ? <ErrorCard message={error} onRetry={refetch} /> : null}

      {data ? (
        <>
          {/* Status card */}
          <View style={styles.card}>
            <Text style={styles.vetName}>{vetName}</Text>
            <Text style={styles.dateText}>{formattedDate}</Text>
            <View style={styles.badgeRow}>
              <StatusBadge status={status} />
              {type ? (
                <View style={[styles.badge, styles.typeBadge]}>
                  <Text style={[styles.badgeText, { color: colors.muted }]}>{type.replace('_', ' ').toUpperCase()}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Details card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Details</Text>
            <DetailRow label="Pet" value={petName} />
            <DetailRow label="Reason" value={reason} />
            {isHomeVisit ? <DetailRow label="Address" value={address} /> : null}
          </View>

          {/* Payment card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment</Text>
            {fee ? <DetailRow label="Consultation fee" value={`₹${fee}`} /> : null}
            <DetailRow label="Payment status" value={paymentStatus || 'Pending'} />
          </View>

          {/* Actions card */}
          {(status === 'pending' || status === 'confirmed') ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Actions</Text>
              <Pressable style={[styles.actionBtn, styles.rescheduleBtn]}>
                <Text style={styles.rescheduleBtnText}>Reschedule appointment</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, styles.cancelBtn]} onPress={handleCancel}>
                <Text style={styles.cancelBtnText}>Cancel appointment</Text>
              </Pressable>
            </View>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 48 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, gap: spacing.sm },
  backBtn: { padding: 4 },
  pageTitle: { fontSize: 28, fontWeight: '700', color: colors.text, flex: 1 },
  spinner: { marginTop: spacing.xl },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  vetName: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 4 },
  dateText: { fontSize: 14, color: colors.muted, marginBottom: spacing.sm },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  typeBadge: { backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.muted, marginBottom: spacing.sm, letterSpacing: 0.5 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { fontSize: 14, color: colors.muted },
  detailValue: { fontSize: 14, color: colors.text, fontWeight: '600', flexShrink: 1, textAlign: 'right', maxWidth: '60%' },
  actionBtn: {
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  rescheduleBtn: { borderColor: colors.primary },
  rescheduleBtnText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  cancelBtn: { borderColor: colors.danger },
  cancelBtnText: { color: colors.danger, fontWeight: '700', fontSize: 14 },
})
