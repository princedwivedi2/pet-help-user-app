import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator, StyleSheet } from 'react-native'
// Alert is kept for slot/pet validation dialogs
import PrimaryButton from '../../components/PrimaryButton'
import ErrorCard from '../../components/ErrorCard'
import { createAppointment, getAppointmentSlots, getPets } from '../../services'
import { useNavigation, useRoute } from '@react-navigation/native'
import { colors, radius, spacing } from '../../theme'
import { addDays, formatDateKey, isFutureISO, normalizePet, pickArray } from '../../utils/backendAdapters'
import { parseApiError, getValidationErrors } from '../../utils/apiError'

// Backend returns slots as bare time-of-day strings (e.g. "09:00"). Combine them
// with the selected date so we get a real, parseable datetime + readable label.
function buildSlotOption(raw: any, dateKey: string): { value: string; label: string } | null {
  if (raw == null) return null

  let timePart = ''
  let fullDateTime = ''

  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return null
    if (trimmed.includes('T') || (trimmed.includes(' ') && trimmed.length > 8)) {
      fullDateTime = trimmed
    } else {
      timePart = trimmed
    }
  } else {
    fullDateTime = String(raw.scheduled_at || raw.start_at || raw.datetime || '').trim()
    timePart = String(raw.start_time || raw.time || raw.slot || raw.value || '').trim()
  }

  const value = fullDateTime || `${dateKey}T${timePart.length === 5 ? `${timePart}:00` : timePart}`
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return null

  return { value, label: date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }
}

export default function BookingScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const vetId = route.params?.vetId || route.params?.vet?.uuid || route.params?.vet?.id || 'vet-1'
  const vetName = route.params?.vet?.name || 'Veterinarian'
  const consultationFee = route.params?.vet?.fee ? Number(String(route.params.vet.fee).replace(/[^0-9]/g, '')) : 549

  const [pets, setPets] = useState<any[]>([])
  const [selectedPet, setSelectedPet] = useState<string>('')
  const [selectedType, setSelectedType] = useState<'clinic_visit' | 'online'>('clinic_visit')
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()))
  const [slots, setSlots] = useState<{ value: string; label: string }[]>([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [reason, setReason] = useState('General consultation')
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const amount = useMemo(() => (selectedType === 'online' ? Math.max(349, consultationFee - 150) : consultationFee), [consultationFee, selectedType])

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
        const nextSlots = rawSlots
          .map(slot => buildSlotOption(slot, selectedDate))
          .filter((slot): slot is { value: string; label: string } => Boolean(slot))
          .filter(slot => isFutureISO(slot.value))
        setSlots(nextSlots)
        setSelectedSlot(prev => prev && nextSlots.some(slot => slot.value === prev) ? prev : (nextSlots[0]?.value || ''))
      } catch (e) {
        setSlots([])
        setSelectedSlot('')
        setError(parseApiError(e))
      } finally {
        setPageLoading(false)
      }
    }

    loadSlots()
  }, [vetId, selectedDate])

  useEffect(() => {
    const pre = route.params?.preselectedType
    if (pre === 'online' || pre === 'clinic_visit') {
      setSelectedType(pre)
    }
  }, [route.params?.preselectedType])

  function validateField(field: string, value: string) {
    let msg = ''
    if (field === 'reason') {
      if (value.trim().length < 4) msg = 'Please describe the reason for your visit'
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
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleProceed() {
    if (loading) return

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
    setSubmitError('')
    try {
      const res = await createAppointment({
        vet_uuid: vetId,
        pet_id: selectedPet,
        scheduled_at: selectedSlot,
        appointment_type: selectedType,
        reason,
        notes: `Booked from mobile app for ${vetName}`,
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
        setSubmitError(res?.message || 'Unable to create appointment. Please try again.')
      }
    } catch (e) {
      // Surface 422 field errors into the form
      const fieldErrs = getValidationErrors(e)
      if (Object.keys(fieldErrs).length) {
        setErrors(fieldErrs)
      }
      setSubmitError(parseApiError(e))
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
            { value: 'online', label: 'Online' },
          ].map(item => (
            <Pressable key={item.value} onPress={() => setSelectedType(item.value as any)} style={[styles.typeCard, selectedType === item.value && styles.typeCardActive]}>
              <Text style={[styles.typeLabel, selectedType === item.value && styles.typeLabelActive]}>{item.label}</Text>
              <Text style={[styles.typeMeta, selectedType === item.value && styles.typeMetaActive]}>{item.value === 'online' ? 'Video / audio' : 'At clinic'}</Text>
            </Pressable>
          ))}
        </View>
      </View>

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

      {submitError ? <ErrorCard message={submitError} onRetry={handleProceed} /> : null}

      <PrimaryButton title={loading ? 'Creating booking…' : `Confirm & Pay ₹${amount}`} onPress={handleProceed} disabled={loading} />
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
  typeCard: { flexGrow: 1, flexBasis: '47%', minWidth: 120, padding: 14, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSoft },
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
  error: { color: colors.danger, marginTop: 8 },
  fieldError: { color: colors.danger, fontSize: 12, marginTop: 4 },
})
