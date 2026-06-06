import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable, TextInput, Alert, ActivityIndicator, StyleSheet, Modal } from 'react-native'
import { useAuth } from '../../contexts/AuthProvider'
import { updateProfile, changePassword, deleteAccount } from '../../services'
import { colors, radius, spacing } from '../../theme'

export default function ProfileScreen() {
  const { signOut, user, refreshUser } = useAuth()
  const [editVisible, setEditVisible] = useState(false)
  const [pwVisible, setPwVisible] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit profile state
  const [editName, setEditName] = useState(user?.name || '')
  const [editEmail, setEditEmail] = useState(user?.email || '')
  const [editPhone, setEditPhone] = useState(user?.phone || '')
  const [editErrors, setEditErrors] = useState<Record<string, string>>({})

  // Change password state
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({})

  async function handleSaveProfile() {
    if (!editName.trim()) {
      setEditErrors({ name: 'Name is required' })
      return
    }
    setEditErrors({})
    setSaving(true)
    try {
      const res = await updateProfile({ name: editName.trim(), email: editEmail.trim(), phone: editPhone.trim() })
      if (res?.success === false) {
        Alert.alert('Update failed', res?.message || 'Could not update profile.')
        return
      }
      await refreshUser()
      setEditVisible(false)
      Alert.alert('Profile updated', 'Your profile has been saved.')
    } catch {
      Alert.alert('Error', 'Could not update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    const errs: Record<string, string> = {}
    if (!currentPw) errs.currentPw = 'Current password is required'
    if (newPw.length < 8) errs.newPw = 'Password must be at least 8 characters'
    if (newPw !== confirmPw) errs.confirmPw = 'Passwords do not match'
    if (Object.keys(errs).length) {
      setPwErrors(errs)
      return
    }
    setPwErrors({})
    setSaving(true)
    try {
      const res = await changePassword({ current_password: currentPw, password: newPw, password_confirmation: confirmPw })
      if (res?.success === false) {
        Alert.alert('Change failed', res?.message || 'Current password may be incorrect.')
        return
      }
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
      setPwVisible(false)
      Alert.alert('Password changed', 'Your password has been updated.')
    } catch {
      Alert.alert('Error', 'Could not change password. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount()
            } catch {
              // Continue sign-out regardless
            }
            await signOut()
          },
        },
      ],
    )
  }

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ])
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name || '—'}</Text>
        <Text style={styles.email}>{user?.email || user?.phone || '—'}</Text>
        {user?.role ? <Text style={styles.roleBadge}>{user.role}</Text> : null}
      </View>

      {/* Account actions */}
      <Text style={styles.sectionLabel}>ACCOUNT</Text>

      <ActionRow label="Edit profile" note="Update name, email, phone" onPress={() => {
        setEditName(user?.name || '')
        setEditEmail(user?.email || '')
        setEditPhone(user?.phone || '')
        setEditErrors({})
        setEditVisible(true)
      }} />
      <ActionRow label="Change password" note="Update your login password" onPress={() => { setPwErrors({}); setPwVisible(true) }} />

      <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
      <ActionRow label="Notification alerts" note="Managed via device settings" onPress={() => Alert.alert('Notifications', 'Manage notification permissions in your device Settings app.')} />

      <Text style={styles.sectionLabel}>SUPPORT</Text>
      <ActionRow label="Help & support" note="24/7 help center" onPress={() => Alert.alert('Support', 'Contact us at support@respaw.app')} />

      <Text style={styles.sectionLabel}>DANGER ZONE</Text>
      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
      <Pressable style={styles.deleteButton} onPress={handleDeleteAccount}>
        <Text style={styles.deleteText}>Delete account</Text>
      </Pressable>

      {/* Edit profile modal */}
      <Modal visible={editVisible} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit profile</Text>

          <Text style={styles.fieldLabel}>Full name</Text>
          <TextInput
            value={editName}
            onChangeText={v => { setEditName(v); setEditErrors(p => { const n = { ...p }; delete n.name; return n }) }}
            onBlur={() => { if (!editName.trim()) setEditErrors(p => ({ ...p, name: 'Name is required' })) }}
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={colors.muted}
          />
          {editErrors.name ? <Text style={styles.fieldError}>{editErrors.name}</Text> : null}

          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput value={editEmail} onChangeText={setEditEmail} style={styles.input} placeholder="you@example.com" placeholderTextColor={colors.muted} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.fieldLabel}>Phone</Text>
          <TextInput value={editPhone} onChangeText={setEditPhone} style={styles.input} placeholder="+91 9876543210" placeholderTextColor={colors.muted} keyboardType="phone-pad" />

          <Pressable style={styles.saveButton} onPress={handleSaveProfile} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.saveButtonText}>Save changes</Text>}
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={() => setEditVisible(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </Modal>

      {/* Change password modal */}
      <Modal visible={pwVisible} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
          <Text style={styles.modalTitle}>Change password</Text>

          <Text style={styles.fieldLabel}>Current password</Text>
          <TextInput
            value={currentPw}
            onChangeText={v => { setCurrentPw(v); setPwErrors(p => { const n = { ...p }; delete n.currentPw; return n }) }}
            onBlur={() => { if (!currentPw) setPwErrors(p => ({ ...p, currentPw: 'Current password is required' })) }}
            style={styles.input}
            secureTextEntry
            placeholder="Current password"
            placeholderTextColor={colors.muted}
          />
          {pwErrors.currentPw ? <Text style={styles.fieldError}>{pwErrors.currentPw}</Text> : null}

          <Text style={styles.fieldLabel}>New password</Text>
          <TextInput
            value={newPw}
            onChangeText={v => { setNewPw(v); setPwErrors(p => { const n = { ...p }; delete n.newPw; return n }) }}
            onBlur={() => { if (newPw.length < 8) setPwErrors(p => ({ ...p, newPw: 'Password must be at least 8 characters' })) }}
            style={styles.input}
            secureTextEntry
            placeholder="Min. 8 characters"
            placeholderTextColor={colors.muted}
          />
          {pwErrors.newPw ? <Text style={styles.fieldError}>{pwErrors.newPw}</Text> : null}

          <Text style={styles.fieldLabel}>Confirm new password</Text>
          <TextInput
            value={confirmPw}
            onChangeText={v => { setConfirmPw(v); setPwErrors(p => { const n = { ...p }; delete n.confirmPw; return n }) }}
            onBlur={() => { if (confirmPw !== newPw) setPwErrors(p => ({ ...p, confirmPw: 'Passwords do not match' })) }}
            style={styles.input}
            secureTextEntry
            placeholder="Repeat new password"
            placeholderTextColor={colors.muted}
          />
          {pwErrors.confirmPw ? <Text style={styles.fieldError}>{pwErrors.confirmPw}</Text> : null}

          <Pressable style={styles.saveButton} onPress={handleChangePassword} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.onPrimary} /> : <Text style={styles.saveButtonText}>Update password</Text>}
          </Pressable>
          <Pressable style={styles.cancelButton} onPress={() => setPwVisible(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </ScrollView>
      </Modal>
    </ScrollView>
  )
}

