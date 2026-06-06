import React, { useEffect, useRef, useState } from 'react'
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { createSos, getActiveSos, getPets } from '../../services'
import { colors, radius, spacing } from '../../theme'
import { normalizePet, pickArray } from '../../utils/backendAdapters'

const URGENCY_LEVELS = [
  { value: 'low', label: 'Low', color: colors.accent, note: 'Can wait a few hours' },
  { value: 'medium', label: 'Medium', color: colors.warning, note: 'Needs care today' },
  { value: 'high', label: 'High', color: '#ef4444', note: 'Urgent — needs help now' },
  { value: 'critical', label: 'Critical', color: '#7f1d1d', note: 'Life-threatening emergency' },
]

export default function SosScreen() {
  const [pets, setPets] = useState<any[]>([])
  const [selectedPet, setSelectedPet] = useState('')
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState('high')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeSos, setActiveSos] = useState<any>(null)
  const [polling, setPolling] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    async function init() {
      try {
        const [petsRes, sosRes] = await Promise.allSettled([getPets(), getActiveSos()])

        if (petsRes.status === 'fulfilled') {
          const list = pickArray(petsRes.value?.data, ['pets', 'items']).map((p, i) => normalizePet(p, i))
          setPets(list)
          if (list[0]) setSelectedPet(list[0].id)
        }

        if (sosRes.status === 'fulfilled') {
          const data = sosRes.value?.data as any
          const active = data?.sos || data?.sos_requests?.[0] || null
          if (active) {
            setActiveSos(active)
            startPolling()
          }
        }
      } catch {
        // silent
      } finally {
        setInitialLoading(false)
      }
    }
    init()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  function startPolling() {
    if (pollRef.current) return
    pollRef.current = setInterval(async () => {
      try {
        const res = await getActiveSos()
        const data = res?.data as any
        const active = data?.sos || data?.sos_requests?.[0] || null
        setActiveSos(active)
        if (!active && pollRef.current) {
          clearInterval(pollRef.current)
          pollRef.current = null
        }
      } catch {
        // ignore polling errors
      }
    }, 10000)
  }

  async function handleSubmit() {
    if (!selectedPet) {
      Alert.alert('Select a pet', 'Choose which pet needs emergency help.')
      return
    }
    if (!description.trim()) {
      Alert.alert('Description required', 'Describe what is happening.')
      return
    }
    if (!latitude.trim() || !longitude.trim()) {
      Alert.alert('Location required', 'Enter GPS coordinates so a vet can reach you.')
      return
    }
    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Invalid coordinates', 'Enter valid decimal numbers for latitude and longitude.')
      return
    }

    setSubmitting(true)
    try {
      const res = await createSos({
        pet_id: selectedPet,
        description: description.trim(),
        urgency,
        latitude: lat,
        longitude: lng,
      })
      if (res?.success === false) {
        Alert.alert('SOS failed', res?.message || 'Could not create SOS request.')
        return
      }
      const data = res?.data as any
      setActiveSos(data?.sos || data || {})
      startPolling()
      Alert.alert('SOS sent', 'Your emergency request has been submitted. A vet will contact you shortly.')
    } catch {
      Alert.alert('Error', 'Could not submit SOS request. Please try again or call emergency services.')
    } finally {
      setSubmitting(false)
    }
  }

  if (initialLoading) {
    return <View style={styles.centered}><ActivityIndicator color={colors.primary} /></View>
  }

  if (activeSos) {
    return <ActiveSosView sos={activeSos} />
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.alertBanner}>
        <Text style={styles.alertIcon}>🚨</Text>
        <View>
          <Text style={styles.alertTitle}>Emergency SOS</Text>
          <Text style={styles.alertMeta}>For life-threatening situations. Nearby vets will be alerted.</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Select pet</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {pets.map(p => (
            <Pressable key={p.id} onPress={() => setSelectedPet(p.id)} style={[styles.pill, selectedPet === p.id && styles.pillActive]}>
              <Text style={[styles.pillText, selectedPet === p.id && styles.pillTextActive]}>{p.emoji} {p.name}</Text>
            </Pressable>
          ))}
          {!pets.length ? <Text style={styles.helperText}>No pets found — add a pet first.</Text> : null}
        </ScrollView>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Urgency level</Text>
        <View style={styles.urgencyGrid}>
          {URGENCY_LEVELS.map(u => (
            <Pressable
              key={u.value}
              onPress={() => setUrgency(u.value)}
              style={[styles.urgencyCard, urgency === u.value && { borderColor: u.color, backgroundColor: u.color + '15' }]}
            >
              <Text style={[styles.urgencyLabel, urgency === u.value && { color: u.color }]}>{u.label}</Text>
              <Text style={styles.urgencyNote}>{u.note}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>What is happening?</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Describe symptoms, injuries, or what happened..."
          placeholderTextColor={colors.muted}
          style={styles.textArea}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Your location (GPS)</Text>
        <Text style={styles.helperText}>Open Google Maps → long-press your location → copy coordinates.</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={latitude}
            onChangeText={setLatitude}
            placeholder="Latitude"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            style={[styles.coordInput, { flex: 1 }]}
          />
          <TextInput
            value={longitude}
            onChangeText={setLongitude}
            placeholder="Longitude"
            placeholderTextColor={colors.muted}
            keyboardType="numeric"
            style={[styles.coordInput, { flex: 1 }]}
          />
        </View>
      </View>

      <Pressable style={styles.sosButton} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color="#fff7f1" /> : <Text style={styles.sosButtonText}>🚨 Send Emergency SOS</Text>}
      </Pressable>

      <Text style={styles.disclaimer}>
        For life-threatening emergencies call 112 (India) or your local emergency number immediately. This SOS connects you with nearby veterinarians.
      </Text>
    </ScrollView>
  )
}

