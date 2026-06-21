import React, { useCallback, useEffect, useState } from 'react'
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator,
  Modal, TextInput, Alert,
} from 'react-native'
import ErrorCard from '../../components/ErrorCard'
import EmptyState from '../../components/EmptyState'
import {
  getPetMedicalRecords, getPetVisitRecords, getPetMedications, getPetReminders, getPetNotes,
  createMedicalRecord, createMedication, createReminder,
} from '../../services'
import { useRoute } from '@react-navigation/native'
import { colors, radius, spacing } from '../../theme'
import { pickArray } from '../../utils/backendAdapters'
import { parseApiError } from '../../utils/apiError'

type Tab = 'visits' | 'vaccinations' | 'medications' | 'reminders' | 'notes'

const TABS: { key: Tab; label: string }[] = [
  { key: 'visits', label: 'Visits' },
  { key: 'vaccinations', label: 'Vaccinations' },
  { key: 'medications', label: 'Medications' },
  { key: 'reminders', label: 'Reminders' },
  { key: 'notes', label: 'Notes' },
]

function getEmptyState(tab: Tab) {
  if (tab === 'visits') {
    return { emoji: '🩺', title: 'No visit records', subtitle: 'Visit records from your vet will appear here.' }
  }
  return {
    emoji: '📄',
    title: `No ${tab} yet`,
    subtitle: "Add records to keep your pet's health up to date.",
  }
}

// Which tabs can have user-added records
const ADDABLE_TABS: Tab[] = ['vaccinations', 'medications', 'reminders']

// ─────────────────────────────────────────────────────────
// Add-record modal content per tab
// ─────────────────────────────────────────────────────────

function AddMedicalRecordForm({
  petId,
  recordType,
  onSuccess,
  onCancel,
}: {
  petId: string
  recordType: 'vaccination' | 'general'
  onSuccess: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError('')
    try {
      const res = await createMedicalRecord(petId, {
        record_type: recordType,
        title: title.trim(),
        notes: notes.trim() || undefined,
        date: date.trim() || undefined,
      })
      if (res?.success === false) { setError(res?.message || 'Failed to save'); return }
      onSuccess()
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.formBody}>
      <Text style={styles.modalTitle}>
        {recordType === 'vaccination' ? 'Add Vaccination' : 'Add Record'}
      </Text>
      {error ? <Text style={styles.formError}>{error}</Text> : null}
      <Text style={styles.fieldLabel}>Title *</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Rabies vaccine"
        placeholderTextColor={colors.muted}
      />
      <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="e.g. 2024-06-01"
        placeholderTextColor={colors.muted}
        keyboardType="numbers-and-punctuation"
      />
      <Text style={styles.fieldLabel}>Notes</Text>
      <TextInput
        style={[styles.input, styles.inputMulti]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Additional notes..."
        placeholderTextColor={colors.muted}
        multiline
        numberOfLines={3}
      />
      <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.saveBtnText}>Save</Text>}
      </Pressable>
      <Pressable style={styles.cancelBtn} onPress={onCancel}>
        <Text style={styles.cancelBtnText}>Cancel</Text>
      </Pressable>
    </View>
  )
}