function ActionRow({ label, note, onPress }: { label: string; note: string; onPress: () => void }) {
  return (
    <Pressable style={styles.rowCard} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowNote}>{note}</Text>
      </View>
      <Text style={styles.rowArrow}>›</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 52 },
  headerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { color: colors.onPrimary, fontSize: 30, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '900', color: colors.text },
  email: { color: colors.muted, marginTop: 4 },
  roleBadge: {
    marginTop: 8,
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'capitalize',
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    letterSpacing: 1.2,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  rowCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLabel: { color: colors.text, fontWeight: '800' },
  rowNote: { color: colors.muted, marginTop: 2, fontSize: 12 },
  rowArrow: { color: colors.muted, fontSize: 22, fontWeight: '300' },
  signOutButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: { color: colors.onPrimary, fontWeight: '800' },
  deleteButton: {
    marginTop: spacing.sm,
    backgroundColor: 'transparent',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteText: { color: colors.danger, fontWeight: '800' },
  // Modal
  modal: { flex: 1, backgroundColor: colors.bg },
  modalContent: { padding: spacing.lg, paddingBottom: 48 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: colors.text, marginBottom: spacing.lg },
  fieldLabel: { color: colors.text, fontWeight: '700', marginBottom: 6, marginTop: spacing.sm },
  fieldError: { color: colors.danger, fontSize: 12, marginTop: 4 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    color: colors.text,
  },
  saveButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: { color: colors.onPrimary, fontWeight: '800' },
  cancelButton: {
    marginTop: spacing.sm,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: { color: colors.muted, fontWeight: '700' },
})
