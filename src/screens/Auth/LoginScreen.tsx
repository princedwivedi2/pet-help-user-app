import React, { useMemo, useState } from 'react'
import { View, Text, TextInput, Alert, ScrollView, Pressable, StyleSheet } from 'react-native'
import PrimaryButton from '../../components/PrimaryButton'
import { login, register, sendOtp, verifyOtp, forgotPassword } from '../../services'
import { API_BASE } from '../../services/client'
import { useAuth } from '../../contexts/AuthProvider'
import { useNavigation } from '@react-navigation/native'
import { colors, radius, spacing } from '../../theme'

export default function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'signup' | 'otp'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const { setToken } = useAuth()
  const navigation = useNavigation<any>()

  const identifier = useMemo(() => email.trim() || phone.trim(), [email, phone])
  const trimmedName = name.trim()
  const trimmedPassword = password.trim()
  const trimmedConfirmPassword = confirmPassword.trim()
  const trimmedOtpCode = otpCode.trim()
  const canSignIn = Boolean(identifier && trimmedPassword) && !loading
  const canSignUp = Boolean(trimmedName && identifier && trimmedPassword && trimmedConfirmPassword) && !loading
  const canSendOtp = Boolean(identifier) && !loading
  const canVerifyOtp = Boolean(identifier && trimmedOtpCode) && !loading

  async function handleSignIn() {
    if (!identifier || !trimmedPassword) {
      Alert.alert('Login failed', 'Enter both email or phone and password before signing in.')
      return
    }

    setLoading(true)
    try {
      const res = await login({
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password: trimmedPassword,
      })
      if (res?.data?.token) {
        await setToken(res.data.token)
        navigation.replace('Main')
        return
      }

      Alert.alert('Login failed', res?.message || 'Unable to login. Please try again.')
    } catch (error) {
      Alert.alert('Login failed', `${String(error)}\n\nAPI: ${API_BASE}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp() {
    if (!trimmedName || !identifier || !trimmedPassword || !trimmedConfirmPassword) {
      Alert.alert('Signup failed', 'Fill in all required fields before creating an account.')
      return
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      Alert.alert('Signup failed', 'Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await register({
        name: trimmedName,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password: trimmedPassword,
        password_confirmation: trimmedConfirmPassword,
      })
      if (res?.data?.token) {
        await setToken(res.data.token)
        navigation.replace('Main')
        return
      }

      Alert.alert('Signup failed', res?.message || 'Unable to create your account.')
    } catch (error) {
      Alert.alert('Signup failed', String(error))
    } finally {
      setLoading(false)
    }
  }

  async function handleOtp() {
    if (!identifier) {
      Alert.alert('OTP', 'Enter a phone number or email first.')
      return
    }

    setLoading(true)
    try {
      if (!otpSent) {
        const res = await sendOtp({ identifier })
        if (res?.success) {
          setOtpSent(true)
          Alert.alert('OTP sent', res.message || 'We sent a code to your contact.')
          return
        }
        Alert.alert('OTP', res?.message || 'Unable to send OTP.')
        return
      }

      if (!trimmedOtpCode) {
        Alert.alert('OTP', 'Enter the OTP code before verification.')
        return
      }

      const res = await verifyOtp({ identifier, code: trimmedOtpCode })
      if (res?.data?.token) {
        await setToken(res.data.token)
        navigation.replace('Main')
        return
      }

      Alert.alert('OTP', res?.message || 'Unable to verify the code.')
    } catch (error) {
      Alert.alert('OTP', String(error))
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    if (!identifier) {
      Alert.alert('Reset password', 'Enter your email first.')
      return
    }

    const res = await forgotPassword({ email: identifier })
    Alert.alert('Reset password', res?.message || 'Check your inbox for reset instructions.')
  }

  async function handleApiTest() {
    try {
      const response = await fetch(`${API_BASE}/auth/me`)
      Alert.alert('API test', `Reached API.\nStatus: ${response.status}\nURL: ${API_BASE}`)
    } catch (error) {
      Alert.alert('API test failed', `${String(error)}\n\nAPI: ${API_BASE}`)
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.wordmark}>RESPAW</Text>
        <Text style={styles.tagline}>Care for your pet, anytime.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in, create an account, or use OTP to continue.</Text>
        <Pressable onPress={handleApiTest}>
          <Text style={styles.debugLink}>Test API connection</Text>
        </Pressable>
        <Text style={styles.debugText}>{API_BASE}</Text>

        <View style={styles.segmentWrap}>
          {(['login', 'signup', 'otp'] as const).map(item => (
            <Pressable key={item} onPress={() => setMode(item)} style={[styles.segment, mode === item && styles.segmentActive]}>
              <Text style={[styles.segmentText, mode === item && styles.segmentTextActive]}>{item.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>

        {mode === 'signup' ? (
          <View style={styles.form}>
            <Field label="Full name" value={name} onChangeText={setName} placeholder="Aanya Sharma" />
            <Field label="Email" value={email} onChangeText={setEmail} placeholder="aanya@respaw.app" keyboardType="email-address" />
            <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="9876543210" keyboardType="phone-pad" />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Min 8 characters"
              secureTextEntry={!passwordVisible}
              rightAction={passwordVisible ? 'Hide' : 'Show'}
              onRightAction={() => setPasswordVisible(v => !v)}
            />
            <Field label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat password" secureTextEntry={!passwordVisible} />
            <PrimaryButton title={loading ? 'Creating account...' : 'Create account'} onPress={handleSignUp} disabled={!canSignUp} />
            <Pressable onPress={handleForgotPassword}>
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>
          </View>
        ) : mode === 'otp' ? (
          <View style={styles.form}>
            <Field label="Email or phone" value={identifier} onChangeText={value => { setEmail(value); setPhone(value) }} placeholder="aanya@respaw.app" />
            {otpSent ? <Field label="6-digit code" value={otpCode} onChangeText={setOtpCode} placeholder="123456" keyboardType="number-pad" /> : null}
            <PrimaryButton title={loading ? 'Working...' : otpSent ? 'Verify OTP' : 'Send OTP'} onPress={handleOtp} disabled={otpSent ? !canVerifyOtp : !canSendOtp} />
          </View>
        ) : (
          <View style={styles.form}>
            <Field label="Email or phone" value={identifier} onChangeText={value => { setEmail(value); setPhone(value) }} placeholder="aanya@respaw.app" keyboardType="email-address" />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="********"
              secureTextEntry={!passwordVisible}
              rightAction={passwordVisible ? 'Hide' : 'Show'}
              onRightAction={() => setPasswordVisible(v => !v)}
            />
            <PrimaryButton title={loading ? 'Signing in...' : 'Sign in'} onPress={handleSignIn} disabled={!canSignIn} />
            <Pressable onPress={handleForgotPassword}>
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

type FieldProps = {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder: string
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad'
  secureTextEntry?: boolean
  rightAction?: string
  onRightAction?: () => void
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', secureTextEntry, rightAction, onRightAction }: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {rightAction ? <Pressable onPress={onRightAction}><Text style={styles.fieldAction}>{rightAction}</Text></Pressable> : null}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 40 },
  header: {
    paddingVertical: 32,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: 28,
    marginBottom: spacing.lg,
  },
  wordmark: {
    color: '#fff7f1',
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1.2,
    fontFamily: 'serif',
  },
  tagline: { color: '#fff7f1', marginTop: 6, fontSize: 15 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: 6, color: colors.muted, lineHeight: 20 },
  debugLink: { marginTop: 10, color: colors.primary, fontWeight: '700', textAlign: 'center' },
  debugText: { marginTop: 6, color: colors.muted, fontSize: 11, textAlign: 'center' },
  segmentWrap: { flexDirection: 'row', gap: 8, marginTop: spacing.lg, marginBottom: spacing.lg },
  segment: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentText: { color: colors.muted, fontWeight: '700', fontSize: 12, letterSpacing: 0.6 },
  segmentTextActive: { color: '#fff' },
  form: { gap: 14 },
  fieldWrap: { gap: 6 },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { color: colors.text, fontWeight: '700', fontSize: 13 },
  fieldAction: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  input: {
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
  },
  link: { color: colors.primary, fontWeight: '700', textAlign: 'center', marginTop: 4 },
})
