import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, spacing } from '../../theme'
import { getApiBase, setApiBase, clearApiBase, normalizeBaseUrl, DEFAULT_API_BASE, hasOverride } from '../../services/apiConfig'
import { request } from '../../services/client'
import { parseApiError } from '../../utils/apiError'

/**
 * Lets the user point the app at a different backend base URL at runtime —
 * essential on a physical device hitting a local WAMP server whose LAN IP
 * changes, without a rebuild + Metro cache clear.
 */
export default function ServerSettingsScreen() {
  const nav = useNavigation<any>()
  const [value, setValue] = useState(getApiBase())
  const [saved, setSaved] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const preview = normalizeBaseUrl(value)

  async function handleSave() {
    const next = await setApiBase(value)
    setValue(next)
    setSaved(`Saved. The app will now use ${next}`)
    setTestResult(null)
  }

  async function handleReset() {
    const next = await clearApiBase()
    setValue(next)
    setSaved(`Reset to default (${next})`)
    setTestResult(null)
  }

  async function handleTest() {
    // Persist first so request() uses the value being tested.
    await setApiBase(value)
    setTesting(true)
    setTestResult(null)
    try {
      const res = await request('/health')
      setTestResult({ ok: true, msg: res?.message || 'Connected — server reachable.' })
    } catch (e) {
      setTestResult({ ok: false, msg: parseApiError(e) })
    } finally {
      setTesting(false)
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.headerRow}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Server settings</Text>
      </View>

      <Text style={styles.subtitle}>
        Point the app at your backend. Use your computer's LAN IP and port (the phone and
        computer must be on the same Wi-Fi). Example: https://api.respaw.in/api/v1
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Backend base URL</Text>
        <TextInput
          value={value}
          onChangeText={(v) => { setValue(v); setSaved(''); setTestResult(null) }}
          placeholder="https://api.respaw.in/api/v1"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={styles.input}
        />
        <Text style={styles.hint}>Will be used as: {preview}</Text>

        <View style={styles.btnRow}>
          <Pressable style={[styles.btn, styles.btnGhost]} onPress={handleTest} disabled={testing}>
            {testing ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.btnGhostText}>Test connection</Text>}
          </Pressable>
          <Pressable style={[styles.btn, styles.btnPrimary]} onPress={handleSave}>
            <Text style={styles.btnPrimaryText}>Save</Text>
          </Pressable>
        </View>

        {testResult ? (
          <View style={[styles.result, testResult.ok ? styles.resultOk : styles.resultBad]}>
            <Ionicons
              name={testResult.ok ? 'checkmark-circle' : 'alert-circle'}
              size={16}
              color={testResult.ok ? colors.accent : colors.danger}
            />
            <Text style={[styles.resultText, { color: testResult.ok ? colors.accent : colors.danger }]}>{testResult.msg}</Text>
          </View>
        ) : null}

        {saved ? <Text style={styles.savedText}>{saved}</Text> : null}
      </View>

      <View style={styles.metaCard}>
        <Text style={styles.metaLabel}>Default (from build)</Text>
        <Text style={styles.metaValue}>{DEFAULT_API_BASE}</Text>
        <Text style={styles.metaLabel}>Override active</Text>
        <Text style={styles.metaValue}>{hasOverride() ? 'Yes' : 'No'}</Text>
        <Pressable onPress={handleReset} style={styles.resetLink}>
          <Text style={styles.resetLinkText}>Reset to default</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 48 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  backBtn: { padding: 4 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.muted, lineHeight: 20, marginBottom: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  label: { color: colors.text, fontWeight: '700', fontSize: 13, marginBottom: 8 },
  input: { backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 13, color: colors.text },
  hint: { color: colors.muted, fontSize: 12, marginTop: 8 },
  btnRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  btn: { flex: 1, borderRadius: radius.md, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  btnGhost: { borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.primarySoft },
  btnGhostText: { color: colors.primary, fontWeight: '800' },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { color: colors.onPrimary, fontWeight: '800' },
  result: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.md, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1 },
  resultOk: { backgroundColor: colors.mint, borderColor: colors.accent },
  resultBad: { backgroundColor: colors.dangerSoft, borderColor: colors.dangerBorder },
  resultText: { flex: 1, fontSize: 13, lineHeight: 18 },
  savedText: { color: colors.accent, fontWeight: '700', marginTop: spacing.sm, fontSize: 13 },
  metaCard: { backgroundColor: colors.surfaceSoft, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  metaLabel: { color: colors.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '700', marginTop: spacing.sm },
  metaValue: { color: colors.text, marginTop: 2 },
  resetLink: { marginTop: spacing.lg },
  resetLinkText: { color: colors.danger, fontWeight: '700' },
})
