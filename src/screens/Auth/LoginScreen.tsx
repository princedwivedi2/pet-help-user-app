import React, { useMemo, useState } from 'react'
import { View, Text, TextInput, Alert, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import PrimaryButton from '../../components/PrimaryButton'
import { login, register, sendOtp, verifyOtp, forgotPassword, resetPassword } from '../../services'
import { useAuth } from '../../contexts/AuthProvider'
import { useNavigation } from '@react-navigation/native'
import { colors, radius, spacing } from '../../theme'
import { parseApiError } from '../../utils/apiError'

export default function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'signup' | 'otp' | 'reset'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
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

  function validateField(field: string, value: string) {
    let msg = ''
    if (field === 'identifier') {
      if (!value.trim()) msg = 'Enter your email or phone number'
    } else if (field === 'email') {
      if (value.trim() && !/\S+@\S+\.\S+/.test(value.trim())) msg = 'Enter a valid email address'
    } else if (field === 'phone') {
      if (value.trim() && !/^\d{10,}$/.test(value.replace(/\s/g, ''))) msg = 'Enter a valid phone number'
    } else if (field === 'password') {
      if (value.trim().length < 8) msg = 'Password must be at least 8 characters'
    } else if (field === 'confirmPassword') {
      if (value.trim() !== trimmedPassword) msg = 'Passwords do not match'
    }
    setErrors(prev => {
      if (!msg) {
        const next = { ...prev }
        delete next[field]
        return next
      }
      return { ...prev, [field]: msg }
    })
  }

  function validateSignUp(): boolean {
    const errs: Record<string, string> = {}
    if (!trimmedName) errs.name = 'Name is required'
    if (!identifier) errs.identifier = 'Enter your email or phone number'
    if (email.trim() && !/\S+@\S+\.\S+/.test(email.trim())) errs.email = 'Enter a valid email address'
    if (phone.trim() && !/^\d{10,}$/.test(phone.replace(/\s/g, ''))) errs.phone = 'Enter a valid phone number'
    if (trimmedPassword.length < 8) errs.password = 'Password must be at least 8 characters'
    if (trimmedConfirmPassword !== trimmedPassword) errs.confirmPassword = 'Passwords do not match'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateSignIn(): boolean {
    const errs: Record<string, string> = {}
    if (!identifier) errs.identifier = 'Enter your email or phone number'
    if (trimmedPassword.length < 8) errs.password = 'Password must be at least 8 characters'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSignIn() {
    if (!validateSignIn()) return

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
      Alert.alert('Login failed', parseApiError(error))
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp() {
    if (!validateSignUp()) return

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
      Alert.alert('Signup failed', parseApiError(error))
    } finally {
      setLoading(false)
    }
  }

  async function handleOtp() {
    if (!identifier) {
      setErrors({ identifier: 'Enter your email or phone number' })
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
      Alert.alert('OTP', parseApiError(error))
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotPassword() {
    if (!identifier) {
      setErrors({ identifier: 'Enter your email or phone number' })
      return
    }
    setLoading(true)
    try {
      const res = await forgotPassword({ email: identifier })
      Alert.alert(
        'Reset link sent',
        res?.message || 'Check your inbox for the reset link. Copy the token from the link and enter it below.',
        [{ text: 'Enter token', onPress: () => setMode('reset') }],
      )
    } catch (e) {
      Alert.alert('Error', parseApiError(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword() {
    const errs: Record<string, string> = {}
    if (!email.trim()) errs.identifier = 'Enter your email address'
    if (!resetToken.trim()) errs.resetToken = 'Enter the token from the reset email'
    if (trimmedPassword.length < 8) errs.password = 'Password must be at least 8 characters'
    if (trimmedConfirmPassword !== trimmedPassword) errs.confirmPassword = 'Passwords do not match'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      const res = await resetPassword({
        email: email.trim(),
        password: trimmedPassword,
        password_confirmation: trimmedConfirmPassword,
        token: resetToken.trim(),
      })
      if (res?.success) {
        Alert.alert('Password reset', 'Your password has been reset. Sign in with your new password.', [
          { text: 'Sign in', onPress: () => { setMode('login'); setResetToken(''); setPassword(''); setConfirmPassword('') } },
        ])
      } else {
        Alert.alert('Reset failed', res?.message || 'The token may be invalid or expired. Request a new link.')
      }
    } catch (e) {
      Alert.alert('Error', parseApiError(e))
    } finally {
      setLoading(false)
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

        <Pressable onPress={() => navigation.navigate('ServerSettings')} hitSlop={8}>
          <Text style={styles.serverLink}>Server settings</Text>
        </Pressable>

        <View style={styles.segmentWrap}>
          {(['login', 'signup', 'otp'] as const).map(item => (
            <Pressable key={item} onPress={() => { setMode(item); setErrors({}) }} style={[styles.segment, mode === item && styles.segmentActive]}>
              <Text style={[styles.segmentText, mode === item && styles.segmentTextActive]}>{item.toUpperCase()}</Text>
            </Pressable>
          ))}
          {mode === 'reset' && (
            <Pressable style={[styles.segment, styles.segmentActive]} onPress={() => {}}>
              <Text style={[styles.segmentText, styles.segmentTextActive]}>RESET</Text>
            </Pressable>
          )}
        </View>

        {loading && <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.sm }} />}

        {mode === 'signup' ? (
          <View style={styles.form}>
            <Field
              label="Full name"
              value={name}
              onChangeText={v => { setName(v); setErrors(p => { const n = { ...p }; delete n.name; return n }) }}
              onBlur={() => { if (!name.trim()) setErrors(p => ({ ...p, name: 'Name is required' })) }}
              placeholder="Aanya Sharma"
              error={errors.name}
            />
            <Field
              label="Email"
              value={email}
              onChangeText={v => { setEmail(v); setErrors(p => { const n = { ...p }; delete n.email; return n }) }}
              onBlur={() => validateField('email', email)}
              placeholder="aanya@respaw.app"
              keyboardType="email-address"
              error={errors.email}
            />
            <Field
              label="Phone"
              value={phone}
              onChangeText={v => { setPhone(v); setErrors(p => { const n = { ...p }; delete n.phone; return n }) }}
              onBlur={() => validateField('phone', phone)}
              placeholder="9876543210"
              keyboardType="phone-pad"
              error={errors.phone}
            />
            <Field
              label="Password"
              value={password}
              onChangeText={v => { setPassword(v); setErrors(p => { const n = { ...p }; delete n.password; return n }) }}
              onBlur={() => validateField('password', password)}
              placeholder="Min 8 characters"
              secureTextEntry={!passwordVisible}
              rightAction={passwordVisible ? 'Hide' : 'Show'}
              onRightAction={() => setPasswordVisible(v => !v)}
              error={errors.password}
            />
            <Field
              label="Confirm password"
              value={confirmPassword}
              onChangeText={v => { setConfirmPassword(v); setErrors(p => { const n = { ...p }; delete n.confirmPassword; return n }) }}
              onBlur={() => validateField('confirmPassword', confirmPassword)}
              placeholder="Repeat password"
              secureTextEntry={!passwordVisible}
              error={errors.confirmPassword}
            />
            <PrimaryButton title={loading ? 'Creating account...' : 'Create account'} onPress={handleSignUp} disabled={!canSignUp} />
            <Pressable onPress={handleForgotPassword}>
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>
          </View>
        ) : mode === 'otp' ? (
          <View style={styles.form}>
            <Field
              label="Email or phone"
              value={identifier}
              onChangeText={v => { setEmail(v); setPhone(v); setErrors(p => { const n = { ...p }; delete n.identifier; return n }) }}
              onBlur={() => { if (!identifier) setErrors(p => ({ ...p, identifier: 'Enter your email or phone number' })) }}
              placeholder="aanya@respaw.app"
              error={errors.identifier}
            />
            {otpSent ? <Field label="6-digit code" value={otpCode} onChangeText={setOtpCode} placeholder="123456" keyboardType="number-pad" /> : null}
            <PrimaryButton title={loading ? 'Working...' : otpSent ? 'Verify OTP' : 'Send OTP'} onPress={handleOtp} disabled={otpSent ? !canVerifyOtp : !canSendOtp} />
          </View>
        ) : mode === 'reset' ? (
          <View style={styles.form}>
            <Field
              label="Email"
              value={email}
              onChangeText={v => { setEmail(v); setErrors(p => { const n = { ...p }; delete n.identifier; return n }) }}
              placeholder="aanya@respaw.app"
              keyboardType="email-address"
              error={errors.identifier}
            />
            <Field
              label="Reset token (from email)"
              value={resetToken}
              onChangeText={v => { setResetToken(v); setErrors(p => { const n = { ...p }; delete n.resetToken; return n }) }}
              placeholder="Paste token from reset email"
              error={errors.resetToken}
            />
            <Field
              label="New password"
              value={password}
              onChangeText={v => { setPassword(v); setErrors(p => { const n = { ...p }; delete n.password; return n }) }}
              onBlur={() => validateField('password', password)}
              placeholder="Min 8 characters"
              secureTextEntry={!passwordVisible}
              rightAction={passwordVisible ? 'Hide' : 'Show'}
              onRightAction={() => setPasswordVisible(v => !v)}
              error={errors.password}
            />
            <Field
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={v => { setConfirmPassword(v); setErrors(p => { const n = { ...p }; delete n.confirmPassword; return n }) }}
              onBlur={() => validateField('confirmPassword', confirmPassword)}
              placeholder="Repeat new password"
              secureTextEntry={!passwordVisible}
              error={errors.confirmPassword}
            />
            <PrimaryButton title={loading ? 'Resetting…' : 'Reset password'} onPress={handleResetPassword} disabled={loading} />
            <Pressable onPress={() => { setMode('login'); setErrors({}) }}>
              <Text style={styles.link}>Back to sign in</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <Field
              label="Email or phone"
              value={identifier}
              onChangeText={v => { setEmail(v); setPhone(v); setErrors(p => { const n = { ...p }; delete n.identifier; return n }) }}
              onBlur={() => { if (!identifier) setErrors(p => ({ ...p, identifier: 'Enter your email or phone number' })) }}
              placeholder="aanya@respaw.app"
              keyboardType="email-address"
              error={errors.identifier}
            />
            <Field
              label="Password"
              value={password}
              onChangeText={v => { setPassword(v); setErrors(p => { const n = { ...p }; delete n.password; return n }) }}
              onBlur={() => validateField('password', password)}
              placeholder="********"
              secureTextEntry={!passwordVisible}
              rightAction={passwordVisible ? 'Hide' : 'Show'}
              onRightAction={() => setPasswordVisible(v => !v)}
              error={errors.password}
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
  onBlur?: () => void
  placeholder: string
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'number-pad'
  secureTextEntry?: boolean
  rightAction?: string
  onRightAction?: () => void
  error?: string
}

function Field({ label, value, onChangeText, onBlur, placeholder, keyboardType = 'default', secureTextEntry, rightAction, onRightAction, error }: FieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {rightAction ? <Pressable onPress={onRightAction}><Text style={styles.fieldAction}>{rightAction}</Text></Pressable> : null}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 48 },
  header: {
    paddingVertical: 32,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: 28,
    marginBottom: spacing.lg,
  },
  wordmark: {
    color: colors.onPrimary,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1.2,
    fontFamily: 'serif',
  },
  tagline: { color: colors.onPrimary, marginTop: 6, fontSize: 15 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: 6, color: colors.muted, lineHeight: 20 },
  serverLink: { marginTop: 10, color: colors.primary, fontWeight: '700', fontSize: 13 },
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
  segmentTextActive: { color: colors.surface },
  form: { gap: 14 },
  fieldWrap: { gap: 6 },
  fieldHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { color: colors.text, fontWeight: '700', fontSize: 13 },
  fieldAction: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  fieldError: { color: colors.danger, fontSize: 12, marginTop: 4 },
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
