import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { colors, radius, spacing, typography } from '../theme'

type IconName = React.ComponentProps<typeof Ionicons>['name']

export default function PageHeader({
  title,
  subtitle,
  rightIcon,
  onRightPress,
  rightLabel,
}: {
  title: string
  subtitle?: string
  rightIcon?: IconName
  onRightPress?: () => void
  rightLabel?: string
}) {
  const navigation = useNavigation<any>()

  return (
    <View style={styles.header}>
      <Pressable onPress={() => navigation.goBack()} style={styles.iconButton} hitSlop={10} accessibilityLabel="Go back">
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
      </Pressable>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      {rightIcon && onRightPress ? (
        <Pressable onPress={onRightPress} style={styles.iconButton} hitSlop={10} accessibilityLabel={rightLabel ?? 'Page action'}>
          <Ionicons name={rightIcon} size={21} color={colors.primary} />
        </Pressable>
      ) : <View style={[styles.iconButton, styles.iconButtonPlaceholder]} />}
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  copy: { flex: 1 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  iconButtonPlaceholder: { backgroundColor: 'transparent', borderColor: 'transparent' },
  title: { ...typography.h2, color: colors.text, letterSpacing: -0.4 },
  subtitle: { ...typography.caption, color: colors.muted, marginTop: 2 },
})
