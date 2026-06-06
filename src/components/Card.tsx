import React from 'react'
import { View } from 'react-native'
import { colors, radius, spacing } from '../theme'

export default function Card({ children }: { children: React.ReactNode }) {
  return <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border }}>{children}</View>
}
