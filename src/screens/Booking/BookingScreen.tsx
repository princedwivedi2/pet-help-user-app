import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator, StyleSheet } from 'react-native'
import PrimaryButton from '../../components/PrimaryButton'
import { createAppointment, getAppointmentSlots, getPets } from '../../services'
import { useNavigation, useRoute } from '@react-navigation/native'
import { colors, radius, spacing } from '../../theme'
import { addDays, formatDateKey, isFutureISO, normalizePet, normalizeSlot, pickArray } from '../../utils/backendAdapters'

export default function BookingScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const vetId = route.params?.vetId || route.params?.vet?.uuid || route.params?.vet?.id || 'vet-1'
  const vetName = route.params?.vet?.name || 'Veterinarian'
  const consultationFee = route.params?.vet?.fee ? Number(String(route.params.vet.fee).replace(/[^0-9]/g, '')) : 549

  const [pets, setPets] = useState<any[]>([])
  const [selectedPet, setSelectedPet] = useState<string>('')
  const [selectedType, setSelectedType] = useState<'clinic_visit' | 'home_visit' | 'online'>('clinic_visit')
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()))
  const [slots, setSlots] = useState<{ value: string; label: string }[]>([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [reason, setReason] = useState('General consultation')
  const [homeAddress, setHomeAddress] = useState('')
  const [homeLatitude, setHomeLatitude] = useState('')
  const [homeLongitude, setHomeLongitude] = useState('')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const amount = useMemo(() => (selectedType === 'home_visit' ? consultationFee + 200 : selectedType === 'online' ? Math.max(349, consultationFee - 150) : consultationFee), [consultationFee, selectedType])

  useEffect(() => {
    async function loadPets() {
      try {
        const res = await getPets()
        const list = pickArray(res?.data, ['pets']).map((pet, index) => normalizePet(pet, index))
        setPets(list)
        if (!selectedPet && list[0]?.id) setSelectedPet(list[0].id)
      } catch {
        setPets([])
      }
    }

    loadPets()
  }, [])

  useEffect(() => {
    async function loadSlots() {
      setPageLoading(true)
      setError('')
      try {
        const res = await getAppointmentSlots(vetId, selectedDate)
        const rawSlots = pickArray(res?.data, ['slots'])
        const nextSlots = rawSlots.map(normalizeSlot).filter(Boolean) as { value: string; label: string }[]
        setSlots(nextSlots.filter(slot => isFutureISO(slot.value)))
        setSelectedSlot(prev => prev && nextSlots.some(slot => slot.value === prev) ? prev : (nextSlots[0]?.value || ''))
      } catch {
        setSlots([])
        setSelectedSlot('')
        setError('Unable to load live slots right now. Try a different date or try again.')
      } finally {
        setPageLoading(false)
      }
    }

    loadSlots()
  }, [vetId, selectedDate])

  useEffect(() => {
    const pre = route.params?.preselectedType
    if (pre === 'online' || pre === 'home_visit' || pre === 'clinic_visit') {
      setSelectedType(pre)
    }
  }, [route.params?.preselectedType])

  function validateField(field: string, value: string) {
    let msg = ''
    if (field === 'reason') {
      if (value.trim().length < 4) msg = 'Please describe the reason for your visit'
    } else if (field === 'home_address') {
      if (selectedType === 'home_visit' && !value.trim()) msg = 'Enter your home address'
    } else if (field === 'coords') {
      const lat = parseFloat(homeLatitude)
      const lng = parseFloat(homeLongitude)
      if (selectedType === 'home_visit' && (isNaN(lat) || isNaN(lng) || !homeLatitude.trim() || !homeLongitude.trim())) {
        msg = 'Valid coordinates are required for home visits'
      }
    }
    setErrors(prev => {
      if (!msg) {
        const next = { ...prev }
        delete next[field]
        return next
      }
      return { ...prev, [field]: msg }
    })
  }

  function validateAll(): boolean {
    const errs: Record<string, string> = {}
    if (reason.trim().length < 4) errs.reason = 'Please describe the reason for your visit'
    if (selectedType === 'home_visit') {
      if (!homeAddress.trim()) errs.home_address = 'Enter your home address'
      const lat = parseFloat(homeLatitude)
      const lng = parseFloat(homeLongitude)
      if (!homeLatitude.trim() || !homeLongitude.trim() || isNaN(lat) || isNaN(lng)) {
        errs.coords = 'Valid coordinates are required for home visits'
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleProceed() {
    if (!selectedPet) {
      Alert.alert('Select a pet', 'Choose which pet this appointment is for.')
      return
    }

    if (!selectedSlot) {
      Alert.alert('Select a slot', 'Pick an available appointment time.')
      return
    }

    if (!isFutureISO(selectedSlot)) {
      Alert.alert('Invalid slot', 'Please choose a future time slot.')
      return
    }

    if (!validateAll()) return

    setLoading(true)
    try {
      const res = await createAppointment({
        vet_uuid: vetId,
        pet_id: selectedPet,
        scheduled_at: selectedSlot,
        appointment_type: selectedType,
        reason,
        notes: `Booked from mobile app for ${vetName}`,
        ...(selectedType === 'home_visit' ? {
          home_address: homeAddress.trim(),
          home_latitude: parseFloat(homeLatitude),
          home_longitude: parseFloat(homeLongitude),
        } : {}),
      })
      const appointment = (res?.data as any)?.appointment || res?.data || {}
      const appointmentUuid = appointment?.uuid || appointment?.id
      if (appointmentUuid) {
        navigation.navigate('Payment', {
          appointmentId: appointmentUuid,
          amount,
          appointment,
          vetName,
          scheduledAt: selectedSlot,
          appointmentType: selectedType,
        })
      } else {
        Alert.alert('Booking failed', res?.message || 'Unable to create appointment')
      }
    } catch (e) {
      Alert.alert('Error', String(e))
    } finally {
      setLoading(false)
    }
  }

  const dateChoices = [0, 1, 2].map(offset => {
    const date = addDays(new Date(), offset)
    return { label: date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }), value: formatDateKey(date) }
  })

  if (pageLoading && !slots.length) return <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Book appointment</Text>
      <Text style={styles.subtitle}>Choose a pet, type, and slot before payment.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{vetName}</Text>
        <Text style={styles.vetMeta}>Selected vet for this booking</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Select pet</Text>
        {!pets.length ? <Text style={styles.helperText}>No pets were returned by the backend yet.</Text> : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {pets.map(p => (
            <Pressable key={p.id} onPress={() => setSelectedPet(p.id)} style={[styles.pill, selectedPet === p.id && styles.pillActive]}>
              <Text style={[styles.pillText, selectedPet === p.id && styles.pillTextActive]}>{p.emoji} {p.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Consultation type</Text>
        <View style={styles.rowWrap}>
          {[
            { value: 'clinic_visit', label: 'Clinic' },
            { value: 'home_visit', label: 'Home' },
            { value: 'online', label: 'Online' },
          ].map(item => (
            <Pressable key={item.value} onPress={() => setSelectedType(item.value as any)} style={[styles.typeCard, selectedType === item.value && styles.typeCardActive]}>
              <Text style={[styles.typeLabel, selectedType === item.value && styles.typeLabelActive]}>{item.label}</Text>
              <Text style={[styles.typeMeta, selectedType === item.value && styles.typeMetaActive]}>{item.value === 'online' ? 'Video / audio' : item.value === 'home_visit' ? 'At your address' : 'At clinic'}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {selectedType === 'home_visit' ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Home address</Text>
          <TextInput
            value={homeAddress}
            onChangeText={v => { setHomeAddress(v); setErrors(p => { const n = { ...p }; delete n.home_address; return n }) }}
            onBlur={() => validateField('home_address', homeAddress)}
            multiline
            placeholder="Enter the full visit address"
            placeholderTextColor={colors.muted}
            style={styles.textArea}
          />
          {errors.home_address ? <Text style={styles.fieldError}>{errors.home_address}</Text> : null}
          <Text style={styles.sectionTitle2}>GPS Coordinates</Text>
          <Text style={styles.helperText}>Required for vet routing. Open Google Maps → long-press your location → copy the coordinates.</Text>
          <View style={styles.rowWrap}>
            <TextInput
              value={homeLatitude}
              onChangeText={v => { setHomeLatitude(v); setErrors(p => { const n = { ...p }; delete n.coords; return n }) }}
              onBlur={() => validateField('coords', homeLatitude)}
              placeholder="Latitude (e.g. 28.6139)"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              style={[styles.coordInput, { flex: 1 }]}
            />
            <TextInput
              value={homeLongitude}
              onChangeText={v => { setHomeLongitude(v); setErrors(p => { const n = { ...p }; delete n.coords; return n }) }}
              onBlur={() => validateField('coords', homeLongitude)}
              placeholder="Longitude (e.g. 77.2090)"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              style={[styles.coordInput, { flex: 1 }]}
            />
          </View>
          {errors.coords ? <Text style={styles.fieldError}>{errors.coords}</Text> : null}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Pick a slot</Text>
        <View style={styles.rowWrap}>
          {dateChoices.map(choice => (
            <Pressable key={choice.value} onPress={() => setSelectedDate(choice.value)} style={[styles.dateChip, selectedDate === choice.value && styles.dateChipActive]}>
              <Text style={[styles.dateChipText, selectedDate === choice.value && styles.dateChipTextActive]}>{choice.label}</Text>
            </Pressable>
          ))}
        </View>
        {pageLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.rowWrap}>
          {slots.map(slot => (
            <Pressable key={slot.value} onPress={() => setSelectedSlot(slot.value)} style={[styles.slot, selectedSlot === slot.value && styles.slotActive]}>
              <Text style={[styles.slotText, selectedSlot === slot.value && styles.slotTextActive]}>{slot.label}</Text>
            </Pressable>
          ))}
        </View>
        {!slots.length && !pageLoading ? <Text style={styles.helperText}>No available slots for this day.</Text> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Reason for visit</Text>
        <TextInput
          value={reason}
          onChangeText={v => { setReason(v); setErrors(p => { const n = { ...p }; delete n.reason; return n }) }}
          onBlur={() => validateField('reason', reason)}
          multiline
          placeholder="What's bringing your pet in?"
          placeholderTextColor={colors.muted}
          style={styles.textArea}
        />
        {errors.reason ? <Text style={styles.fieldError}>{errors.reason}</Text> : null}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Consultation fee</Text>
        <Text style={styles.summaryValue}>₹{amount}</Text>
        <View style={styles.divider} />
        <Text style={styles.summaryTotal}>Total ₹{amount}</Text>
      </View>

      <PrimaryButton title={loading ? 'Creating booking...' : `Confirm & Pay ₹${amount}`} onPress={handleProceed} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 48 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.muted, marginTop: 6, marginBottom: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  vetMeta: { color: colors.muted },
  row: { gap: 10 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 999, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { color: colors.text, fontWeight: '700' },
  pillTextActive: { color: colors.onPrimary },
  typeCard: { width: '31%', minWidth: 96, padding: 12, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSoft },
  typeCardActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  typeLabel: { fontWeight: '800', color: colors.text },
  typeLabelActive: { color: colors.primary },
  typeMeta: { marginTop: 6, color: colors.muted, fontSize: 12, lineHeight: 16 },
  typeMetaActive: { color: colors.text },
  slot: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
  slotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText: { color: colors.text, fontWeight: '700' },
  slotTextActive: { color: colors.onPrimary },
  textArea: { minHeight: 100, padding: 14, borderRadius: radius.md, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, color: colors.text, textAlignVertical: 'top' },
  dateChip: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSoft },
  dateChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateChipText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  dateChipTextActive: { color: colors.onPrimary },
  summaryCard: { backgroundColor: colors.onPrimary, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  summaryLabel: { color: colors.muted, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8 },
  summaryValue: { color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
  summaryTotal: { color: colors.text, fontSize: 20, fontWeight: '900' },
  helperText: { color: colors.muted, marginTop: 6, marginBottom: 10, fontSize: 12, lineHeight: 17 },
  sectionTitle2: { fontSize: 14, fontWeight: '800', color: colors.text, marginTop: spacing.md, marginBottom: 4 },
  coordInput: { padding: 12, borderRadius: radius.md, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, color: colors.text },
  error: { color: colors.danger, marginTop: 8 },
  fieldError: { color: colors.danger, fontSize: 12, marginTop: 4 },
})
