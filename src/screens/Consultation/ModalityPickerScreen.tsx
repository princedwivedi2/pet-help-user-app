import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import ErrorCard from '../../components/ErrorCard'
import PageHeader from '../../components/PageHeader'
import { useNavigation } from '@react-navigation/native'
import { colors, radius, shadows, spacing, typography } from '../../theme'
import { createConsultation, getPets } from '../../services'
import { parseApiError } from '../../utils/apiError'

// 'chat' isn't an instant-match request to a vet — it opens the AI assistant
// (see handleSelect below), so it's excluded from MODES entirely and shown
// as its own card with distinct copy.
const MODES = [
  { value: 'video', icon: 'videocam' as const, label: 'Video call', desc: 'Get matched with any available vet right now', paid: true },
  { value: 'audio', icon: 'call' as const, label: 'Audio call', desc: 'Talk privately when video is not needed', paid: true },
] as const

// Fee shown on the picker — backend will set the real amount on the order
const CONSULT_FEE_DISPLAY = 200

export default function ModalityPickerScreen() {
  const nav = useNavigation<any>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSelect(modality: 'video' | 'audio') {
    setLoading(true)
    setError('')
    try {
      let petId: number | undefined
      try {
        const petsRes = await getPets()
        const first = (petsRes?.data as any)?.pets?.[0]
        const rawPetId = Number(first?.id)
        petId = Number.isInteger(rawPetId) && rawPetId > 0 ? rawPetId : undefined
      } catch { /* non-fatal */ }

      const res = await createConsultation({
        modality,
        pet_id: petId ?? null,
        payment_uuid: null,
        // Video/audio consults require payment. Sent as paise so the backend
        // has a fee to charge — without this the session is created with
        // fee_amount = null and payment creation fails downstream.
        fee_amount: CONSULT_FEE_DISPLAY * 100,
      })
      const consultation = (res?.data as any)?.consultation
      const consultationId: string | undefined =
        consultation?.uuid || consultation?.id

      if (!consultationId) {
        setError(res?.message || 'Unable to start consultation. Please try again.')
        return
      }

      // Requires payment before any vet can join — gate through PaymentScreen
      nav.navigate('Payment', {
        consultationId,
        amount: CONSULT_FEE_DISPLAY * 100, // paise
        modality,
        vetName: undefined,
      })
    } catch (e) {
      setError(parseApiError(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <PageHeader title="Get instant care" subtitle="Any available vet will pick up your request right away" />
      <View style={styles.careNote}><View style={styles.careNoteIcon}><Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} /></View><Text style={styles.careNoteText}>Every option creates a secure consultation and keeps the outcome with your pet's care history.</Text></View>

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
          <View style={styles.icon}><Ionicons name={m.icon} size={24} color={colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{m.label}</Text>
            <Text style={styles.desc}>{m.desc}</Text>
          </View>
          <View style={styles.feeBadge}>
            <Text style={styles.feeBadgeText}>₹{CONSULT_FEE_DISPLAY}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
        </Pressable>
      ))}

      <Text style={styles.note}>
        Video and audio consultations require a payment before the session starts.
        Refunds are processed automatically if no vet is available or the call cannot connect.
      </Text>

      <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>OR</Text><View style={styles.dividerLine} /></View>

      <Pressable style={styles.chatCard} onPress={() => nav.navigate('Chat')} accessibilityLabel="Chat with AI assistant">
        <View style={[styles.icon, styles.chatIcon]}><Ionicons name="sparkles" size={22} color={colors.accent} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Chat with our AI assistant</Text>
          <Text style={styles.desc}>Free, instant answers — you're talking to an AI, not a human vet</Text>
        </View>
        <View style={[styles.feeBadge, styles.freeBadge]}>
          <Text style={[styles.feeBadgeText, styles.freeBadgeText]}>Free</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
      </Pressable>

      <Pressable style={styles.pickVetLink} onPress={() => nav.navigate('Main', { screen: 'Search' })} accessibilityLabel="Choose your own vet and time slot">
        <Ionicons name="person-outline" size={16} color={colors.primary} />
        <Text style={styles.pickVetLinkText}>Prefer to choose your own vet and time? Book an online appointment →</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 48 },
  careNote: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', padding: spacing.md, marginBottom: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.accentSoft },
  careNoteIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  careNoteText: { ...typography.caption, color: colors.text, flex: 1 },
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
    ...shadows.card,
  },
  icon: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  chatIcon: { backgroundColor: colors.mint },
  label: { ...typography.h3, color: colors.text },
  desc: { ...typography.caption, color: colors.muted, marginTop: 2 },
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
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.subtle, fontSize: 12, fontWeight: '700' },
  chatCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...shadows.card,
  },
  pickVetLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  pickVetLinkText: { color: colors.primary, fontSize: 13, fontWeight: '600', textAlign: 'center', flexShrink: 1 },
})
