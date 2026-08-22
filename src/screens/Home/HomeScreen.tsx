import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import ErrorCard from '../../components/ErrorCard'
import { useAuth } from '../../contexts/AuthProvider'
import { getAppointments, getPets, getUnreadNotificationCount, getVets, resendVerificationEmail } from '../../services'
import { colors, radius, typography } from '../../theme'
import { normalizeAppointment, normalizePet, normalizeVet, pickArray } from '../../utils/backendAdapters'
import { resolveMediaUrl } from '../../utils/adapters'

type IconName = React.ComponentProps<typeof Ionicons>['name']

const FALLBACK_IMAGES = {
  pet: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=500&q=88',
  appointmentVet: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=500&q=88',
  vets: [
    'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=500&q=88',
    'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=500&q=88',
  ],
}

const quickActions: { id: string; label: string; icon: IconName; emergency?: boolean }[] = [
  { id: 'find', label: 'Find a vet', icon: 'search-outline' },
  { id: 'consult', label: 'Online consult', icon: 'videocam-outline' },
  { id: 'records', label: 'Records', icon: 'document-text-outline' },
  { id: 'emergency', label: 'Emergency', icon: 'add-outline', emergency: true },
]

export default function HomeScreen() {
  const nav = useNavigation<any>()
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'there'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [vets, setVets] = useState<any[]>([])
  const [pets, setPets] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [unread, setUnread] = useState(0)
  const [careGiven, setCareGiven] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  const loadHome = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [vetsResult, petsResult, appointmentsResult, notificationsResult] = await Promise.allSettled([
        getVets('limit=5'),
        getPets(),
        getAppointments('per_page=5'),
        getUnreadNotificationCount(),
      ])

      if (vetsResult.status === 'fulfilled') {
        setVets(pickArray(vetsResult.value?.data, ['vets', 'nearby_vets', 'all_vets']).map((vet, index) => normalizeVet(vet, index)))
      }
      if (petsResult.status === 'fulfilled') {
        setPets(pickArray(petsResult.value?.data, ['pets', 'items']).map((pet, index) => normalizePet(pet, index)))
      }
      if (appointmentsResult.status === 'fulfilled') {
        setAppointments(pickArray(appointmentsResult.value?.data, ['appointments', 'items']).map((appointment, index) => normalizeAppointment(appointment, index)))
      }
      if (notificationsResult.status === 'fulfilled') {
        const count = (notificationsResult.value?.data as any)?.unread_count
        if (typeof count === 'number') setUnread(count)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadHome() }, [loadHome])

  async function resendVerification() {
    setResending(true)
    try {
      await resendVerificationEmail()
      setResent(true)
    } finally {
      setResending(false)
    }
  }

  function runQuickAction(id: string) {
    if (id === 'find') nav.navigate('Search')
    else if (id === 'consult') nav.navigate('ModalityPicker')
    else if (id === 'records') pet ? nav.navigate('PetRecords', { petId: pet.uuid || pet.id, pet }) : nav.navigate('Pets')
    else nav.navigate('Emergency')
  }

  const pet = pets[0]
  const upcoming = appointments.find(item => item.status !== 'completed' && item.status !== 'cancelled')
  const petName = pet?.name || 'Bruno'
  const petPhoto = pet?.photoUrl || resolveMediaUrl(pet?.raw?.photo_url) || FALLBACK_IMAGES.pet
  const petDescription = [pet?.breed || pet?.species || 'Golden Retriever', pet?.age || '3 years'].filter(Boolean).join(' · ')
  const appointmentVet = upcoming?.vet || 'Dr. Ananya Rao'
  const appointmentTime = upcoming?.when || 'Today, 4:30 PM'
  const appointmentMode = upcoming?.raw?.consultation_type || upcoming?.raw?.modality || upcoming?.raw?.visit_type || 'Video consultation'
  const appointmentPhoto = resolveMediaUrl(upcoming?.raw?.vet?.photo_url) || resolveMediaUrl(upcoming?.raw?.vet?.avatar) || FALLBACK_IMAGES.appointmentVet
  const careTitle = pet?.medication || 'Bravecto Chewable'
  const careDescription = pet?.reminder || 'Flea & tick prevention · With food'
  const visibleVets = vets.slice(0, 2)
  const showVerification = user && !user.email_verified_at && user.email

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {showVerification ? (
        <View style={styles.verifyBanner}>
          <Ionicons name={resent ? 'checkmark-circle-outline' : 'mail-outline'} size={18} color={colors.primary} />
          <Text style={styles.verifyText}>{resent ? 'Verification email sent.' : 'Please verify your email address.'}</Text>
          {!resent ? (
            <Pressable style={styles.resendButton} onPress={resendVerification} disabled={resending}>
              {resending ? <ActivityIndicator size="small" color={colors.onPrimary} /> : <Text style={styles.resendText}>Resend</Text>}
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>Good morning, {firstName}</Text>
          <Text style={styles.subtitle}>How is {petName} today?</Text>
        </View>
        <Pressable style={styles.iconButton} onPress={() => nav.navigate('Notifications')} accessibilityLabel="Notifications">
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {unread > 0 ? <View style={styles.notificationDot} /> : null}
        </Pressable>
      </View>

      <Pressable style={styles.petRow} onPress={() => nav.navigate('Pets')}>
        <View style={styles.petAvatar}><Image source={{ uri: petPhoto }} style={styles.image} /></View>
        <View style={styles.petCopy}>
          <Text style={styles.petName}>{petName}</Text>
          <Text style={styles.petMeta}>{petDescription}</Text>
        </View>
      </Pressable>

      <View style={styles.hero}>
        <View style={styles.badge}><Text style={styles.badgeText}>Next appointment</Text></View>
        <View style={styles.appointmentRow}>
          <View style={styles.doctorMedia}><Image source={{ uri: appointmentPhoto }} style={styles.image} /></View>
          <View style={styles.appointmentCopy}>
            <Text style={styles.appointmentVet} numberOfLines={1}>{appointmentVet}</Text>
            <Text style={styles.appointmentTime}>{appointmentTime}</Text>
            <View style={styles.appointmentTypeRow}>
              <Ionicons name={String(appointmentMode).toLowerCase().includes('video') || String(appointmentMode).toLowerCase().includes('online') ? 'videocam-outline' : 'location-outline'} size={16} color={colors.muted} />
              <Text style={styles.appointmentType} numberOfLines={1}>{appointmentMode}</Text>
            </View>
          </View>
        </View>
        <Pressable
          style={styles.viewDetailsButton}
          onPress={() => upcoming
            ? nav.navigate('AppointmentDetail', { appointmentId: upcoming.uuid || upcoming.id, appointment: upcoming })
            : nav.navigate('Bookings')}
        >
          <Text style={styles.viewDetailsText}>View details</Text>
        </Pressable>
      </View>

      <View style={styles.quickGrid}>
        {quickActions.map(action => (
          <Pressable key={action.id} style={[styles.quickAction, action.emergency && styles.quickEmergency]} onPress={() => runQuickAction(action.id)}>
            <Ionicons name={action.icon} size={27} color={action.emergency ? colors.danger : colors.primary} />
            <Text style={[styles.quickLabel, action.emergency && styles.quickEmergencyLabel]}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      <SectionHeader title="Care today" action="View all" onPress={() => pet ? nav.navigate('PetRecords', { petId: pet.uuid || pet.id, pet }) : nav.navigate('Pets')} />
      <View style={[styles.careCard, careGiven && styles.careCardGiven]}>
        <View style={[styles.listIcon, careGiven && styles.listIconGiven]}>
          <Ionicons name={careGiven ? 'checkmark' : 'medical-outline'} size={22} color={careGiven ? colors.accent : colors.primary} />
        </View>
        <View style={styles.careCopy}>
          <View style={[styles.careBadge, careGiven && styles.careBadgeGiven]}>
            <Text style={[styles.careBadgeText, careGiven && styles.careBadgeTextGiven]}>{careGiven ? 'Given today' : 'Due now'}</Text>
          </View>
          <Text style={styles.careTitle} numberOfLines={1}>{careTitle}</Text>
          <Text style={styles.careDescription} numberOfLines={1}>{careDescription}</Text>
        </View>
        <Pressable style={styles.careButton} onPress={() => setCareGiven(value => !value)}>
          <Text style={styles.careButtonText}>{careGiven ? 'Undo' : 'Mark as given'}</Text>
        </Pressable>
      </View>

      <SectionHeader title="Nearby vets" action="View all" onPress={() => nav.navigate('Search')} />
      {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
      {error ? <ErrorCard message="Unable to load nearby vets. Check your connection and try again." onRetry={loadHome} /> : null}
      <View style={styles.vetStack}>
        {(visibleVets.length ? visibleVets : [
          { id: 'fallback-1', name: 'Dr. Meera Iyer', specialization: 'Small animal practice', rating: '4.7', distance: '1.2 km' },
          { id: 'fallback-2', name: 'Dr. Arjun Nair', specialization: 'Veterinary clinic', rating: '4.6', distance: '2.1 km' },
        ]).map((vet, index) => (
          <HomeVetCard key={vet.id || index} vet={vet} index={index} onPress={() => nav.navigate('VetDetail', { vetId: vet.uuid || vet.id, vet })} />
        ))}
      </View>
    </ScrollView>
  )
}

function SectionHeader({ title, action, onPress }: { title: string; action: string; onPress: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable style={styles.sectionAction} onPress={onPress}>
        <Text style={styles.sectionActionText}>{action}</Text>
        <Ionicons name="chevron-forward" size={15} color={colors.primary} />
      </Pressable>
    </View>
  )
}

function HomeVetCard({ vet, index, onPress }: { vet: any; index: number; onPress: () => void }) {
  const photo = vet.photoUrl || resolveMediaUrl(vet.raw?.photo_url) || resolveMediaUrl(vet.raw?.profile_photo_url) || FALLBACK_IMAGES.vets[index % FALLBACK_IMAGES.vets.length]
  return (
    <View style={styles.vetCard}>
      <View style={styles.vetMedia}><Image source={{ uri: photo }} style={styles.image} /></View>
      <View style={styles.vetCopy}>
        <Text style={styles.vetName} numberOfLines={1}>{vet.name}</Text>
        <Text style={styles.vetSpecialty} numberOfLines={1}>{vet.specialization || vet.clinic || 'Veterinary clinic'}</Text>
        <View style={styles.vetMetaRow}>
          <Ionicons name="star" size={14} color="#eaa24a" />
          <Text style={styles.vetRating}>{vet.rating || 'New'}</Text>
          <Text style={styles.vetDistance}>· {vet.distance || 'Nearby'}</Text>
        </View>
        <View style={styles.nextSlotBadge}><Text style={styles.nextSlotText}>Next: Today, 5:15 PM</Text></View>
      </View>
      <Pressable style={styles.vetArrow} onPress={onPress} accessibilityLabel={`View ${vet.name}`}>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 36 },
  verifyBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, marginBottom: 14, borderRadius: 14, backgroundColor: colors.primarySoft },
  verifyText: { flex: 1, ...typography.caption, color: colors.text },
  resendButton: { minWidth: 62, minHeight: 32, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderRadius: radius.full, backgroundColor: colors.primary },
  resendText: { color: colors.onPrimary, fontSize: 11, fontWeight: '800' },
  header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
  headerCopy: { flex: 1 },
  title: { fontSize: 28, lineHeight: 31, fontWeight: '900', letterSpacing: -0.6, color: colors.text },
  subtitle: { marginTop: 5, color: colors.muted, fontSize: 13, lineHeight: 18 },
  iconButton: { position: 'relative', width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 15, backgroundColor: colors.surface },
  notificationDot: { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  petRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  petAvatar: { width: 58, height: 58, overflow: 'hidden', borderRadius: 29, backgroundColor: colors.primarySoft },
  image: { width: '100%', height: '100%' },
  petCopy: { flex: 1 },
  petName: { fontSize: 17, lineHeight: 22, fontWeight: '800', color: colors.text },
  petMeta: { marginTop: 2, color: colors.muted, fontSize: 12, lineHeight: 17 },
  hero: { marginTop: 22, padding: 20, borderRadius: 26, backgroundColor: colors.primarySoft },
  badge: { alignSelf: 'flex-start', minHeight: 26, justifyContent: 'center', paddingHorizontal: 8, borderRadius: 9, backgroundColor: colors.primarySoft },
  badgeText: { color: colors.primary, fontSize: 10, lineHeight: 14, fontWeight: '800' },
  appointmentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  doctorMedia: { width: 70, height: 70, overflow: 'hidden', borderRadius: 18, backgroundColor: colors.surface },
  appointmentCopy: { flex: 1, minWidth: 0 },
  appointmentVet: { fontSize: 20, lineHeight: 25, fontWeight: '900', color: colors.text },
  appointmentTime: { marginTop: 3, color: colors.primary, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  appointmentTypeRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  appointmentType: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 17 },
  viewDetailsButton: { width: '100%', minHeight: 50, alignItems: 'center', justifyContent: 'center', marginTop: 16, borderRadius: 17, backgroundColor: colors.primary, shadowColor: colors.primary, shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
  viewDetailsText: { color: colors.onPrimary, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  quickGrid: { flexDirection: 'row', gap: 8, marginTop: 16 },
  quickAction: { flex: 1, minHeight: 102, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 4, borderRadius: 20, backgroundColor: colors.surfaceSoft },
  quickEmergency: { backgroundColor: colors.dangerSoft },
  quickLabel: { color: colors.text, fontSize: 10, lineHeight: 14, fontWeight: '700', textAlign: 'center' },
  quickEmergencyLabel: { color: colors.danger },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 28, marginBottom: 12 },
  sectionTitle: { fontSize: 20, lineHeight: 25, fontWeight: '900', color: colors.text },
  sectionAction: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 3 },
  sectionActionText: { color: colors.primary, fontSize: 12, lineHeight: 16, fontWeight: '700' },
  careCard: { minHeight: 92, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.surface },
  careCardGiven: { borderColor: 'rgba(36,124,115,0.18)', backgroundColor: colors.accentSoft },
  listIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.primarySoft },
  listIconGiven: { backgroundColor: colors.accentSoft },
  careCopy: { flex: 1, minWidth: 0 },
  careBadge: { alignSelf: 'flex-start', minHeight: 24, justifyContent: 'center', paddingHorizontal: 8, borderRadius: 9, backgroundColor: colors.primarySoft },
  careBadgeGiven: { backgroundColor: colors.accentSoft },
  careBadgeText: { color: colors.primary, fontSize: 9, lineHeight: 12, fontWeight: '800', textTransform: 'uppercase' },
  careBadgeTextGiven: { color: colors.accent },
  careTitle: { marginTop: 4, color: colors.text, fontSize: 15, lineHeight: 19, fontWeight: '800' },
  careDescription: { marginTop: 2, color: colors.muted, fontSize: 10, lineHeight: 14 },
  careButton: { minHeight: 40, maxWidth: 88, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderWidth: 1.5, borderColor: colors.primary, borderRadius: 14 },
  careButtonText: { color: colors.primary, fontSize: 10, lineHeight: 13, fontWeight: '800', textAlign: 'center' },
  loader: { marginVertical: 16 },
  vetStack: { gap: 12 },
  vetCard: { minHeight: 126, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.surface },
  vetMedia: { width: 76, height: 94, overflow: 'hidden', borderRadius: 17, backgroundColor: colors.primarySoft },
  vetCopy: { flex: 1, minWidth: 0 },
  vetName: { color: colors.text, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  vetSpecialty: { marginTop: 2, color: colors.muted, fontSize: 10, lineHeight: 14 },
  vetMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 7 },
  vetRating: { color: colors.text, fontSize: 12, lineHeight: 16, fontWeight: '800' },
  vetDistance: { color: colors.muted, fontSize: 11, lineHeight: 15 },
  nextSlotBadge: { alignSelf: 'flex-start', minHeight: 25, justifyContent: 'center', marginTop: 8, paddingHorizontal: 8, borderRadius: 9, backgroundColor: colors.primarySoft },
  nextSlotText: { color: colors.primary, fontSize: 9, lineHeight: 12, fontWeight: '700' },
  vetArrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 15, backgroundColor: colors.surface },
})
