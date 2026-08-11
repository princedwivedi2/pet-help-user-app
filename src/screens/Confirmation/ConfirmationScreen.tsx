import React from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { colors, radius, shadows, spacing, typography } from '../../theme'
import PrimaryButton from '../../components/PrimaryButton'

export default function ConfirmationScreen() {
  const nav = useNavigation<any>()
  const route = useRoute<any>()
  const { appointmentUuid, vetName, scheduledAt, appointmentType, amount, consultationId } = (route.params || {}) as {
    appointmentUuid?: string; vetName?: string; scheduledAt?: string; appointmentType?: string; amount?: number; consultationId?: string
  }

  const rawRef = (appointmentUuid || consultationId || '').slice(0, 8).toUpperCase()
  const bookingRef = rawRef || '—'

  const formattedDate = scheduledAt
    ? new Date(scheduledAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Not scheduled'

  const typeLabel =
    appointmentType === 'online' ? 'Online Consultation' :
    appointmentType === 'home_visit' ? 'Home Visit' :
    appointmentType === 'clinic_visit' ? 'Clinic Visit' : 'Appointment'

  const isConsultation = Boolean(consultationId)

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.checkmark}><Ionicons name="checkmark" size={34} color={colors.primary} /></View>
        <Text style={styles.kicker}>YOU'RE ALL SET</Text>
        <Text style={styles.heroTitle}>Booking confirmed</Text>
        <Text style={styles.heroSubtitle}>Your payment is complete. Everything you need is below.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.receiptHeader}><View><Text style={styles.receiptLabel}>APPOINTMENT SUMMARY</Text><Text style={styles.receiptRef}>Reference {bookingRef}</Text></View><Ionicons name="receipt-outline" size={24} color={colors.primary} /></View>
        <Row label="Booking reference" value={bookingRef} />
        <Row label="Veterinarian" value={vetName || 'Veterinarian'} />
        <Row label="Date & time" value={formattedDate} />
        <View style={styles.row}>
          <Text style={styles.label}>TYPE</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{typeLabel}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>AMOUNT PAID</Text>
          <Text style={styles.amount}>₹{amount ?? 0}</Text>
        </View>
      </View>

      {appointmentType === 'clinic_visit' ? (
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Visit instructions</Text>
          <Text style={styles.infoBody}>Visit the clinic at your scheduled time. Bring your pet's vaccination records and arrive 10 minutes early.</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        {isConsultation ? (
          <PrimaryButton
            title="Join consultation"
            onPress={() => nav.navigate('ConsultationRoom', { consultationId, modality: route.params?.modality, vetName })}
          />
        ) : null}
        <PrimaryButton
          title="View appointments"
          onPress={() => nav.navigate('Main', { screen: 'Bookings' })}
        />
        <Pressable style={styles.secondaryBtn} onPress={() => nav.navigate('Main')}>
          <Text style={styles.secondaryText}>Back to home</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 48 },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  checkmark: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.onPrimary, marginBottom: spacing.lg },
  kicker: { color: colors.onPrimary, opacity: 0.72, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  heroTitle: { ...typography.h1, color: colors.onPrimary, marginTop: 7 },
  heroSubtitle: { ...typography.body, color: colors.onPrimary, opacity: 0.82, marginTop: 8, textAlign: 'center', maxWidth: 270 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  receiptHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: spacing.md, marginBottom: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  receiptLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  receiptRef: { ...typography.caption, color: colors.text, marginTop: 3, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { ...typography.caption, color: colors.muted, textTransform: 'none', flex: 1 },
  value: { ...typography.label, color: colors.text, flex: 1, textAlign: 'right' },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  badgeText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  amount: { color: colors.primary, fontWeight: '900', fontSize: 24 },
  actions: { marginTop: spacing.lg, gap: spacing.sm },
  secondaryBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryText: { color: colors.text, fontWeight: '800', textAlign: 'center' },
  infoCard: { backgroundColor: colors.surfaceSoft, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginTop: spacing.md },
  infoTitle: { fontWeight: '800', color: colors.text, marginBottom: 6 },
  infoBody: { color: colors.muted, lineHeight: 20 },
})
