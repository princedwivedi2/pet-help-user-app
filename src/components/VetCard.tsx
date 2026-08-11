import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Chip from './Chip'
import { colors, radius, shadows, spacing, typography } from '../theme'

export default function VetCard({ vet, onPress, fullWidth = false }: { vet: any; onPress?: () => void; fullWidth?: boolean }) {
  const initial = String(vet.name || 'V').replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase()

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.card, fullWidth && styles.fullWidth, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>{vet.name}</Text>
          <Text style={styles.clinic} numberOfLines={1}>{vet.clinic || vet.specialization}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}><Ionicons name="star" size={14} color={colors.warning} /><Text style={styles.metaStrong}>{vet.rating || 'New'}</Text></View>
        {vet.distance ? <View style={styles.metaItem}><Ionicons name="location-outline" size={14} color={colors.muted} /><Text style={styles.metaText}>{vet.distance}</Text></View> : null}
        {vet.fee ? <Text style={styles.fee}>{vet.fee}</Text> : null}
      </View>

      {vet.chips?.length ? (
        <View style={styles.chips}>{vet.chips.slice(0, 2).map((chip: string) => <Chip key={chip}>{chip}</Chip>)}</View>
      ) : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { width: 286, padding: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  fullWidth: { width: '100%' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  header: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  avatarText: { fontSize: 18, fontWeight: '900', color: colors.primary },
  identity: { flex: 1, paddingRight: spacing.sm },
  name: { ...typography.h3, color: colors.text },
  clinic: { ...typography.caption, color: colors.muted, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaStrong: { ...typography.label, color: colors.text },
  metaText: { ...typography.caption, color: colors.muted },
  fee: { ...typography.label, color: colors.primary, marginLeft: 'auto' },
  chips: { flexDirection: 'row', marginTop: spacing.md, overflow: 'hidden' },
})
