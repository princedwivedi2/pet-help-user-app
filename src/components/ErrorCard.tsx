import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, spacing } from '../theme'

export default function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.card}>
      <Ionicons name="warning-outline" size={20} color={colors.danger} />
      <Text style={styles.message}>{message}</Text>
      <Pressable style={styles.retry} onPress={onRetry} accessible accessibilityLabel="Try again">
        <Text style={styles.retryText}>Try again</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surfaceSoft, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  message: { color: colors.danger, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  retry: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.primary },
  retryText: { color: colors.onPrimary, fontWeight: '700', fontSize: 14 },
})
