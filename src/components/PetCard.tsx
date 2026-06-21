import React from 'react'
import { View, Text, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius } from '../theme'

export default function PetCard({ pet, fullWidth }: { pet: any; fullWidth?: boolean }) {
  const photo = pet.photoUrl || pet.raw?.photo_url
  const initial = String(pet.name || '').trim().charAt(0).toUpperCase()
  const metaParts = [pet.species, pet.breed, pet.age, pet.weight].filter(Boolean)
  const size = fullWidth ? 52 : 44

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        padding: 14,
        borderRadius: radius.lg,
        marginRight: fullWidth ? 0 : 12,
        width: fullWidth ? '100%' : 170,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: fullWidth ? 'row' : 'column',
        alignItems: fullWidth ? 'center' : 'flex-start',
        gap: fullWidth ? 14 : 0,
      }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primarySoft,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          marginBottom: fullWidth ? 0 : 10,
        }}
      >
        {photo ? (
          <Image source={{ uri: photo }} style={{ width: '100%', height: '100%' }} />
        ) : initial ? (
          <Text style={{ fontSize: size * 0.4, fontWeight: '900', color: colors.primary }}>{initial}</Text>
        ) : (
          <Ionicons name="paw" size={size * 0.45} color={colors.primary} />
        )}
      </View>
      <View style={{ flex: fullWidth ? 1 : undefined }}>
        <Text style={{ fontWeight: '800', color: colors.text, fontSize: 16 }} numberOfLines={1}>{pet.name}</Text>
        <Text style={{ color: colors.muted, marginTop: 2, textTransform: 'capitalize' }} numberOfLines={1}>
          {metaParts.join(' · ')}
        </Text>
        {!fullWidth ? (
          <Text style={{ marginTop: 8, color: colors.warning, fontWeight: '700' }} numberOfLines={1}>
            {pet.reminder}
          </Text>
        ) : null}
      </View>
    </View>
  )
}
