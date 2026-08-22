import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, shadows, spacing, typography } from '../theme'
import { resolveMediaUrl } from '../utils/adapters'

export default function PetCard({ pet, fullWidth }: { pet: any; fullWidth?: boolean }) {
  const photo = pet.photoUrl || resolveMediaUrl(pet.raw?.photo_url)
  const initial = String(pet.name || '').trim().charAt(0).toUpperCase()
  const meta = [pet.species, pet.breed, pet.age, pet.weight].filter(Boolean).join(' · ')
  const size = fullWidth ? 54 : 50

  return (
    <View style={[styles.card, fullWidth ? styles.full : styles.compact]}>
      <View style={[styles.avatar, fullWidth && styles.avatarFull, { width: size, height: size, borderRadius: size / 2 }]}>
        {photo ? <Image source={{ uri: photo }} style={styles.photo} /> : initial ? <Text style={styles.initial}>{initial}</Text> : <Ionicons name="paw" size={22} color={colors.primary} />}
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{pet.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>{meta || 'Pet profile'}</Text>
        {!fullWidth && pet.reminder ? <Text style={styles.reminder} numberOfLines={1}>{pet.reminder}</Text> : null}
      </View>
      {fullWidth ? <Ionicons name="chevron-forward" size={18} color={colors.subtle} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, ...shadows.card },
  compact: { width: 178, padding: spacing.lg, marginRight: spacing.md },
  full: { width: '100%', padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: spacing.md },
  avatarFull: { marginBottom: 0 },
  photo: { width: '100%', height: '100%' },
  initial: { fontSize: 20, fontWeight: '900', color: colors.primary },
  content: { flex: 1 },
  name: { ...typography.h3, color: colors.text },
  meta: { ...typography.caption, color: colors.muted, marginTop: 2, textTransform: 'capitalize' },
  reminder: { ...typography.caption, color: colors.warning, marginTop: spacing.md },
})
