import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors, spacing } from '../theme'
import PrimaryButton from './PrimaryButton'

export default function EmptyState({ emoji, title, subtitle, ctaLabel, onCta }: { emoji: string; title: string; subtitle: string; ctaLabel?: string; onCta?: () => void }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {ctaLabel && onCta ? (
        <View style={styles.ctaWrap}><PrimaryButton title={ctaLabel} onPress={onCta} /></View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, minHeight: 200 },
  emoji: { fontSize: 48, marginBottom: spacing.sm },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20, marginBottom: spacing.lg },
  ctaWrap: { width: '100%' },
})