function ActiveSosView({ sos }: { sos: any }) {
  const status = sos.status || 'pending'
  const vetName = sos.vet?.name || sos.vet?.vet_name || sos.assigned_vet_name || null

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.activeBanner}>
        <Text style={styles.activeIcon}>🚨</Text>
        <Text style={styles.activeTitle}>SOS Active</Text>
        <Text style={styles.activeStatus}>{status.replace(/_/g, ' ').toUpperCase()}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Request details</Text>
        {sos.description ? <Text style={styles.body}>{sos.description}</Text> : null}
        {sos.urgency ? <Text style={[styles.urgencyLabel, { color: colors.danger, marginTop: spacing.sm }]}>Urgency: {sos.urgency.toUpperCase()}</Text> : null}
      </View>

      {vetName ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Assigned vet</Text>
          <Text style={styles.body}>{vetName}</Text>
          {sos.vet?.phone ? <Text style={styles.phone}>{sos.vet.phone}</Text> : null}
        </View>
      ) : (
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.body}>Searching for nearby vets…</Text>
          </View>
        </View>
      )}

      <Text style={styles.disclaimer}>
        Do not close the app. This screen auto-refreshes every 10 seconds. Call 112 if you need immediate help while waiting.
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 44 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  alertBanner: { backgroundColor: '#fef2f2', borderRadius: radius.xl, borderWidth: 1, borderColor: '#fecaca', padding: spacing.lg, flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: spacing.lg },
  alertIcon: { fontSize: 32 },
  alertTitle: { fontWeight: '900', fontSize: 18, color: '#7f1d1d' },
  alertMeta: { color: '#991b1b', fontSize: 12, marginTop: 2 },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  urgencyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  urgencyCard: { flex: 1, minWidth: '44%', padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSoft },
  urgencyLabel: { fontWeight: '800', color: colors.text },
  urgencyNote: { fontSize: 11, color: colors.muted, marginTop: 4, lineHeight: 15 },
  textArea: { minHeight: 90, padding: 14, borderRadius: radius.md, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, color: colors.text, textAlignVertical: 'top' },
  helperText: { color: colors.muted, fontSize: 12, marginBottom: 10, lineHeight: 17 },
  coordInput: { padding: 12, borderRadius: radius.md, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, color: colors.text },
  pill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { color: colors.text, fontWeight: '700' },
  pillTextActive: { color: '#fff7f1' },
  sosButton: { backgroundColor: '#dc2626', borderRadius: radius.lg, paddingVertical: 18, alignItems: 'center', marginTop: spacing.sm },
  sosButtonText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  disclaimer: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing.md, textAlign: 'center' },
  // Active SOS
  activeBanner: { backgroundColor: '#fef2f2', borderRadius: radius.xl, borderWidth: 1, borderColor: '#fca5a5', padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg },
  activeIcon: { fontSize: 48 },
  activeTitle: { fontSize: 24, fontWeight: '900', color: '#7f1d1d', marginTop: 8 },
  activeStatus: { color: '#dc2626', fontWeight: '800', marginTop: 6, letterSpacing: 1 },
  body: { color: colors.muted, lineHeight: 20 },
  phone: { color: colors.primary, fontWeight: '700', marginTop: 6 },
})
