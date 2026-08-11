import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, shadows, spacing, typography } from '../theme'

export default function AppointmentCard({ appt }: { appt: any }) {
  const statusColor = appt.status === 'confirmed' || appt.status === 'completed' ? colors.accent : appt.status === 'cancelled' ? colors.danger : colors.warning

  return (
    <View style={styles.card}>
      <View style={styles.dateTile}>
        <Ionicons name="calendar-outline" size={21} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{appt.title}</Text>
        <Text style={styles.vet} numberOfLines={1}>{[appt.vet, appt.pet].filter(Boolean).join(' · ')}</Text>
        <View style={styles.footer}>
          <Text style={styles.when}>{appt.when}</Text>
          <View style={[styles.status, { backgroundColor: `${statusColor}18` }]}>
            <View style={[styles.dot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{appt.status}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  dateTile: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  content: { flex: 1 },
  title: { ...typography.h3, color: colors.text },
  vet: { ...typography.caption, color: colors.muted, marginTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md, gap: spacing.sm },
  when: { ...typography.label, color: colors.text, flex: 1 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
})
