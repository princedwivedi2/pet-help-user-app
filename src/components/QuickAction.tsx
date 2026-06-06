import React from 'react'
import { TouchableOpacity, Text, View } from 'react-native'
import { colors, radius } from '../theme'

export default function QuickAction({ action, onPress }: { action: any; onPress?: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', width: 80 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: colors.border }}>
        <Text style={{ fontSize: 20 }}>{action.emoji}</Text>
      </View>
      <Text style={{ textAlign: 'center', fontWeight: '700', color: colors.text }}>{action.label}</Text>
    </TouchableOpacity>
  )
}
