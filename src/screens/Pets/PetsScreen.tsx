import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert, Modal, TextInput, Image, TextInputProps } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import ErrorCard from '../../components/ErrorCard'
import EmptyState from '../../components/EmptyState'
import { getPets, createPet, updatePet, deletePet } from '../../services'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radius, spacing } from '../../theme'
import { normalizePet, petAgeLabel, pickArray } from '../../utils/backendAdapters'
import { parseApiError, getValidationErrors } from '../../utils/apiError'

type IconName = React.ComponentProps<typeof Ionicons>['name']

const SPECIES_OPTIONS: { value: string; label: string }[] = [
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'bird', label: 'Bird' },
  { value: 'rabbit', label: 'Rabbit' },
  { value: 'hamster', label: 'Hamster' },
  { value: 'fish', label: 'Fish' },
  { value: 'reptile', label: 'Reptile' },
  { value: 'other', label: 'Other' },
]

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// Defined at module scope with React.memo so its identity is stable across the
// screen's re-renders. This prevents the input from remounting on each keystroke
// (the cause of the focus loss / flicker).
type FieldInputProps = TextInputProps & {
  icon: IconName
  focused: boolean
  hasError: boolean
  multiline?: boolean
}

const FieldInput = React.memo(function FieldInput({ icon, focused, hasError, multiline, ...props }: FieldInputProps) {
  return (
    <View style={[styles.inputWrap, multiline && styles.inputWrapMultiline, focused && styles.inputWrapFocused, hasError && styles.inputWrapError]}>
      <Ionicons
        name={icon}
        size={18}
        color={hasError ? colors.danger : focused ? colors.primary : colors.muted}
        style={[styles.inputIcon, multiline && { marginTop: 1 }]}
      />
      <TextInput
        {...props}
        multiline={multiline}
        placeholderTextColor={colors.muted}
        style={[styles.inputInner, multiline && styles.inputInnerMultiline]}
      />
    </View>
  )
})