function AddMedicationForm({
  petId,
  onSuccess,
  onCancel,
}: {
  petId: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [dosage, setDosage] = useState('')
  const [dosageUnit, setDosageUnit] = useState('mg')
  const [frequency, setFrequency] = useState('1')
  const [frequencyUnit, setFrequencyUnit] = useState<'daily' | 'weekly' | 'monthly' | 'as_needed' | 'hours'>('daily')
  const [startDate, setStartDate] = useState('')
  const [method, setMethod] = useState<'oral' | 'topical' | 'injection' | 'drops' | 'spray' | 'inhaler' | 'patch' | 'suppository' | 'other'>('oral')
  const [instructions, setInstructions] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const FREQ_UNITS = ['daily', 'weekly', 'monthly', 'as_needed', 'hours'] as const
  const METHODS = ['oral', 'topical', 'injection', 'drops', 'spray', 'other'] as const

  async function handleSave() {
    if (!name.trim()) { setError('Medication name is required'); return }
    if (!dosage.trim()) { setError('Dosage is required'); return }
    if (!startDate.trim()) { setError('Start date is required (YYYY-MM-DD)'); return }
    const freq = parseInt(frequency)
    if (!Number.isFinite(freq) || freq < 1) { setError('Frequency must be a positive number'); return }
    setSaving(true)
    setError('')
    try {
      const res = await createMedication(petId, {
        medication_name: name.trim(),
        dosage: dosage.trim(),
        dosage_unit: dosageUnit.trim() || 'mg',
        frequency: freq,
        frequency_unit: frequencyUnit,
        start_date: startDate.trim(),
        administration_method: method,
        instructions: instructions.trim() || undefined,
      })
      if (res?.success === false) { setError(res?.message || 'Failed to save'); return }
      onSuccess()
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.formBody}>
      <Text style={styles.modalTitle}>Add Medication</Text>
      {error ? <Text style={styles.formError}>{error}</Text> : null}
      <Text style={styles.fieldLabel}>Medication name *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g. Amoxicillin" placeholderTextColor={colors.muted} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 2 }}>
          <Text style={styles.fieldLabel}>Dosage *</Text>
          <TextInput style={styles.input} value={dosage} onChangeText={setDosage} placeholder="e.g. 250" placeholderTextColor={colors.muted} keyboardType="decimal-pad" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>Unit</Text>
          <TextInput style={styles.input} value={dosageUnit} onChangeText={setDosageUnit} placeholder="mg" placeholderTextColor={colors.muted} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>Frequency *</Text>
          <TextInput style={styles.input} value={frequency} onChangeText={setFrequency} placeholder="1" placeholderTextColor={colors.muted} keyboardType="number-pad" />
        </View>
        <View style={{ flex: 2 }}>
          <Text style={styles.fieldLabel}>Unit</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingTop: 4 }}>
            {FREQ_UNITS.map(u => (
              <Pressable key={u} onPress={() => setFrequency(prev => { setFrequencyUnit(u); return prev })} style={[styles.chipSm, frequencyUnit === u && styles.chipSmActive]}>
                <Text style={[styles.chipSmText, frequencyUnit === u && styles.chipSmTextActive]}>{u}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
      <Text style={styles.fieldLabel}>Start date * (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} placeholder="e.g. 2024-06-01" placeholderTextColor={colors.muted} keyboardType="numbers-and-punctuation" />
      <Text style={styles.fieldLabel}>Method</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: spacing.sm }}>
        {METHODS.map(m => (
          <Pressable key={m} onPress={() => setMethod(m as any)} style={[styles.chipSm, method === m && styles.chipSmActive]}>
            <Text style={[styles.chipSmText, method === m && styles.chipSmTextActive]}>{m}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.fieldLabel}>Instructions</Text>
      <TextInput style={[styles.input, styles.inputMulti]} value={instructions} onChangeText={setInstructions} placeholder="e.g. Give with food" placeholderTextColor={colors.muted} multiline numberOfLines={2} />
      <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.saveBtnText}>Save</Text>}
      </Pressable>
      <Pressable style={styles.cancelBtn} onPress={onCancel}>
        <Text style={styles.cancelBtnText}>Cancel</Text>
      </Pressable>
    </View>
  )
}

