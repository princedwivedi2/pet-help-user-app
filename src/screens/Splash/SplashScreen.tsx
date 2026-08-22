import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { StatusBar } from 'expo-status-bar'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { me } from '../../services'
import { colors, radius, spacing, typography } from '../../theme'

export default function SplashScreen() {
  const navigation = useNavigation<any>()
  const mounted = useRef(true)
  const insets = useSafeAreaInsets()

  useEffect(() => {
    const delay = new Promise(resolve => setTimeout(resolve, 1200))

    async function check() {
      try {
        const token = await SecureStore.getItemAsync('authToken')
        if (!token) {
          await delay
          if (mounted.current) navigation.replace('Auth.Login')
          return
        }

        const [, res] = await Promise.all([delay, me()])
        if (res?.data) {
          if (mounted.current) navigation.replace('Main')
          return
        }

        await SecureStore.deleteItemAsync('authToken')
        if (mounted.current) navigation.replace('Auth.Login')
      } catch {
        await delay
        if (mounted.current) navigation.replace('Auth.Login')
      }
    }

    check()
    return () => {
      mounted.current = false
    }
  }, [])

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 24) }]}>
      <StatusBar style="light" />
      <View style={styles.decorTop} />
      <View style={styles.decorBottom} />
      <View style={styles.overlay}>
        <View style={styles.brandMark}>
          <View style={styles.pawMark}>
            <Ionicons name="paw" size={34} color={colors.primary} />
          </View>
          <Text style={styles.wordmark}>respaw</Text>
          <Text style={styles.tagline}>Better care. Happier paws.</Text>
        </View>
        <View style={styles.loadingRow}>
          <View style={styles.loadingDot} />
          <Text style={styles.version}>PREPARING YOUR PET CARE</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.primary, overflow: 'hidden' },
  decorTop: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 42, borderColor: 'rgba(255,247,240,0.06)', top: -90, right: -70 },
  decorBottom: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,247,240,0.045)', bottom: -150, left: -100 },
  overlay: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  brandMark: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pawMark: { width: 70, height: 70, borderRadius: radius.xl, backgroundColor: colors.onPrimary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  wordmark: {
    color: colors.onPrimary,
    fontSize: 60,
    lineHeight: 66,
    fontWeight: '900',
    letterSpacing: -3,
    textTransform: 'lowercase',
  },
  tagline: {
    marginTop: spacing.xs,
    color: 'rgba(255,247,240,0.84)',
    ...typography.body,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  loadingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.onPrimary },
  version: { color: 'rgba(255,247,240,0.72)', fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
})
