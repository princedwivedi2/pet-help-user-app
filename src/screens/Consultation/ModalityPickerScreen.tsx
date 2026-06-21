import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import ErrorCard from '../../components/ErrorCard'
import { useNavigation } from '@react-navigation/native'
import { colors, radius, spacing } from '../../theme'
import { createConsultation, getPets } from '../../services'
import { parseApiError } from '../../utils/apiError'

const MODES = [
  { value: 'video', icon: '🎥', label: 'Video Call', desc: 'Face-to-face video consultation', paid: true },
  { value: 'audio', icon: '📞', label: 'Audio Call', desc: 'Voice-only consultation', paid: true },
  { value: 'chat',  icon: '💬', label: 'Chat',       desc: 'Text-based consultation', paid: false },
] as const

// Fee shown on the picker — backend will set the real amount on the order
const CONSULT_FEE_DISPLAY = 200

export default function ModalityPickerScreen() {
  const nav = useNavigation<any>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSelect(modality: 'video' | 'audio' | 'chat') {
    setLoading(true)
    setError('')
    try {
      let petUuid: string | undefined
      try {
        const petsRes = await getPets()
        const first = (petsRes?.data as any)?.pets?.[0]
        petUuid = first?.uuid || first?.id
      } catch { /* non-fatal */ }

      const res = await createConsultation({
        modality,
        pet_uuid: petUuid ?? null,
        payment_uuid: null,
      })
      const consultation = (res?.data as any)?.consultation
      const consultationId: string | undefined =
        consultation?.uuid || consultation?.id

      if (!consultationId) {
        setError(res?.message || 'Unable to start consultation. Please try again.')
        return
      }

      if (modality === 'chat') {
        // Chat is free — go straight to the room
        nav.navigate('ConsultationRoom', {
          consultationId,
          modality,
          vetName: undefined,
        })
      } else {
        // Video / audio require payment — gate through PaymentScreen
        nav.navigate('Payment', {
          consultationId,
          amount: CONSULT_FEE_DISPLAY * 100, // paise
          modality,
          vetName: undefined,
        })
      }
    } catch (e) {
      setError(parseApiError(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Start a Consultation</Text>
      <Text style={styles.subtitle}>Choose how you'd like to connect with a vet</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.md }} />
      ) : null}
      {error ? <ErrorCard message={error} onRetry={() => setError('')} /> : null}

      {MODES.map(m => (
        <Pressable
          key={m.value}
          style={styles.modeCard}
          onPress={() => handleSelect(m.value)}
          disabled={loading}
          accessibilityLabel={`${m.label} consultation`}
        >
          <Text style={styles.icon}>{m.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{m.label}</Text>
            <Text style={styles.desc}>{m.desc}</Text>
          </View>
          {m.paid ? (
            <View style={styles.feeBadge}>
              <Text style={styles.feeBadgeText}>₹{CONSULT_FEE_DISPLAY}</Text>
            </View>
          ) : (
            <View style={[styles.feeBadge, styles.freeBadge]}>
              <Text style={[styles.feeBadgeText, styles.freeBadgeText]}>Free</Text>
            </View>
          )}
        </Pressable>
      ))}

      <Text style={styles.note}>
        Video and audio consultations require a payment before the session starts.
        Refunds are processed automatically if the call cannot connect.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  subtitle: { color: colors.muted, marginBottom: spacing.lg, fontSize: 14 },
  modeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  icon: { fontSize: 32 },
  label: { fontWeight: '800', color: colors.text, fontSize: 16 },
  desc: { color: colors.muted, fontSize: 13, marginTop: 2 },
  feeBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  feeBadgeText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  freeBadge: {
    backgroundColor: colors.mint,
    borderColor: colors.accent,
  },
  freeBadgeText: { color: colors.accent },
  note: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
})
