import React, { createContext, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import * as api from '../services'

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
    // Expo push token registration requires expo-notifications.
    // Register a placeholder so the call succeeds when the package is added.
    const platform = 'android'
    const storedToken = await SecureStore.getItemAsync('expoPushToken')
    if (storedToken) {
      await api.registerDeviceToken({ token: storedToken, platform })
    }
  } catch {
    // Non-fatal — push notifications won't work until expo-notifications is added
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
          if (res?.data) setUser(res.data)
          else {
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
    // Call the backend to invalidate the session and deactivate push token
    try {
      await api.logout()
    } catch {
      // Continue with local sign-out even if the request fails
    }
    setUser(null)
    await setToken(null)
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
