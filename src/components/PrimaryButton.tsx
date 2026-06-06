import React from 'react'
import { TouchableOpacity, Text } from 'react-native'
import { colors, radius } from '../theme'

export default function PrimaryButton({ title, onPress, disabled = false }: { title: string; onPress?: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? colors.border : colors.primary,
        paddingVertical: 14,
        borderRadius: radius.md,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      <Text style={{ color: '#fff7f1', textAlign: 'center', fontWeight: '800' }}>{title}</Text>
    </TouchableOpacity>
  )
}
