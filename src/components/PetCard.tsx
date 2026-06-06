import React from 'react'
import { View, Text } from 'react-native'
import { colors, radius } from '../theme'

export default function PetCard({ pet }: { pet: any }) {
  return (
    <View style={{ backgroundColor: colors.surface, padding: 12, borderRadius: radius.lg, marginRight: 12, width: 160, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ fontSize: 28 }}>{pet.emoji}</Text>
      <Text style={{ fontWeight: '800', color: colors.text }}>{pet.name}</Text>
      <Text style={{ color: colors.muted }}>{pet.species}</Text>
      <Text style={{ marginTop: 8, color: colors.warning, fontWeight: '700' }}>{pet.reminder}</Text>
    </View>
  )
}