function AddReminderForm({
  petId,
  onSuccess,
  onCancel,
}: {
  petId: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'vaccination' | 'medication' | 'checkup' | 'grooming' | 'other'>('checkup')
  const [scheduledAt, setScheduledAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const TYPES = ['vaccination', 'medication', 'checkup', 'grooming', 'deworming', 'dental_care', 'other'] as const

  async function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    if (!scheduledAt.trim()) { setError('Scheduled date/time is required'); return }
    // Validate that the scheduled_at is after now
    const d = new Date(scheduledAt.trim())
    if (!Number.isFinite(d.getTime())) { setError('Enter a valid date/time (e.g. 2024-06-01T10:00:00)'); return }
    if (d.getTime() <= Date.now()) { setError('Scheduled time must be in the future'); return }

    setSaving(true)
    setError('')
    try {
      const res = await createReminder(petId, {
        title: title.trim(),
        description: description.trim() || undefined,
        reminder_type: type,
        scheduled_at: d.toISOString(),
      })
      if (res?.success === false) { setError(res?.message || 'Failed to save'); return }
      onSuccess()
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.formBody}>
      <Text style={styles.modalTitle}>Add Reminder</Text>
      {error ? <Text style={styles.formError}>{error}</Text> : null}
      <Text style={styles.fieldLabel}>Title *</Text>
      <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Annual checkup" placeholderTextColor={colors.muted} />
      <Text style={styles.fieldLabel}>Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: spacing.sm }}>
        {TYPES.map(t => (
          <Pressable key={t} onPress={() => setType(t as any)} style={[styles.chipSm, type === t && styles.chipSmActive]}>
            <Text style={[styles.chipSmText, type === t && styles.chipSmTextActive]}>{t.replace(/_/g, ' ')}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.fieldLabel}>Scheduled date/time *</Text>
      <TextInput
        style={styles.input}
        value={scheduledAt}
        onChangeText={setScheduledAt}
        placeholder="YYYY-MM-DDTHH:MM:SS"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
      />
      <Text style={styles.fieldHint}>Must be a future date. Example: 2025-08-15T10:00:00</Text>
      <Text style={styles.fieldLabel}>Description</Text>
      <TextInput style={[styles.input, styles.inputMulti]} value={description} onChangeText={setDescription} placeholder="Any extra details..." placeholderTextColor={colors.muted} multiline numberOfLines={2} />
      <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.saveBtnText}>Save reminder</Text>}
      </Pressable>
      <Pressable style={styles.cancelBtn} onPress={onCancel}>
        <Text style={styles.cancelBtnText}>Cancel</Text>
      </Pressable>
    </View>
  )
}

