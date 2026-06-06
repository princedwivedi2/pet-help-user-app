import React from 'react'
import { View, Text } from 'react-native'
import { colors, radius } from '../theme'

export default function AppointmentCard({ appt }: { appt: any }) {
  return (
    <View style={{ backgroundColor: colors.surface, padding: 12, borderRadius: radius.lg, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ fontWeight: '800', color: colors.text }}>{appt.title}</Text>
      <Text style={{ color: colors.muted }}>{appt.vet} • {appt.pet}</Text>
      <Text style={{ marginTop: 8, color: colors.text, fontWeight: '700' }}>{appt.when}</Text>
      <Text style={{ marginTop: 8, color: appt.status === 'confirmed' ? colors.accent : colors.warning, fontWeight: '700', textTransform: 'capitalize' }}>{appt.status}</Text>
    </View>
  )
}
