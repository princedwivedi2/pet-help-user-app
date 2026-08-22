import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, spacing, typography } from '../theme'
import PrimaryButton from './PrimaryButton'

type IconName = React.ComponentProps<typeof Ionicons>['name']

function inferredIcon(title: string): IconName {
  const value = title.toLowerCase()
  if (value.includes('pet')) return 'paw-outline'
  if (value.includes('prescription') || value.includes('record')) return 'medical-outline'
  if (value.includes('notification')) return 'notifications-outline'
  if (value.includes('payment') || value.includes('transaction')) return 'card-outline'
  if (value.includes('appointment') || value.includes('booking')) return 'calendar-outline'
  if (value.includes('article') || value.includes('post')) return 'newspaper-outline'
  if (value.includes('plan')) return 'sparkles-outline'
  return 'checkmark-circle-outline'
}

export default function EmptyState({ title, subtitle, ctaLabel, onCta, icon }: { emoji?: string; title: string; subtitle: string; ctaLabel?: string; onCta?: () => void; icon?: IconName }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon ?? inferredIcon(title)} size={30} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {ctaLabel && onCta ? (
        <View style={styles.ctaWrap}><PrimaryButton title={ctaLabel} onPress={onCta} /></View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.section, minHeight: 220, borderRadius: radius.xl, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
  iconWrap: { width: 64, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border },
  title: { ...typography.h3, color: colors.text, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { ...typography.body, color: colors.muted, textAlign: 'center', maxWidth: 280, marginBottom: spacing.lg },
  ctaWrap: { width: '100%', maxWidth: 280 },
})
