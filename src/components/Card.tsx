import React from 'react'
import { StyleSheet, View } from 'react-native'
import { colors, radius, shadows, spacing } from '../theme'

export default function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
})
