import React from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { colors, radius, typography } from '../theme'

export default function PrimaryButton({ title, onPress, disabled = false }: { title: string; onPress?: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && !disabled && styles.pressed]}
    >
      <Text style={[styles.label, disabled && styles.disabledLabel]}>{title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  pressed: { backgroundColor: colors.primaryPressed, transform: [{ scale: 0.99 }] },
  disabled: { backgroundColor: colors.border, opacity: 0.85 },
  label: { ...typography.bodyStrong, color: colors.onPrimary, textAlign: 'center' },
  disabledLabel: { color: colors.subtle },
})
