import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { colors, radius, spacing } from '../theme'

type Props = { children: React.ReactNode }
type State = { hasError: boolean; message: string }

/**
 * Root error boundary. Any JS error thrown during render or in a lifecycle
 * shows a visible recovery screen instead of a silent white-screen crash.
 * (Native fatal exceptions can't be caught here — those are handled by keeping
 * native SDK init lazy/guarded elsewhere.)
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) }
  }

  componentDidCatch(error: unknown) {
    // Surface to the JS console / dev tools; non-fatal for the user.
    console.error('[ErrorBoundary]', error)
  }

  handleReset = () => this.setState({ hasError: false, message: '' })

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <View style={styles.wrap}>
        <Text style={styles.emoji}>🐾</Text>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>
          The app hit an unexpected error. You can try again — if it keeps
          happening, please restart the app.
        </Text>
        {__DEV__ && this.state.message ? (
          <Text style={styles.detail} numberOfLines={4}>{this.state.message}</Text>
        ) : null}
        <Pressable style={styles.btn} onPress={this.handleReset}>
          <Text style={styles.btnText}>Try again</Text>
        </Pressable>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emoji: { fontSize: 48, marginBottom: spacing.md },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  body: { color: colors.muted, textAlign: 'center', lineHeight: 20, marginBottom: spacing.lg },
  detail: { color: colors.danger, fontSize: 12, textAlign: 'center', marginBottom: spacing.lg },
  btn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 32 },
  btnText: { color: colors.onPrimary, fontWeight: '800' },
})
