import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import PageHeader from '../../components/PageHeader'
import PrimaryButton from '../../components/PrimaryButton'
import { getPets } from '../../services'
import { normalizePet, pickArray } from '../../utils/backendAdapters'
import { colors, radius, shadows, spacing, typography } from '../../theme'

const signs = [
  ['warning-outline', 'Breathing trouble', 'Gasping, choking, or blue/pale gums'],
  ['pulse-outline', 'Collapse or seizure', 'Unresponsive, severe weakness, or repeated seizure'],
  ['water-outline', 'Heavy bleeding', 'Bleeding that does not slow with gentle pressure'],
] as const

export default function EmergencyScreen() {
  const nav = useNavigation<any>()
  const [pets, setPets] = useState<any[]>([])
  const [selected, setSelected] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadPets = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getPets()
      setPets(pickArray(response?.data, ['pets', 'items']).map((pet, index) => normalizePet(pet, index)))
    } catch {
      setPets([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadPets() }, [loadPets])

  function explainSos() {
    Alert.alert(
      'SOS alerts are not connected yet',
      'Respaw will not claim that a clinic has been alerted until the emergency dispatch API is available. Use Find emergency clinic to contact a provider now.',
    )
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <PageHeader title="Emergency care" subtitle="Fast, clear help when every minute matters" />

      <View style={styles.alertHero}>
        <View style={styles.alertIcon}><Ionicons name="medical" size={24} color={colors.onPrimary} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.alertKicker}>URGENT CARE</Text>
          <Text style={styles.alertTitle}>Is your pet in immediate danger?</Text>
          <Text style={styles.alertText}>Go directly to the nearest emergency clinic. Do not wait for an online reply.</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>SELECT PET</Text>
      {loading ? <ActivityIndicator color={colors.primary} /> : pets.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petRow}>
          {pets.map((pet, index) => (
            <Pressable key={pet.uuid || pet.id || index} style={[styles.petChip, selected === index && styles.petChipSelected]} onPress={() => setSelected(index)}>
              <View style={[styles.petInitial, selected === index && styles.petInitialSelected]}><Text style={[styles.petInitialText, selected === index && styles.petInitialTextSelected]}>{String(pet.name || 'P')[0]}</Text></View>
              <View><Text style={styles.petName}>{pet.name || 'Pet'}</Text><Text style={styles.petMeta}>{pet.breed || pet.species || 'Pet profile'}</Text></View>
              <Ionicons name={selected === index ? 'radio-button-on' : 'radio-button-off'} size={19} color={selected === index ? colors.primary : colors.subtle} />
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <Pressable style={styles.emptyPet} onPress={() => nav.navigate('Main', { screen: 'Pets' })}>
          <Ionicons name="paw-outline" size={20} color={colors.primary} />
          <Text style={styles.emptyPetText}>Add a pet profile for faster emergency care</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Pressable>
      )}

      <Text style={styles.sectionLabel}>WARNING SIGNS</Text>
      <View style={styles.card}>
        {signs.map(([icon, title, note], index) => (
          <View key={title} style={[styles.signRow, index < signs.length - 1 && styles.divider]}>
            <View style={styles.signIcon}><Ionicons name={icon} size={20} color={colors.danger} /></View>
            <View style={{ flex: 1 }}><Text style={styles.signTitle}>{title}</Text><Text style={styles.signNote}>{note}</Text></View>
          </View>
        ))}
      </View>

      <View style={styles.tipCard}>
        <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
        <Text style={styles.tipText}>Keep your pet calm, avoid giving food or medicine unless a veterinarian instructs you, and carry available medical records.</Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="Find emergency clinic" onPress={() => nav.navigate('NearbyVets', { emergencyOnly: true, pet: pets[selected] })} />
        <Pressable style={styles.sosButton} onPress={explainSos}>
          <Ionicons name="radio-outline" size={19} color={colors.danger} />
          <Text style={styles.sosText}>SOS dispatch status</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: 48 },
  alertHero: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.danger, borderRadius: radius.xl, padding: spacing.xl, ...shadows.floating },
  alertIcon: { width: 48, height: 48, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  alertKicker: { color: colors.onPrimary, opacity: 0.8, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  alertTitle: { ...typography.h2, color: colors.onPrimary, marginTop: 5 },
  alertText: { color: colors.onPrimary, opacity: 0.9, fontSize: 13, lineHeight: 19, marginTop: 6 },
  sectionLabel: { color: colors.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1.1, marginTop: spacing.xxl, marginBottom: spacing.sm },
  petRow: { gap: spacing.sm, paddingRight: spacing.xl },
  petChip: { width: 238, minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
  petChipSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  petInitial: { width: 42, height: 42, borderRadius: 16, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
  petInitialSelected: { backgroundColor: colors.primary },
  petInitialText: { color: colors.text, fontWeight: '900', fontSize: 17 },
  petInitialTextSelected: { color: colors.onPrimary },
  petName: { color: colors.text, fontWeight: '900' },
  petMeta: { color: colors.muted, fontSize: 11, marginTop: 2, width: 105 },
  emptyPet: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md },
  emptyPetText: { flex: 1, color: colors.text, fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, ...shadows.card },
  signRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.md, alignItems: 'center' },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  signIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
  signTitle: { color: colors.text, fontWeight: '900' },
  signNote: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  tipCard: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.lg },
  tipText: { flex: 1, color: colors.text, fontSize: 12, lineHeight: 18 },
  actions: { marginTop: spacing.xl, gap: spacing.sm },
  sosButton: { minHeight: 50, borderWidth: 1, borderColor: colors.dangerBorder, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.dangerSoft },
  sosText: { color: colors.danger, fontWeight: '900' },
})
