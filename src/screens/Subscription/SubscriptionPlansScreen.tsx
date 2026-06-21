import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, spacing } from '../../theme'
import { pickArray } from '../../utils/adapters'
import {
  getSubscriptionPlans,
  getActiveSubscription,
} from '../../services/subscriptions'
import { parseApiError } from '../../utils/apiError'
import ErrorCard from '../../components/ErrorCard'
import EmptyState from '../../components/EmptyState'
import PrimaryButton from '../../components/PrimaryButton'

export default function SubscriptionPlansScreen() {
  const nav = useNavigation<any>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [plans, setPlans] = useState<any[]>([])
  const [active, setActive] = useState<any>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [plansRes, activeRes] = await Promise.all([
        getSubscriptionPlans(),
        getActiveSubscription().catch(() => null),
      ])
      const planData = pickArray(plansRes?.data ?? plansRes, [
        'plans',
        'subscription_plans',
      ])
      setPlans(planData)
      const activeData = activeRes?.data ?? activeRes
      setActive(activeData && typeof activeData === 'object' && !Array.isArray(activeData)
        ? activeData
        : null)
    } catch (e) {
      setError(parseApiError(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  function handleChoosePlan(plan: any) {
    Alert.alert(
      'Subscribe?',
      `${plan.name ?? plan.plan_name} — confirm subscription`,
      [
        { text: 'Cancel' },
        {
          text: 'Subscribe',
          onPress: () => {
            nav.navigate('Payment', {
              subscriptionPlanUuid: plan.uuid,
              amount: plan.price ?? plan.amount ?? plan.monthly_price,
              vetName: plan.name ?? plan.plan_name,
            })
          },
        },
      ],
    )
  }

  const isActivePlan = (plan: any) =>
    active &&
    (active.plan_uuid === plan.uuid ||
      active.subscription_plan?.uuid === plan.uuid ||
      active.plan?.uuid === plan.uuid)

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Subscription Plans</Text>
      <Text style={styles.subtitle}>
        Unlock unlimited vet access and priority care.
      </Text>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" accessibilityLabel="Loading" />
        </View>
      )}

      {!loading && error ? (
        <ErrorCard message={error} onRetry={refetch} />
      ) : null}

      {!loading && !error && plans.length === 0 ? (
        <EmptyState
          emoji="⭐"
          title="No plans available"
          subtitle="Subscription plans will be listed here."
        />
      ) : null}

      {!loading && !error && active ? (
        <View style={styles.activeBanner}>
          <View style={styles.activeBannerRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
            <Text style={styles.activeBannerLabel}>Active Plan</Text>
          </View>
          <Text style={styles.activePlanName}>
            {active.plan_name ?? active.plan?.name ?? active.subscription_plan?.name ?? 'Your plan'}
          </Text>
          {active.expires_at || active.end_date ? (
            <Text style={styles.activePlanExpiry}>
              Expires:{' '}
              {new Date(active.expires_at ?? active.end_date).toLocaleDateString()}
            </Text>
          ) : null}
        </View>
      ) : null}

      {!loading && !error && plans.map((plan: any) => {
        const features: string[] = Array.isArray(plan.features)
          ? plan.features
          : []
        const amount = plan.price ?? plan.amount ?? plan.monthly_price ?? ''
        const currentPlan = isActivePlan(plan)

        return (
          <View key={plan.uuid ?? plan.id} style={styles.planCard}>
            <Text style={styles.planName}>
              {plan.name ?? plan.plan_name}
            </Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceAmount}>
                {typeof amount === 'number' ? `₹${amount}` : amount}
              </Text>
              <Text style={styles.priceUnit}>/month</Text>
            </View>
            {features.map((feature: string, i: number) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color={colors.accent}
                />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
            <View style={styles.ctaWrap}>
              {currentPlan ? (
                <PrimaryButton title="Current Plan" onPress={() => {}} disabled />
              ) : (
                <PrimaryButton
                  title="Choose a plan"
                  onPress={() => handleChoosePlan(plan)}
                />
              )}
            </View>
          </View>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, marginTop: spacing.xs, lineHeight: 20 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
  activeBanner: {
    backgroundColor: colors.mint,
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  activeBannerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  activeBannerLabel: { fontSize: 14, fontWeight: '700', color: colors.accent },
  activePlanName: { fontSize: 14, color: colors.text, marginTop: spacing.xs },
  activePlanExpiry: { fontSize: 12, color: colors.muted, marginTop: 2 },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  planName: { fontSize: 18, fontWeight: '700', color: colors.text },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.sm },
  priceAmount: { fontSize: 28, fontWeight: '700', color: colors.primary },
  priceUnit: { fontSize: 14, color: colors.muted, marginBottom: 4, marginLeft: 2 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  featureText: { fontSize: 14, color: colors.text, lineHeight: 20, flex: 1 },
  ctaWrap: { marginTop: spacing.lg },
})
