import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Pressable, Text, View } from 'react-native'
import { colors, radius, typography } from '../theme'

export default function QuickAction({ action, onPress }: { action: any; onPress?: () => void }) {
  const fallbackIcons: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
    consult: 'chatbubbles-outline',
    book: 'calendar-outline',
    records: 'document-text-outline',
  }
  const icon = action.icon || fallbackIcons[action.id]
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => ({ alignItems: 'center', width: 78, opacity: pressed ? 0.72 : 1 })}>
      <View style={{ width: 54, height: 54, borderRadius: radius.lg, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
        {icon ? <Ionicons name={icon} size={23} color={colors.primary} /> : <Text style={{ fontSize: 20 }}>{action.emoji}</Text>}
      </View>
      <Text style={{ ...typography.caption, textAlign: 'center', color: colors.text }}>{action.label}</Text>
    </Pressable>
  )
}
