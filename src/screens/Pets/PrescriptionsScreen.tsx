import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Linking } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, shadows, spacing, typography } from '../../theme'
import ErrorCard from '../../components/ErrorCard'
import EmptyState from '../../components/EmptyState'
import PageHeader from '../../components/PageHeader'
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
      <PageHeader
        title={petName ? `${petName}'s prescriptions` : 'Prescriptions'}
        subtitle="Treatment instructions and files from vet visits"
      />

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
                <View style={styles.cardHeader}>
                  <View style={styles.cardIdentity}><View style={styles.rxIcon}><Ionicons name="medical" size={18} color={colors.primary} /></View><Text style={styles.cardTitle}>Prescription</Text></View>
                  {formattedDate ? <Text style={styles.dateText}>{formattedDate}</Text> : null}
                </View>
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
  content: { padding: spacing.xl, paddingBottom: 48 },
  spinner: { marginTop: spacing.xl },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...shadows.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  cardIdentity: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rxIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  cardTitle: { ...typography.h3, color: colors.text },
  dateText: { ...typography.caption, color: colors.muted },
  fieldBlock: { gap: 3 },
  fieldLabel: { ...typography.caption, color: colors.muted, fontWeight: '700', letterSpacing: 0.3 },
  fieldValue: { ...typography.body, color: colors.text },
  downloadRow: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, borderRadius: radius.md, backgroundColor: colors.accentSoft },
  downloadText: { ...typography.label, color: colors.accent },
})
