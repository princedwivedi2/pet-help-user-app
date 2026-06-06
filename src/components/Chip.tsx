import React from 'react'
import { Text, View } from 'react-native'
import { colors, radius } from '../theme'

export default function Chip({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: colors.primarySoft, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.md, marginRight: 8 }}>
      <Text style={{ color: colors.primary, fontWeight: '700' }}>{children}</Text>
    </View>
  )
}
