import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert, Modal, TextInput } from 'react-native'
import PetCard from '../../components/PetCard'
import ErrorCard from '../../components/ErrorCard'
import EmptyState from '../../components/EmptyState'
import { getPets, createPet, updatePet, deletePet } from '../../services'
import { useNavigation } from '@react-navigation/native'
import { colors, radius, spacing } from '../../theme'
import { normalizePet, pickArray } from '../../utils/backendAdapters'

const SPECIES = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Other']

export default function PetsScreen() {
  const nav = useNavigation<any>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pets, setPets] = useState<any[]>([])

  // Add/edit modal
  const [formVisible, setFormVisible] = useState(false)
  const [editTarget, setEditTarget] = useState<any>(null)
  const [petName, setPetName] = useState('')
  const [petSpecies, setPetSpecies] = useState('Dog')
  const [petBreed, setPetBreed] = useState('')
  const [petBirthDate, setPetBirthDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const refetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getPets()
      const list = pickArray(res?.data, ['pets', 'items']).map((pet, index) => normalizePet(pet, index))
      setPets(list)
    } catch {
      setError('Unable to load. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refetch() }, [refetch])

  function openAdd() {
    setEditTarget(null)
    setPetName('')
    setPetSpecies('Dog')
    setPetBreed('')
    setPetBirthDate('')
    setFormErrors({})
    setFormVisible(true)
  }

  function openEdit(pet: any) {
    setEditTarget(pet)
    setPetName(pet.name || '')
    setPetSpecies(pet.species || 'Dog')
    setPetBreed(pet.raw?.breed || '')
    setPetBirthDate(pet.raw?.birth_date || '')
    setFormErrors({})
    setFormVisible(true)
  }

  async function handleSave() {
    if (!petName.trim()) {
      setFormErrors({ petName: 'Pet name is required' })
      return
    }
    setFormErrors({})
    setSaving(true)
    try {
      const payload = {
        name: petName.trim(),
        species: petSpecies.toLowerCase(),
        breed: petBreed.trim() || undefined,
        birth_date: petBirthDate.trim() || undefined,
      }
      if (editTarget) {
        const res = await updatePet(editTarget.uuid || editTarget.id, payload)
        if (res?.success === false) {
          Alert.alert('Update failed', res?.message || 'Could not update pet.')
          return
        }
      } else {
        const res = await createPet(payload)
        if (res?.success === false) {
          Alert.alert('Add failed', res?.message || 'Could not add pet.')
          return
        }
      }
      setFormVisible(false)
      refetch()
    } catch {
      Alert.alert('Error', 'Could not save pet. Please try again.')
    } finally {
      setSaving(false)
    }
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
              refetch()
            } catch {
              Alert.alert('Error', 'Could not delete pet. Please try again.')
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
        <View>
          <Text style={styles.title}>Your pets</Text>
          <Text style={styles.subtitle}>Profiles, reminders, and health records.</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Add pet</Text>
        </Pressable>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Primary pet</Text>
        <Text style={styles.heroValue}>{primaryPet?.name || 'Add your first pet'}</Text>
        <Text style={styles.heroMeta}>{primaryPet?.species || 'Keep vaccinations and reminders in one place.'}</Text>
      </View>

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
          {pets.map(p => (
            <View key={p.id}>
              <Pressable onPress={() => nav.navigate('PetRecords', { petId: p.uuid || p.id, pet: p })}>
                <PetCard pet={p} />
              </Pressable>
              <View style={styles.petActions}>
                <Pressable style={styles.editBtn} onPress={() => openEdit(p)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </Pressable>
                <Pressable style={styles.deleteBtn} onPress={() => handleDelete(p)}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Add / Edit modal */}
      <Modal visible={formVisible} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>{editTarget ? 'Edit pet' : 'Add a pet'}</Text>

          <Text style={styles.fieldLabel}>Pet name *</Text>
          <TextInput
            value={petName}
            onChangeText={v => { setPetName(v); setFormErrors(p => { const n = { ...p }; delete n.petName; return n }) }}
            onBlur={() => { if (!petName.trim()) setFormErrors(p => ({ ...p, petName: 'Pet name is required' })) }}
            style={styles.input}
            placeholder="e.g. Bingo"
            placeholderTextColor={colors.muted}
          />
          {formErrors.petName ? <Text style={styles.fieldError}>{formErrors.petName}</Text> : null}

          <Text style={styles.fieldLabel}>Species</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            {SPECIES.map(s => (
              <Pressable key={s} onPress={() => setPetSpecies(s)} style={[styles.pill, petSpecies === s && styles.pillActive]}>
                <Text style={[styles.pillText, petSpecies === s && styles.pillTextActive]}>{s}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.fieldLabel}>Breed (optional)</Text>
          <TextInput value={petBreed} onChangeText={setPetBreed} style={styles.input} placeholder="e.g. Golden Retriever" placeholderTextColor={colors.muted} />

          <Text style={styles.fieldLabel}>Date of birth (optional)</Text>
          <TextInput value={petBirthDate} onChangeText={setPetBirthDate} style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} />

          <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.saveButtonText}>{editTarget ? 'Save changes' : 'Add pet'}</Text>}
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={() => setFormVisible(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 48 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.muted, marginTop: 4 },
  addBtn: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  addBtnText: { color: colors.onPrimary, fontWeight: '800', fontSize: 13 },
  heroCard: { backgroundColor: colors.primary, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.lg },
  heroLabel: { color: 'rgba(255,247,241,0.8)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '800' },
  heroValue: { color: colors.onPrimary, fontSize: 24, fontWeight: '900', marginTop: 6 },
  heroMeta: { color: colors.onPrimary, marginTop: 4, opacity: 0.92 },
  petList: { gap: 4 },
  petActions: { flexDirection: 'row', gap: 8, marginTop: -4, marginBottom: spacing.sm },
  editBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.primary },
  editBtnText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  deleteBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: colors.danger },
  deleteBtnText: { color: colors.danger, fontWeight: '700', fontSize: 12 },
  // Modal
  modal: { flex: 1, backgroundColor: colors.bg },
  modalContent: { padding: spacing.lg, paddingBottom: 48 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: colors.text, marginBottom: spacing.lg },
  fieldLabel: { color: colors.text, fontWeight: '700', marginBottom: 6, marginTop: spacing.md },
  fieldError: { color: colors.danger, fontSize: 12, marginTop: 4 },
  input: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 14, color: colors.text },
  pill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { color: colors.text, fontWeight: '700' },
  pillTextActive: { color: colors.onPrimary },
  saveButton: { marginTop: spacing.lg, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center' },
  saveButtonText: { color: colors.onPrimary, fontWeight: '800' },
  cancelButton: { marginTop: spacing.sm, paddingVertical: 14, alignItems: 'center' },
  cancelButtonText: { color: colors.muted, fontWeight: '700' },
})
