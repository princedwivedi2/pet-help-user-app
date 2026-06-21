import React from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '../theme'

/**
 * HOC that pads a screen by the top safe-area inset.
 *
 * The app runs Android edge-to-edge (content draws under the status bar), so
 * screens that render their own content from y=0 would otherwise have their
 * titles/headers clipped behind the status bar. Wrapping at the navigator level
 * keeps every screen consistent without editing each one's styles.
 *
 * Full-bleed screens (Splash, the video call room) opt out and manage their own
 * insets, and screens that already add large manual top padding (Payment) are
 * not wrapped to avoid double spacing.
 */
export function withSafeTop<P extends object>(Component: React.ComponentType<P>) {
  return function SafeTopScreen(props: P) {
    const insets = useSafeAreaInsets()
    return (
      <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: colors.bg }}>
        <Component {...props} />
      </View>
    )
  }
}
