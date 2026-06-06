import React from 'react'
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { colors, radius, spacing } from '../../theme'

export default function ConsultationRoomScreen() {
  const nav = useNavigation<any>()
  const route = useRoute()
  const { consultationId, modality, vetName } = (route.params || {}) as {
    consultationId?: string
    modality?: string
    vetName?: string
  }

  const modalityLabel =
    modality === 'video' ? 'Video Call' : modality === 'audio' ? 'Audio Call' : 'Chat'

  function handleEndSession() {
    Alert.alert('End session', 'Are you sure you want to end this consultation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End', style: 'destructive', onPress: () => nav.navigate('Main') },
    ])
  }

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.dot} />
        <Text style={{ fontWeight: '800', color: colors.text }}>Connected</Text>
      </View>
      <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 18 }}>{modalityLabel}</Text>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>
        {vetName || 'Your veterinarian'}
      </Text>
      <Text style={{ color: colors.muted, fontSize: 12 }}>
        Session {(consultationId || '').slice(0, 8)}
      </Text>
      <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', marginTop: spacing.sm }}>
        Real-time messaging and calls arrive in Phase 21.
      </Text>
      <Pressable style={styles.endBtn} onPress={handleEndSession}>
        <Text style={{ color: '#fff', fontWeight: '800' }}>End Session</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  endBtn: {
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 24,
    marginTop: spacing.md,
  },
})
