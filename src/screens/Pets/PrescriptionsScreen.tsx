import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Linking } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, spacing } from '../../theme'
import ErrorCard from '../../components/ErrorCard'
import EmptyState from '../../components/EmptyState'
import { getPetVisitRecords } from '../../services/pets'
import { pickArray } from '../../utils/adapters'

export default function PrescriptionsScreen() {
  const nav = useNavigation<any>()
  const route = useRoute<any>()
  const { petId, pet } = route.params ?? {}

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [records, setRecords] = useState<any[]>([])

  const refetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getPetVisitRecords(petId)
      const all = pickArray(res?.data ?? res, ['records', 'visit_records', 'items'])
      const withRx = all
        .filter((r: any) => r.prescription_text || r.prescription_file)
        .sort((a: any, b: any) => {
          const dateA = new Date(a.visit_date ?? a.created_at ?? 0).getTime()
          const dateB = new Date(b.visit_date ?? b.created_at ?? 0).getTime()
          return dateB - dateA
        })
      setRecords(withRx)
    } catch {
      setError('Unable to load. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [petId])

  useEffect(() => { refetch() }, [refetch])

  async function handleDownload(url: string) {
    try {
      await Linking.openURL(url)
    } catch {
      // no-op — inline feedback handled by the text below
    }
  }

  const petName = pet?.name ?? pet?.pet_name ?? ''

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => nav.goBack()} accessibilityLabel="Go back" style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.pageTitle}>{petName ? `${petName}'s Prescriptions` : 'Prescriptions'}</Text>
      </View>

      {loading ? <ActivityIndicator color={colors.primary} style={styles.spinner} /> : null}
      {!loading && error ? <ErrorCard message={error} onRetry={refetch} /> : null}
      {!loading && !error && records.length === 0 ? (
        <EmptyState
          emoji="💊"
          title="No prescriptions yet"
          subtitle="Prescriptions from your vet visits will appear here."
          ctaLabel="Book an appointment"
          onCta={() => nav.navigate('Search')}
        />
      ) : null}

      {!loading && !error
        ? records.map((record: any, i: number) => {
            const dateRaw = record.visit_date ?? record.created_at ?? ''
            const formattedDate = dateRaw
              ? new Date(dateRaw).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
              : ''
            const fileUrl = record.prescription_file ?? ''
            return (
              <View key={record.uuid ?? record.id ?? i} style={styles.card}>
                {formattedDate ? <Text style={styles.dateText}>{formattedDate}</Text> : null}
                {record.diagnosis ? (
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>Diagnosis</Text>
                    <Text style={styles.fieldValue}>{record.diagnosis}</Text>
                  </View>
                ) : null}
                {record.prescription_text ? (
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>Prescription</Text>
                    <Text style={styles.fieldValue}>{record.prescription_text}</Text>
                  </View>
                ) : null}
                {record.treatment ? (
                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>Treatment</Text>
                    <Text style={styles.fieldValue}>{record.treatment}</Text>
                  </View>
                ) : null}
                {fileUrl ? (
                  <Pressable
                    style={styles.downloadRow}
                    onPress={() => handleDownload(fileUrl)}
                    accessibilityLabel="Download prescription"
                  >
                    <Ionicons name="download-outline" size={20} color={colors.accent} />
                    <Text style={styles.downloadText}>Download prescription</Text>
                  </Pressable>
                ) : null}
              </View>
            )
          })
        : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 48 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, gap: spacing.sm },
  backBtn: { padding: 4 },
  pageTitle: { fontSize: 24, fontWeight: '700', color: colors.text, flex: 1 },
  spinner: { marginTop: spacing.xl },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 8,
  },
  dateText: { fontSize: 12, color: colors.muted, marginBottom: 4 },
  fieldBlock: { gap: 2 },
  fieldLabel: { fontSize: 12, color: colors.muted, fontWeight: '600', letterSpacing: 0.4 },
  fieldValue: { fontSize: 14, color: colors.text, lineHeight: 20 },
  downloadRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  downloadText: { fontSize: 14, color: colors.accent, fontWeight: '700' },
})
