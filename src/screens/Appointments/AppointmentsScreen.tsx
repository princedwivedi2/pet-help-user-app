import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert, Modal, TextInput } from 'react-native'
import AppointmentCard from '../../components/AppointmentCard'
import { cancelAppointment, getAppointments, createReview } from '../../services'
import { colors, radius, spacing } from '../../theme'
import { normalizeAppointment, pickArray } from '../../utils/backendAdapters'

export default function AppointmentsScreen() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const [loading, setLoading] = useState(false)
  const [upcoming, setUpcoming] = useState<any[]>([])
  const [past, setPast] = useState<any[]>([])

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState<any>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  // Review modal
  const [reviewTarget, setReviewTarget] = useState<any>(null)
  const [rating, setRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [upcomingRes, pastRes] = await Promise.allSettled([
        getAppointments('status=pending,confirmed&per_page=20'),
        getAppointments('status=completed,cancelled&per_page=20'),
      ])

      if (upcomingRes.status === 'fulfilled') {
        const list = pickArray(upcomingRes.value?.data, ['appointments', 'items']).map((appt, i) => normalizeAppointment(appt, i))
        setUpcoming(list)
      }
      if (pastRes.status === 'fulfilled') {
        const list = pickArray(pastRes.value?.data, ['appointments', 'items']).map((appt, i) => normalizeAppointment(appt, i))
        setPast(list)
      }
    } catch {
      // lists stay empty
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCancel() {
    if (!cancelReason.trim()) {
      Alert.alert('Reason required', 'Please enter a reason for cancellation.')
      return
    }
    setCancelling(true)
    try {
      const res = await cancelAppointment(cancelTarget.uuid || cancelTarget.id, cancelReason.trim())
      if (res?.success === false) {
        Alert.alert('Cancel failed', res?.message || 'Could not cancel appointment.')
        return
      }
      Alert.alert(
        'Appointment cancelled',
        'Your appointment has been cancelled. Note: refunds, if applicable, are processed manually by our team.',
      )
      setCancelTarget(null)
      setCancelReason('')
      load()
    } catch {
      Alert.alert('Error', 'Could not cancel appointment. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  async function handleSubmitReview() {
    if (!reviewComment.trim()) {
      Alert.alert('Comment required', 'Please write a short review.')
      return
    }
    setSubmittingReview(true)
    try {
      const res = await createReview({
        appointment_uuid: reviewTarget.uuid || reviewTarget.id,
        rating,
        comment: reviewComment.trim(),
      })
      if (res?.success === false) {
        Alert.alert('Review failed', res?.message || 'Could not submit review.')
        return
      }
      Alert.alert('Review submitted', 'Thank you for your feedback!')
      setReviewTarget(null)
      setReviewComment('')
      setRating(5)
    } catch {
      Alert.alert('Error', 'Could not submit review. Please try again.')
    } finally {
      setSubmittingReview(false)
    }
  }

  const visible = tab === 'upcoming' ? upcoming : past

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Appointments</Text>
      <Text style={styles.subtitle}>Upcoming bookings and your past visits.</Text>

      <View style={styles.segmentWrap}>
        {(['upcoming', 'past'] as const).map(item => (
          <Pressable key={item} onPress={() => setTab(item)} style={[styles.segment, tab === item && styles.segmentActive]}>
            <Text style={[styles.segmentText, tab === item && styles.segmentTextActive]}>{item.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>{tab === 'upcoming' ? 'NEXT VISIT' : 'PAST VISITS'}</Text>
        <Text style={styles.heroValue}>{tab === 'upcoming' ? `${upcoming.length} upcoming` : `${past.length} past visits`}</Text>
        <Text style={styles.heroMeta}>{tab === 'upcoming' ? 'Pending or confirmed bookings' : 'Tap a completed visit to leave a review'}</Text>
      </View>

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : null}
      {!loading && !visible.length ? <Text style={styles.empty}>No appointments found.</Text> : null}

      {visible.map(a => (
        <View key={a.id}>
          <AppointmentCard appt={a} />
          <View style={styles.actionRow}>
            {(a.status === 'pending' || a.status === 'confirmed') ? (
              <Pressable style={styles.cancelBtn} onPress={() => { setCancelTarget(a); setCancelReason('') }}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            ) : null}
            {a.status === 'completed' ? (
              <Pressable style={styles.reviewBtn} onPress={() => { setReviewTarget(a); setRating(5); setReviewComment('') }}>
                <Text style={styles.reviewBtnText}>Write a review</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ))}

      {/* Cancel modal */}
      <Modal visible={!!cancelTarget} animationType="slide" presentationStyle="pageSheet" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Cancel appointment</Text>
            <Text style={styles.modalSubtitle}>Please provide a reason for cancellation.</Text>
            <TextInput
              value={cancelReason}
              onChangeText={setCancelReason}
              placeholder="Reason for cancellation"
              placeholderTextColor={colors.muted}
              multiline
              style={styles.textArea}
            />
            <Text style={styles.refundNote}>Note: refunds are processed manually. Contact support if you paid.</Text>
            <Pressable style={styles.dangerButton} onPress={handleCancel} disabled={cancelling}>
              {cancelling ? <ActivityIndicator color="#fff7f1" /> : <Text style={styles.dangerButtonText}>Confirm cancellation</Text>}
            </Pressable>
            <Pressable style={styles.ghostButton} onPress={() => setCancelTarget(null)}>
              <Text style={styles.ghostButtonText}>Keep appointment</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Review modal */}
      <Modal visible={!!reviewTarget} animationType="slide" presentationStyle="pageSheet" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Write a review</Text>
            <Text style={styles.modalSubtitle}>{reviewTarget?.vet}</Text>

            <Text style={styles.fieldLabel}>Rating</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <Pressable key={star} onPress={() => setRating(star)}>
                  <Text style={[styles.star, star <= rating && styles.starActive]}>★</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Comment</Text>
            <TextInput
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="Share your experience..."
              placeholderTextColor={colors.muted}
              multiline
              style={styles.textArea}
            />
            <Pressable style={styles.primaryButton} onPress={handleSubmitReview} disabled={submittingReview}>
              {submittingReview ? <ActivityIndicator color="#fff7f1" /> : <Text style={styles.primaryButtonText}>Submit review</Text>}
            </Pressable>
            <Pressable style={styles.ghostButton} onPress={() => setReviewTarget(null)}>
              <Text style={styles.ghostButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 44 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.muted, marginTop: 6, marginBottom: spacing.lg },
  segmentWrap: { flexDirection: 'row', gap: 8, marginBottom: spacing.lg },
  segment: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  segmentActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentText: { color: colors.muted, fontWeight: '800', fontSize: 12, letterSpacing: 0.6 },
  segmentTextActive: { color: '#fff7f1' },
  heroCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  heroEyebrow: { color: colors.primary, fontWeight: '800', fontSize: 11, letterSpacing: 1.1 },
  heroValue: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 6 },
  heroMeta: { color: colors.muted, marginTop: 4 },
  empty: { color: colors.muted, marginTop: spacing.md },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: -8, marginBottom: spacing.sm },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.danger },
  cancelBtnText: { color: colors.danger, fontWeight: '700', fontSize: 13 },
  reviewBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary },
  reviewBtnText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 44 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: colors.text, marginBottom: 6 },
  modalSubtitle: { color: colors.muted, marginBottom: spacing.lg },
  fieldLabel: { color: colors.text, fontWeight: '700', marginBottom: 6, marginTop: spacing.sm },
  textArea: { minHeight: 90, padding: 14, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, color: colors.text, textAlignVertical: 'top' },
  refundNote: { color: colors.muted, fontSize: 12, marginTop: spacing.sm, lineHeight: 17 },
  starsRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.sm },
  star: { fontSize: 32, color: colors.border },
  starActive: { color: colors.warning },
  dangerButton: { marginTop: spacing.lg, backgroundColor: colors.danger, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  dangerButtonText: { color: '#fff7f1', fontWeight: '800' },
  primaryButton: { marginTop: spacing.lg, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  primaryButtonText: { color: '#fff7f1', fontWeight: '800' },
  ghostButton: { marginTop: spacing.sm, paddingVertical: 14, alignItems: 'center' },
  ghostButtonText: { color: colors.muted, fontWeight: '700' },
})
