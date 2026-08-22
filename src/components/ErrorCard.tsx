import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, shadows, spacing, typography } from '../theme'

export default function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}><Ionicons name="cloud-offline-outline" size={22} color={colors.danger} /></View>
      <View style={styles.copy}>
        <Text style={styles.title}>We couldn't load this</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      <Pressable style={styles.retry} onPress={onRetry} accessible accessibilityLabel="Try again">
        <Ionicons name="refresh" size={16} color={colors.primary} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.dangerBorder, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md, ...shadows.card },
  iconWrap: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dangerSoft },
  copy: { flex: 1 },
  title: { ...typography.label, color: colors.text },
  message: { ...typography.caption, color: colors.muted, marginTop: 2 },
  retry: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
})
