import React, { createContext, useContext, useEffect, useState } from 'react'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import * as Notifications from 'expo-notifications'
import * as api from '../services'
import { setUnauthorizedHandler, firePostSignOutNav } from '../utils/authEvents'

type AuthContextType = {
  user: any | null
  token: string | null
  setToken: (t: string | null) => void
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

async function registerDeviceTokenSilently() {
  try {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android'

    // Request permission (no-op if already granted or denied)
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }
    if (finalStatus !== 'granted') return

    // Get the native push token (FCM on Android, APNs on iOS).
    // This throws on simulators and when the native push service is unconfigured —
    // the catch below ensures it's always non-fatal.
    const tokenData = await Notifications.getDevicePushTokenAsync()
    const token = tokenData.data as string
    if (!token) return

    await SecureStore.setItemAsync('expoPushToken', token)
    await api.registerDeviceToken({ token, platform })
  } catch {
    // Non-fatal — push notifications degrade silently without a real FCM config
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null)
  const [token, setTokenState] = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const t = await SecureStore.getItemAsync('authToken')
      if (t) {
        setTokenState(t)
        try {
          const res = await api.me()
          if (res?.data) {
            setUser(res.data)
            // Re-register on every resumed session too, not just fresh logins —
            // the FCM/APNs token can rotate independently of the auth session.
            registerDeviceTokenSilently()
          } else {
            await SecureStore.deleteItemAsync('authToken')
            setTokenState(null)
          }
        } catch {
          await SecureStore.deleteItemAsync('authToken')
          setTokenState(null)
          setUser(null)
        }
      }
    }
    init()
  }, [])

  // Wire the global 401 handler so any unauthorized API response clears the session
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null)
      setTokenState(null)
      SecureStore.deleteItemAsync('authToken').catch(() => {})
      // firePostSignOutNav is called after state updates; the nav callback is
      // registered by AppNavigator and routes to Auth.Login
      firePostSignOutNav()
    })
  }, [])

  const refreshUser = async () => {
    try {
      const res = await api.me()
      if (res?.data) setUser(res.data)
    } catch {
      // ignore — user stays as-is
    }
  }

  const setToken = async (t: string | null) => {
    setTokenState(t)
    if (t) {
      await SecureStore.setItemAsync('authToken', t)
      try {
        const res = await api.me()
        if (res?.data) setUser(res.data)
      } catch {
        setUser(null)
      }
      // Register push device token now that we have auth
      registerDeviceTokenSilently()
    } else {
      await SecureStore.deleteItemAsync('authToken')
      setUser(null)
    }
  }

  const signOut = async () => {
    try {
      await api.logout()
    } catch {
      // Continue with local sign-out even if the request fails
    }
    setUser(null)
    setTokenState(null)
    await SecureStore.deleteItemAsync('authToken')
    firePostSignOutNav()
  }

  return (
    <AuthContext.Provider value={{ user, token, setToken, signOut, refreshUser }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