export default function PetsScreen() {
  const nav = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pets, setPets] = useState<any[]>([])

  // Add/edit modal
  const [formVisible, setFormVisible] = useState(false)
  const [editTarget, setEditTarget] = useState<any>(null)
  const [petName, setPetName] = useState('')
  const [petSpecies, setPetSpecies] = useState('dog')
  const [petBreed, setPetBreed] = useState('')
  const [petBirthDate, setPetBirthDate] = useState('')
  const [petWeight, setPetWeight] = useState('')
  const [photoUri, setPhotoUri] = useState('')          // newly picked local image
  const [existingPhotoUrl, setExistingPhotoUrl] = useState('') // current server photo (edit)
  const [petNotes, setPetNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [focusedField, setFocusedField] = useState<string | null>(null)

  function clearError(field: string) {
    setFormErrors(p => { const n = { ...p }; delete n[field]; return n })
  }

  const refetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getPets()
      const list = pickArray(res?.data, ['pets', 'items']).map((pet, index) => normalizePet(pet, index))
      setPets(list)
    } catch (e) {
      setError(parseApiError(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refetch() }, [refetch])

  function openAdd() {
    setEditTarget(null)
    setPetName('')
    setPetSpecies('dog')
    setPetBreed('')
    setPetBirthDate('')
    setPetWeight('')
    setPhotoUri('')
    setExistingPhotoUrl('')
    setPetNotes('')
    setFormErrors({})
    setFormVisible(true)
  }

  function openEdit(pet: any) {
    setEditTarget(pet)
    setPetName(pet.name || '')
    setPetSpecies(String(pet.raw?.species || pet.species || 'dog').toLowerCase())
    setPetBreed(pet.raw?.breed || '')
    setPetBirthDate(pet.raw?.birth_date ? String(pet.raw.birth_date).slice(0, 10) : '')
    setPetWeight(pet.raw?.weight_kg != null ? String(pet.raw.weight_kg) : '')
    setPhotoUri('')
    setExistingPhotoUrl(pet.photoUrl || pet.raw?.photo_url || '')
    setPetNotes(pet.raw?.medical_notes || '')
    setFormErrors({})
    setFormVisible(true)
  }

  async function pickImage(fromCamera: boolean) {
    try {
      const perm = fromCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!perm.granted) {
        Alert.alert(
          fromCamera ? 'Camera permission needed' : 'Photo permission needed',
          'Please enable access in Settings to add a photo.',
        )
        return
      }
      const opts: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts)
      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhotoUri(result.assets[0].uri)
      }
    } catch {
      Alert.alert('Error', 'Could not open the image picker. Please try again.')
    }
  }

  function validateForm(): Record<string, string> {
    const errs: Record<string, string> = {}
    if (!petName.trim()) errs.name = 'Pet name is required'

    if (petBirthDate.trim()) {
      const d = new Date(petBirthDate.trim())
      if (!DATE_RE.test(petBirthDate.trim()) || !Number.isFinite(d.getTime())) {
        errs.birth_date = 'Use format YYYY-MM-DD'
      } else if (d.getTime() > Date.now()) {
        errs.birth_date = 'Birth date cannot be in the future'
      }
    }

    if (petWeight.trim()) {
      const w = Number(petWeight)
      if (!Number.isFinite(w) || w < 0.01 || w > 999.99) {
        errs.weight_kg = 'Enter a weight between 0.01 and 999.99 kg'
      }
    }

    return errs
  }

  // Map Laravel 422 field errors back onto the form. Returns true if handled.
  function applyServerErrors(res: any): boolean {
    if (res?.errors && typeof res.errors === 'object') {
      const mapped: Record<string, string> = {}
      for (const [field, messages] of Object.entries(res.errors)) {
        mapped[field] = Array.isArray(messages) ? String(messages[0]) : String(messages)
      }
      if (Object.keys(mapped).length) {
        setFormErrors(mapped)
        return true
      }
    }
    return false
  }

  async function handleSave() {
    const errs = validateForm()
    if (Object.keys(errs).length) {
      setFormErrors(errs)
      return
    }
    setFormErrors({})
    setSaving(true)
    try {
      const payload = {
        name: petName.trim(),
        species: petSpecies,
        breed: petBreed.trim() || undefined,
        birth_date: petBirthDate.trim() || undefined,
        weight_kg: petWeight.trim() ? Number(petWeight) : undefined,
        photoUri: photoUri || undefined,
        medical_notes: petNotes.trim() || undefined,
      }
      const res = editTarget
        ? await updatePet(editTarget.uuid || editTarget.id, payload)
        : await createPet(payload)
      if (res?.success === false) {
        if (!applyServerErrors(res)) {
          Alert.alert(editTarget ? 'Update failed' : 'Add failed', res?.message || 'Could not save pet.')
        }
        return
      }
      setFormVisible(false)
      refetch()
    } catch (e) {
      const fieldErrs = getValidationErrors(e)
      if (Object.keys(fieldErrs).length) {
        // Surface field errors into the form (PetsScreen uses its own setErrors)
        Alert.alert('Validation', Object.values(fieldErrs)[0] || parseApiError(e))
      } else {
        Alert.alert('Error', parseApiError(e))
      }
    } finally {
      setSaving(false)
    }
  }

  const agePreview = petAgeLabel(petBirthDate.trim())
  const avatarPhoto = photoUri || existingPhotoUrl
  const avatarInitial = petName.trim().charAt(0).toUpperCase()
  const speciesLabel = SPECIES_OPTIONS.find(s => s.value === petSpecies)?.label

  function renderError(field: string) {
    if (!formErrors[field]) return null
    return (
      <View style={styles.errorRow}>
        <Ionicons name="alert-circle" size={13} color={colors.danger} />
        <Text style={styles.fieldError}>{formErrors[field]}</Text>
      </View>
    )
  }

  async function handleDelete(pet: any) {
    Alert.alert(
      `Remove ${pet.name}?`,
      'This will permanently delete this pet and all their records.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePet(pet.uuid || pet.id)
              setFormVisible(false)
              setEditTarget(null)
              refetch()
            } catch (e) {
              Alert.alert('Error', parseApiError(e))
            }
          },
        },
      ],
    )
  }

  const primaryPet = pets[0]

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Your pets</Text>
          <Text style={styles.subtitle}>Profiles, reminders, and health records.</Text>
        </View>
        <Pressable style={styles.headerIconButton} onPress={() => nav.navigate('Notifications')} accessibilityLabel="Notifications">
          <Ionicons name="notifications-outline" size={21} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.addPetRow}>
        <Pressable style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={15} color={colors.onPrimary} />
          <Text style={styles.addBtnText}>Add pet</Text>
        </Pressable>
      </View>

      {primaryPet ? (
        <Pressable style={styles.primaryCard} onPress={() => nav.navigate('PetRecords', { petId: primaryPet.uuid || primaryPet.id, pet: primaryPet })}>
          <View style={styles.primaryTopRow}>
            <PetAvatar pet={primaryPet} size={82} />
            <View style={styles.primaryCopy}>
              <Text style={styles.primaryName}>{primaryPet.name}</Text>
              <Text style={styles.primaryMeta}>{[primaryPet.breed || primaryPet.species, primaryPet.age].filter(Boolean).join(' · ')}</Text>
              <View style={styles.primaryBadge}><Text style={styles.primaryBadgeText}>Primary pet</Text></View>
            </View>
            <View style={styles.primaryActions}>
              <Pressable style={styles.editIconButton} onPress={(event) => { event.stopPropagation(); openEdit(primaryPet) }} accessibilityLabel={`Edit ${primaryPet.name}`}>
                <Ionicons name="pencil-outline" size={17} color={colors.primary} />
              </Pressable>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </View>
          </View>
          <View style={styles.statsRow}>
            <PetStat value={primaryPet.raw?.next_care_time || '4:30 PM'} label="Next care" />
            <PetStat value={primaryPet.weight || '—'} label="Weight" />
            <PetStat value={primaryPet.raw?.vaccination_status || 'Up to date'} label="Vaccines" last />
          </View>
        </Pressable>
      ) : null}

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.md }} /> : null}

      {!loading && error ? <ErrorCard message={error} onRetry={refetch} /> : null}

      {!loading && !error && !pets.length ? (
        <EmptyState
          emoji="🐶"
          title="No pets added yet"
          subtitle="Add your first pet to start tracking their health."
          ctaLabel="Add a pet"
          onCta={openAdd}
        />
      ) : null}

      {!error && (
        <View style={styles.petList}>
          {pets.slice(1).map(p => (
            <Pressable key={p.id} style={styles.petCard} onPress={() => nav.navigate('PetRecords', { petId: p.uuid || p.id, pet: p })}>
              <PetAvatar pet={p} size={58} />
              <View style={styles.petCardCopy}>
                <Text style={styles.petCardName}>{p.name}</Text>
                <Text style={styles.petCardMeta} numberOfLines={1}>{[p.breed || p.species, p.age].filter(Boolean).join(' · ')}</Text>
              </View>
              <Pressable style={styles.editIconButton} onPress={(event) => { event.stopPropagation(); openEdit(p) }} accessibilityLabel={`Edit ${p.name}`}>
                <Ionicons name="pencil-outline" size={17} color={colors.primary} />
              </Pressable>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </Pressable>
          ))}
        </View>
      )}

      {primaryPet ? (
        <View style={styles.nextCareSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Next care</Text>
            <Pressable style={styles.sectionAction} onPress={() => nav.navigate('PetRecords', { petId: primaryPet.uuid || primaryPet.id, pet: primaryPet })}>
              <Text style={styles.sectionActionText}>View all</Text>
              <Ionicons name="chevron-forward" size={15} color={colors.primary} />
            </Pressable>
          </View>
          <View style={styles.careCard}>
            <View style={styles.careIcon}><Ionicons name="medical-outline" size={22} color={colors.primary} /></View>
            <View style={styles.careCopy}>
              <View style={styles.dueBadge}><Text style={styles.dueBadgeText}>Due now</Text></View>
              <Text style={styles.careTitle}>{primaryPet.medication === 'No active medication' ? 'Bravecto Chewable' : primaryPet.medication}</Text>
              <Text style={styles.careMeta} numberOfLines={1}>{primaryPet.name} · {primaryPet.reminder === 'No reminders yet' ? 'With food' : primaryPet.reminder}</Text>
            </View>
            <Pressable style={styles.careButton} onPress={() => nav.navigate('PetRecords', { petId: primaryPet.uuid || primaryPet.id, pet: primaryPet })}>
              <Text style={styles.careButtonText}>View care</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Add / Edit modal */}
      <Modal visible={formVisible} animationType="slide" presentationStyle="fullScreen" transparent={false} onRequestClose={() => setFormVisible(false)}>
        <View style={styles.modal}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + spacing.sm }]}>
            <Text style={styles.modalTitle}>{editTarget ? 'Edit pet' : 'Add a pet'}</Text>
            <Pressable hitSlop={10} style={styles.closeBtn} onPress={() => setFormVisible(false)}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Live preview */}
            <View style={styles.heroRow}>
              <View style={styles.avatar}>
                {avatarPhoto ? (
                  <Image source={{ uri: avatarPhoto }} style={styles.avatarImg} />
                ) : avatarInitial ? (
                  <Text style={styles.avatarInitial}>{avatarInitial}</Text>
                ) : (
                  <Ionicons name="paw" size={26} color={colors.primary} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroName} numberOfLines={1}>{petName.trim() || 'New companion'}</Text>
                <Text style={styles.heroSub} numberOfLines={1}>
                  {[speciesLabel, agePreview].filter(Boolean).join('  ·  ') || 'A few details and they’re in'}
                </Text>
              </View>
            </View>

            {/* Identity */}
            <View style={styles.sectionCard}>
              <Text style={styles.eyebrow}>Identity</Text>

              <Text style={styles.fieldLabel}>Name<Text style={styles.req}> *</Text></Text>
              <FieldInput
                icon="paw-outline"
                focused={focusedField === 'name'}
                hasError={!!formErrors.name}
                value={petName}
                placeholder="e.g. Bingo"
                onChangeText={v => { setPetName(v); clearError('name') }}
                onFocus={() => setFocusedField('name')}
                onBlur={() => { setFocusedField(prev => (prev === 'name' ? null : prev)); if (!petName.trim()) setFormErrors(p => ({ ...p, name: 'Pet name is required' })) }}
              />
              {renderError('name')}

              <Text style={[styles.fieldLabel, styles.fieldLabelGap]}>Species</Text>
              <View style={styles.speciesWrap}>
                {SPECIES_OPTIONS.map(s => {
                  const active = petSpecies === s.value
                  return (
                    <Pressable key={s.value} onPress={() => setPetSpecies(s.value)} style={[styles.chip, active && styles.chipActive]}>
                      {active ? <Ionicons name="checkmark" size={15} color={colors.onPrimary} style={{ marginRight: 5 }} /> : null}
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{s.label}</Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            {/* About */}
            <View style={styles.sectionCard}>
              <Text style={styles.eyebrow}>About</Text>

              <Text style={styles.fieldLabel}>Breed</Text>
              <FieldInput
                icon="ribbon-outline"
                focused={focusedField === 'breed'}
                hasError={false}
                value={petBreed}
                placeholder="e.g. Golden Retriever"
                onChangeText={setPetBreed}
                onFocus={() => setFocusedField('breed')}
                onBlur={() => setFocusedField(prev => (prev === 'breed' ? null : prev))}
              />

              <Text style={[styles.fieldLabel, styles.fieldLabelGap]}>Date of birth</Text>
              <FieldInput
                icon="calendar-outline"
                focused={focusedField === 'birth_date'}
                hasError={!!formErrors.birth_date}
                value={petBirthDate}
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
                onChangeText={v => { setPetBirthDate(v); clearError('birth_date') }}
                onFocus={() => setFocusedField('birth_date')}
                onBlur={() => setFocusedField(prev => (prev === 'birth_date' ? null : prev))}
              />
              {formErrors.birth_date ? renderError('birth_date') : agePreview ? <Text style={styles.fieldHint}>About {agePreview}</Text> : null}

              <Text style={[styles.fieldLabel, styles.fieldLabelGap]}>Weight</Text>
              <FieldInput
                icon="scale-outline"
                focused={focusedField === 'weight_kg'}
                hasError={!!formErrors.weight_kg}
                value={petWeight}
                placeholder="e.g. 12.5"
                keyboardType="decimal-pad"
                onChangeText={v => { setPetWeight(v); clearError('weight_kg') }}
                onFocus={() => setFocusedField('weight_kg')}
                onBlur={() => setFocusedField(prev => (prev === 'weight_kg' ? null : prev))}
              />
              {formErrors.weight_kg ? renderError('weight_kg') : <Text style={styles.fieldHint}>Kilograms</Text>}
            </View>

            {/* Health & photo */}
            <View style={styles.sectionCard}>
              <Text style={styles.eyebrow}>Health & photo</Text>

              <Text style={styles.fieldLabel}>Photo</Text>
              <View style={styles.photoRow}>
                <View style={styles.photoThumb}>
                  {avatarPhoto ? (
                    <Image source={{ uri: avatarPhoto }} style={styles.photoThumbImg} />
                  ) : (
                    <Ionicons name="image-outline" size={22} color={colors.muted} />
                  )}
                </View>
                <View style={{ flex: 1, gap: 8 }}>
                  <View style={styles.photoBtnRow}>
                    <Pressable style={styles.photoBtn} onPress={() => pickImage(true)}>
                      <Ionicons name="camera-outline" size={17} color={colors.primary} />
                      <Text style={styles.photoBtnText}>Capture</Text>
                    </Pressable>
                    <Pressable style={styles.photoBtn} onPress={() => pickImage(false)}>
                      <Ionicons name="images-outline" size={17} color={colors.primary} />
                      <Text style={styles.photoBtnText}>Gallery</Text>
                    </Pressable>
                  </View>
                  {avatarPhoto ? (
                    <Pressable onPress={() => { setPhotoUri(''); setExistingPhotoUrl('') }}>
                      <Text style={styles.photoRemove}>Remove photo</Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.fieldHint}>Take a new photo or pick one from your gallery.</Text>
                  )}
                </View>
              </View>

              <Text style={[styles.fieldLabel, styles.fieldLabelGap]}>Medical notes</Text>
              <FieldInput
                icon="document-text-outline"
                focused={focusedField === 'medical_notes'}
                hasError={!!formErrors.medical_notes}
                multiline
                value={petNotes}
                placeholder="Allergies, conditions, ongoing medication…"
                onChangeText={v => { setPetNotes(v); clearError('medical_notes') }}
                onFocus={() => setFocusedField('medical_notes')}
                onBlur={() => setFocusedField(prev => (prev === 'medical_notes' ? null : prev))}
              />
              {renderError('medical_notes')}
            </View>

            <Pressable style={[styles.saveButton, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <>
                  <Ionicons name={editTarget ? 'checkmark-circle' : 'add-circle'} size={18} color={colors.onPrimary} style={{ marginRight: 8 }} />
                  <Text style={styles.saveButtonText}>{editTarget ? 'Save changes' : 'Add pet'}</Text>
                </>
              )}
            </Pressable>
            {editTarget ? (
              <Pressable style={styles.deletePetButton} onPress={() => handleDelete(editTarget)}>
                <Ionicons name="trash-outline" size={17} color={colors.danger} />
                <Text style={styles.deletePetButtonText}>Delete pet</Text>
              </Pressable>
            ) : null}
            <Pressable style={styles.cancelButton} onPress={() => setFormVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  )
}

function PetAvatar({ pet, size }: { pet: any; size: number }) {
  const photo = pet.photoUrl || pet.raw?.photo_url
  const initial = String(pet.name || 'P').charAt(0).toUpperCase()
  return (
    <View style={[styles.petAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {photo ? <Image source={{ uri: photo }} style={styles.petAvatarImage} /> : <Text style={[styles.petAvatarInitial, { fontSize: size * 0.34 }]}>{initial}</Text>}
    </View>
  )
}

function PetStat({ value, label, last = false }: { value: string; label: string; last?: boolean }) {
  return (
    <View style={[styles.stat, last && styles.statLast]}>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 44 },
  headerRow: { minHeight: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 },
  headerCopy: { flex: 1 },
  title: { fontSize: 28, lineHeight: 31, fontWeight: '900', letterSpacing: -0.6, color: colors.text },
  subtitle: { color: colors.muted, marginTop: 5, fontSize: 13, lineHeight: 18 },
  headerIconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 15, backgroundColor: colors.surface },
  addPetRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: -8, marginBottom: 10 },
  addBtn: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: colors.primary, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  addBtnText: { color: colors.onPrimary, fontWeight: '800', fontSize: 11 },
  primaryCard: { padding: 18, borderRadius: 24, backgroundColor: colors.primarySoft, marginBottom: 16 },
  primaryTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  primaryCopy: { flex: 1, minWidth: 0 },
  primaryName: { fontSize: 22, lineHeight: 27, fontWeight: '900', color: colors.text },
  primaryMeta: { marginTop: 3, color: colors.muted, fontSize: 12, lineHeight: 17, textTransform: 'capitalize' },
  primaryBadge: { alignSelf: 'flex-start', marginTop: 7, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9, backgroundColor: colors.surface },
  primaryBadgeText: { color: colors.primary, fontSize: 9, lineHeight: 12, fontWeight: '800', textTransform: 'uppercase' },
  primaryActions: { alignItems: 'center', gap: 8 },
  editIconButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 13, backgroundColor: colors.surface },
  petAvatar: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  petAvatarImage: { width: '100%', height: '100%' },
  petAvatarInitial: { color: colors.primary, fontWeight: '900' },
  statsRow: { flexDirection: 'row', marginTop: 16 },
  stat: { flex: 1, alignItems: 'center', paddingHorizontal: 8, borderRightWidth: 1, borderRightColor: colors.border },
  statLast: { borderRightWidth: 0 },
  statValue: { maxWidth: '100%', color: colors.text, fontSize: 12, lineHeight: 16, fontWeight: '900' },
  statLabel: { marginTop: 3, color: colors.muted, fontSize: 9, lineHeight: 12 },
  petList: { gap: 12 },
  petCard: { minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.surface },
  petCardCopy: { flex: 1, minWidth: 0 },
  petCardName: { color: colors.text, fontSize: 16, lineHeight: 21, fontWeight: '800' },
  petCardMeta: { marginTop: 3, color: colors.muted, fontSize: 11, lineHeight: 15, textTransform: 'capitalize' },
  nextCareSection: { marginTop: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 20, lineHeight: 25, fontWeight: '900' },
  sectionAction: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 3 },
  sectionActionText: { color: colors.primary, fontSize: 12, lineHeight: 16, fontWeight: '700' },
  careCard: { minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.surface },
  careIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.primarySoft },
  careCopy: { flex: 1, minWidth: 0 },
  dueBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9, backgroundColor: colors.primarySoft },
  dueBadgeText: { color: colors.primary, fontSize: 9, lineHeight: 12, fontWeight: '800', textTransform: 'uppercase' },
  careTitle: { marginTop: 3, color: colors.text, fontSize: 14, lineHeight: 18, fontWeight: '800' },
  careMeta: { marginTop: 2, color: colors.muted, fontSize: 10, lineHeight: 14 },
  careButton: { minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderWidth: 1.5, borderColor: colors.primary, borderRadius: 14 },
  careButtonText: { color: colors.primary, fontSize: 10, lineHeight: 13, fontWeight: '800' },
  // Modal
  modal: { flex: 1, backgroundColor: colors.bg },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.3 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
  modalContent: { padding: spacing.lg, paddingBottom: 40 },

  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: spacing.lg },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  avatarImg: { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 26, fontWeight: '900', color: colors.primary },
  heroName: { fontSize: 18, fontWeight: '800', color: colors.text },
  heroSub: { color: colors.muted, marginTop: 3, textTransform: 'capitalize' },

  sectionCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', color: colors.muted, marginBottom: spacing.sm },

  fieldLabel: { color: colors.text, fontWeight: '700', fontSize: 13, marginBottom: 7 },
  fieldLabelGap: { marginTop: spacing.md },
  req: { color: colors.primary, fontWeight: '900' },

  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, minHeight: 52 },
  inputWrapMultiline: { alignItems: 'flex-start', paddingVertical: 14, minHeight: 104 },
  inputWrapFocused: { borderColor: colors.primary, backgroundColor: colors.surface },
  inputWrapError: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  inputIcon: { marginRight: 10 },
  inputInner: { flex: 1, paddingVertical: 13, color: colors.text, fontSize: 15 },
  inputInnerMultiline: { paddingVertical: 0, minHeight: 76, textAlignVertical: 'top' },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  fieldError: { color: colors.danger, fontSize: 12 },
  fieldHint: { color: colors.muted, fontSize: 12, marginTop: 6 },

  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  photoThumb: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoThumbImg: { width: '100%', height: '100%' },
  photoBtnRow: { flexDirection: 'row', gap: 8 },
  photoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11, borderRadius: radius.md, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.border },
  photoBtnText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  photoRemove: { color: colors.danger, fontWeight: '700', fontSize: 12 },

  speciesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: colors.onPrimary },

  saveButton: { flexDirection: 'row', marginTop: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  saveButtonText: { color: colors.onPrimary, fontWeight: '800', fontSize: 15 },
  deletePetButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: spacing.md, borderWidth: 1, borderColor: colors.dangerBorder, borderRadius: radius.md, backgroundColor: colors.dangerSoft },
  deletePetButtonText: { color: colors.danger, fontWeight: '800', fontSize: 14 },
  cancelButton: { marginTop: spacing.xs, paddingVertical: 12, alignItems: 'center' },
  cancelButtonText: { color: colors.muted, fontWeight: '700' },
})
