import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, ImageBackground } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { useNavigation } from '@react-navigation/native'
import { me } from '../../services'
import { colors, radius, spacing } from '../../theme'

export default function SplashScreen() {
  const navigation = useNavigation<any>()
  const mounted = useRef(true)

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

        await Promise.all([delay, me()])
        if (mounted.current) navigation.replace('Main')
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
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80' }}
      style={styles.screen}
      imageStyle={styles.image}
    >
      <View style={styles.overlay}>
        <View style={styles.brandMark}>
          <Text style={styles.wordmark}>respaw</Text>
          <Text style={styles.tagline}>Find trusted care for your pet</Text>
        </View>
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.primary },
  image: { opacity: 0.1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255,107,44,0.96)',
    paddingHorizontal: spacing.xl,
    paddingBottom: 36,
    justifyContent: 'space-between',
  },
  brandMark: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    color: colors.onPrimary,
    fontSize: 58,
    lineHeight: 60,
    fontWeight: '800',
    letterSpacing: -1.5,
    textTransform: 'lowercase',
    fontFamily: 'serif',
  },
  tagline: {
    marginTop: spacing.sm,
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  version: {
    color: 'rgba(255,247,241,0.75)',
    textAlign: 'center',
    fontSize: 11,
    letterSpacing: 1.2,
  },
})
