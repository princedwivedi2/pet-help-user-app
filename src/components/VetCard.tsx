import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import Chip from './Chip'
import { colors, radius, spacing } from '../theme'

export default function VetCard({ vet, onPress }: { vet: any; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, minWidth: 240 }}>
      <Text style={{ fontWeight: '800', fontSize: 16, color: colors.text }}>{vet.name}</Text>
      <Text style={{ color: colors.muted, marginTop: 4 }}>{vet.clinic} • {vet.specialization}</Text>
      <View style={{ flexDirection: 'row', marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <Text style={{ marginRight: 12, color: colors.text, fontWeight: '700' }}>{vet.rating} ⭐ ({vet.reviews})</Text>
        <Text style={{ marginRight: 12, color: colors.muted }}>{vet.distance}</Text>
        <Text style={{ fontWeight: '800', color: colors.primary }}>{vet.fee}</Text>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        {vet.chips?.map((c: string) => (
          <Chip key={c}>{c}</Chip>
        ))}
      </View>
    </TouchableOpacity>
  )
}
