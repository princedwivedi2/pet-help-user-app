import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import ErrorCard from '../../components/ErrorCard'
import { useNavigation } from '@react-navigation/native'
import { colors, radius, spacing } from '../../theme'
import { createConsultation, getPets } from '../../services'

const MODES = [
  { value: 'video', icon: '🎥', label: 'Video Call', desc: 'Face-to-face consultation with a vet' },
  { value: 'audio', icon: '📞', label: 'Audio Call', desc: 'Voice-only consultation' },
  { value: 'chat',  icon: '💬', label: 'Chat',       desc: 'Text-based consultation' },
] as const

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
      } catch {}
      const res = await createConsultation({ modality, pet_uuid: petUuid ?? null, payment_uuid: null })
      const consultation = (res?.data as any)?.consultation
      const consultationId = consultation?.uuid || consultation?.id
      if (consultationId) {
        nav.navigate('ConsultationRoom', { consultationId, modality, vetName: 'Available vet' })
      } else {
        setError(res?.message || 'Unable to start consultation. Please try again.')
      }
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Start a Consultation</Text>
      <Text style={styles.subtitle}>Choose how you&apos;d like to connect</Text>
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.md }} /> : null}
      {error ? <ErrorCard message={error} onRetry={() => setError('')} /> : null}
      {MODES.map(m => (
        <Pressable
          key={m.value}
          style={styles.modeCard}
          onPress={() => handleSelect(m.value)}
          disabled={loading}
        >
          <Text style={styles.icon}>{m.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{m.label}</Text>
            <Text style={styles.desc}>{m.desc}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  subtitle: { color: colors.muted, marginBottom: spacing.lg },
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
})
