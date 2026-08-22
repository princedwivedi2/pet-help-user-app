import React from 'react'
import { Text, View } from 'react-native'
import { colors, radius, typography } from '../theme'

export default function Chip({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: colors.primarySoft, paddingHorizontal: 11, paddingVertical: 6, borderRadius: radius.full, marginRight: 8 }}>
      <Text style={{ ...typography.caption, color: colors.primary, fontWeight: '700' }}>{children}</Text>
    </View>
  )
}
