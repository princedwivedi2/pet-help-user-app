import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import ErrorCard from '../../components/ErrorCard'
import EmptyState from '../../components/EmptyState'
import { getPetMedicalRecords, getPetVisitRecords, getPetMedications, getPetReminders, getPetNotes } from '../../services'
import { useRoute } from '@react-navigation/native'
import { colors, radius, spacing } from '../../theme'
import { pickArray } from '../../utils/backendAdapters'

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

export default function PetRecordsScreen() {
  const route = useRoute<any>()
  const pet = route.params?.pet
  const petId = route.params?.petId || pet?.uuid || pet?.id

  const [activeTab, setActiveTab] = useState<Tab>('visits')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [records, setRecords] = useState<any[]>([])

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
    } catch {
      setError('Unable to load. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [petId])

  useEffect(() => { refetch(activeTab) }, [refetch, activeTab])

  const emptyState = getEmptyState(activeTab)

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{pet?.name || 'Pet'} Records</Text>
      <Text style={styles.subtitle}>{pet?.species || ''} · Health history and reminders</Text>

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
        />
      ) : null}

      {records.map((r, i) => (
        <RecordCard key={String(r.uuid || r.id || i)} record={r} tab={activeTab} />
      ))}
    </ScrollView>
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
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.muted, marginTop: 4, marginBottom: spacing.lg },
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
})
