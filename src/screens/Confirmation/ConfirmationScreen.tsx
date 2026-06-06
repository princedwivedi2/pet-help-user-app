import React from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { colors, radius, spacing } from '../../theme'
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
        <Text style={styles.checkmark}>✓</Text>
        <Text style={styles.heroTitle}>Booking Confirmed</Text>
        <Text style={styles.heroSubtitle}>Your payment was successful.</Text>
      </View>

      <View style={styles.card}>
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
            title="Join Consultation"
            onPress={() => nav.navigate('ConsultationRoom', { consultationId, modality: route.params?.modality, vetName })}
          />
        ) : null}
        <PrimaryButton
          title="View Appointments"
          onPress={() => nav.navigate('Main', { screen: 'Bookings' })}
        />
        <Pressable style={styles.secondaryBtn} onPress={() => nav.navigate('Main')}>
          <Text style={styles.secondaryText}>Back to Home</Text>
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
  content: { padding: spacing.lg, paddingBottom: 48 },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  checkmark: { fontSize: 48, color: '#fff7f1' },
  heroTitle: { color: '#fff7f1', fontSize: 26, fontWeight: '800', marginTop: 8 },
  heroSubtitle: { color: '#fff7f1', opacity: 0.9, marginTop: 6, fontSize: 15 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: { color: colors.muted, textTransform: 'uppercase', fontSize: 12, fontWeight: '600', flex: 1 },
  value: { color: colors.text, fontWeight: '700', flex: 1, textAlign: 'right' },
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
