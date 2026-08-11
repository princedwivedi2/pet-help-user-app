import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert, TextInput } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, shadows, spacing, typography } from '../../theme'
import ErrorCard from '../../components/ErrorCard'
import PageHeader from '../../components/PageHeader'
import { getAppointment, cancelAppointment } from '../../services/appointments'
import { createReview, getReviewsForVet } from '../../services'
import { pickArray } from '../../utils/backendAdapters'
import { parseApiError } from '../../utils/apiError'

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
  const [existingReview, setExistingReview] = useState<any>(null)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getAppointment(appointmentId)
      setData(res?.data ?? res)
    } catch (e) {
      setError(parseApiError(e))
    } finally {
      setLoading(false)
    }
  }, [appointmentId])

  useEffect(() => { refetch() }, [refetch])

  useEffect(() => {
    async function loadReview() {
      const vetUuid = data?.appointment?.vet?.uuid ?? data?.vet?.uuid ?? data?.vet_uuid
      if (!vetUuid) return
      try {
        const res = await getReviewsForVet(vetUuid)
        const list = pickArray(res?.data, ['reviews', 'items'])
        const mine = list.find((r: any) => r.appointment_uuid === appointmentId || r.appointment?.uuid === appointmentId)
        if (mine) setExistingReview(mine)
      } catch { /* non-fatal */ }
    }
    if (data) loadReview()
  }, [data, appointmentId])

  async function handleSubmitReview() {
    if (reviewRating === 0) {
      Alert.alert('Rating required', 'Please select a star rating.')
      return
    }
    setSubmittingReview(true)
    try {
      await createReview({ appointment_uuid: appointmentId ?? '', rating: reviewRating, comment: reviewComment || '' })
      setExistingReview({ rating: reviewRating, comment: reviewComment })
      Alert.alert('Review submitted', 'Thanks for your feedback!')
    } catch (e) {
      Alert.alert('Error', parseApiError(e))
    } finally {
      setSubmittingReview(false)
    }
  }

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
      <PageHeader title="Appointment details" subtitle="Timing, care type, payment, and next actions" />

      {loading && !data ? <ActivityIndicator color={colors.primary} style={styles.spinner} /> : null}
      {!loading && error ? <ErrorCard message={error} onRetry={refetch} /> : null}

      {data ? (
        <>
          {/* Status card */}
          <View style={[styles.card, styles.heroCard]}>
            <View style={styles.heroTop}><View style={styles.heroIcon}><Ionicons name={type === 'online' ? 'videocam' : isHomeVisit ? 'home' : 'calendar'} size={22} color={colors.primary} /></View><View style={styles.heroCopy}><Text style={styles.vetName}>{vetName}</Text><Text style={styles.dateText}>{formattedDate}</Text></View><StatusBadge status={status} /></View>
            <View style={styles.badgeRow}>
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

          {/* Review card — only for completed appointments */}
          {status === 'completed' ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your Review</Text>
              {existingReview ? (
                <View>
                  <View style={styles.starRow}>
                    {[1,2,3,4,5].map(s => (
                      <Text key={s} style={{ fontSize: 20, color: s <= existingReview.rating ? colors.warning : colors.border }}>★</Text>
                    ))}
                  </View>
                  {existingReview.comment ? <Text style={styles.reviewCommentText}>{existingReview.comment}</Text> : null}
                  <Text style={styles.reviewSubmittedLabel}>Review submitted ✓</Text>
                </View>
              ) : (
                <View>
                  <Text style={styles.detailLabel}>Tap to rate your experience</Text>
                  <View style={styles.starRow}>
                    {[1,2,3,4,5].map(s => (
                      <Pressable key={s} onPress={() => setReviewRating(s)} hitSlop={8}>
                        <Text style={{ fontSize: 28, color: s <= reviewRating ? colors.warning : colors.border }}>★</Text>
                      </Pressable>
                    ))}
                  </View>
                  <TextInput
                    style={styles.reviewInput}
                    placeholder="Share your experience (optional)"
                    placeholderTextColor={colors.muted}
                    value={reviewComment}
                    onChangeText={setReviewComment}
                    multiline
                    maxLength={500}
                  />
                  <Pressable
                    style={[styles.actionBtn, styles.rescheduleBtn, submittingReview && { opacity: 0.6 }]}
                    onPress={handleSubmitReview}
                    disabled={submittingReview}
                  >
                    {submittingReview
                      ? <ActivityIndicator size="small" color={colors.primary} />
                      : <Text style={styles.rescheduleBtnText}>Submit Review</Text>
                    }
                  </Pressable>
                </View>
              )}
            </View>
          ) : null}

          {/* Actions card */}
          {(status === 'pending' || status === 'confirmed') ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Actions</Text>
              <Pressable
                style={[styles.actionBtn, styles.rescheduleBtn]}
                onPress={() =>
                  Alert.alert(
                    'Reschedule',
                    'To reschedule, please cancel this appointment and book a new time slot.',
                  )
                }
              >
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
  content: { padding: spacing.xl, paddingBottom: 48 },
  spinner: { marginTop: spacing.xl },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  heroCard: { backgroundColor: colors.primarySoft, borderColor: colors.borderStrong, padding: spacing.lg },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  heroCopy: { flex: 1 },
  vetName: { ...typography.h3, color: colors.text },
  dateText: { ...typography.caption, color: colors.muted, marginTop: 3 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  badge: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  typeBadge: { backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
  cardTitle: { fontSize: 10, fontWeight: '900', color: colors.muted, marginBottom: spacing.sm, letterSpacing: 1, textTransform: 'uppercase' },
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
  starRow: { flexDirection: 'row', gap: 6, marginVertical: spacing.sm },
  reviewInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    color: colors.text,
    minHeight: 72,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  reviewCommentText: { color: colors.muted, lineHeight: 20, marginTop: spacing.xs },
  reviewSubmittedLabel: { color: colors.accent, fontWeight: '700', marginTop: spacing.xs, fontSize: 13 },
})