// ─────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────
export default function PetRecordsScreen() {
  const route = useRoute<any>()
  const pet = route.params?.pet
  const petId = route.params?.petId || pet?.uuid || pet?.id

  const [activeTab, setActiveTab] = useState<Tab>('visits')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [records, setRecords] = useState<any[]>([])
  const [addVisible, setAddVisible] = useState(false)

  const refetch = useCallback(async (tab: Tab) => {
    if (!petId) return
    setLoading(true)
    setError('')
    setRecords([])
    try {
      let res: any
      if (tab === 'visits') res = await getPetVisitRecords(petId)
      else if (tab === 'vaccinations') res = await getPetMedicalRecords(petId, 'type=vaccination')
      else if (tab === 'medications') res = await getPetMedications(petId)
      else if (tab === 'reminders') res = await getPetReminders(petId)
      else if (tab === 'notes') res = await getPetNotes(petId)

      const list = pickArray(res?.data, ['items', 'records', 'data', 'medications', 'reminders', 'notes', 'visit_records', 'medical_records'])
      setRecords(list)
    } catch (e) {
      setError(parseApiError(e))
    } finally {
      setLoading(false)
    }
  }, [petId])

  useEffect(() => { refetch(activeTab) }, [refetch, activeTab])

  function handleAddSuccess() {
    setAddVisible(false)
    refetch(activeTab)
    Alert.alert('Saved', 'Record added successfully.')
  }

  const emptyState = getEmptyState(activeTab)
  const canAdd = ADDABLE_TABS.includes(activeTab) && !!petId

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{pet?.name || 'Pet'} Records</Text>
            <Text style={styles.subtitle}>{pet?.species || ''} · Health history and reminders</Text>
          </View>
          {canAdd ? (
            <Pressable style={styles.addFab} onPress={() => setAddVisible(true)}>
              <Text style={styles.addFabText}>+ Add</Text>
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
          {TABS.map(t => (
            <Pressable key={t.key} onPress={() => setActiveTab(t.key)} style={[styles.tab, activeTab === t.key && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : null}

        {!loading && error ? <ErrorCard message={error} onRetry={() => refetch(activeTab)} /> : null}

        {!loading && !error && !records.length ? (
          <EmptyState
            emoji={emptyState.emoji}
            title={emptyState.title}
            subtitle={emptyState.subtitle}
            ctaLabel={canAdd ? `Add ${activeTab === 'vaccinations' ? 'vaccination' : activeTab === 'reminders' ? 'reminder' : 'medication'}` : undefined}
            onCta={canAdd ? () => setAddVisible(true) : undefined}
          />
        ) : null}

        {records.map((r, i) => (
          <RecordCard key={String(r.uuid || r.id || i)} record={r} tab={activeTab} />
        ))}
      </ScrollView>

      {/* Add record modal */}
      <Modal visible={addVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddVisible(false)}>
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.bg }}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'vaccinations' && (
            <AddMedicalRecordForm
              petId={petId}
              recordType="vaccination"
              onSuccess={handleAddSuccess}
              onCancel={() => setAddVisible(false)}
            />
          )}
          {activeTab === 'medications' && (
            <AddMedicationForm
              petId={petId}
              onSuccess={handleAddSuccess}
              onCancel={() => setAddVisible(false)}
            />
          )}
          {activeTab === 'reminders' && (
            <AddReminderForm
              petId={petId}
              onSuccess={handleAddSuccess}
              onCancel={() => setAddVisible(false)}
            />
          )}
        </ScrollView>
      </Modal>
    </View>
  )
}

function RecordCard({ record, tab }: { record: any; tab: Tab }) {
  const title = record.title || record.name || record.vaccine_name || record.medication_name || record.reminder_title || record.type || `${tab} record`
  const date = record.date || record.created_at || record.administered_at || record.due_date || record.scheduled_at || ''
  const formattedDate = date ? new Date(date).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : ''
  const detail = record.notes || record.description || record.dosage || record.body || ''
  const status = record.status || record.is_active ? (record.is_active ? 'Active' : record.status) : ''

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        {status ? <Text style={styles.cardBadge}>{status}</Text> : null}
      </View>
      {formattedDate ? <Text style={styles.cardDate}>{formattedDate}</Text> : null}
      {detail ? <Text style={styles.cardDetail}>{detail}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 48 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.muted, marginTop: 4 },
  addFab: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  addFabText: { color: colors.onPrimary, fontWeight: '800', fontSize: 13 },
  tabBar: { gap: 8, marginBottom: spacing.lg },
  tab: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  tabTextActive: { color: colors.onPrimary },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontWeight: '800', color: colors.text, flex: 1 },
  cardBadge: { color: colors.accent, fontWeight: '700', fontSize: 12, textTransform: 'capitalize' },
  cardDate: { color: colors.muted, fontSize: 12, marginTop: 4 },
  cardDetail: { color: colors.muted, marginTop: 6, lineHeight: 18 },
  // Modal form
  formBody: { gap: 4 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: colors.text, marginBottom: spacing.md },
  formError: { color: colors.danger, fontSize: 13, marginBottom: spacing.sm, backgroundColor: colors.dangerSoft, padding: spacing.sm, borderRadius: radius.sm },
  fieldLabel: { color: colors.text, fontWeight: '700', fontSize: 13, marginTop: spacing.sm, marginBottom: 6 },
  fieldHint: { color: colors.muted, fontSize: 11, marginTop: 4, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 13,
    color: colors.text,
    fontSize: 14,
  },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
  chipSm: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSmActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipSmText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  chipSmTextActive: { color: colors.onPrimary },
  saveBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: { color: colors.onPrimary, fontWeight: '800' },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: colors.muted, fontWeight: '700' },
})
