import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { quickActions } from '../../data/mock'
import QuickAction from '../../components/QuickAction'
import VetCard from '../../components/VetCard'
import PetCard from '../../components/PetCard'
import AppointmentCard from '../../components/AppointmentCard'
import ErrorCard from '../../components/ErrorCard'
import { useNavigation } from '@react-navigation/native'
import { useAuth } from '../../contexts/AuthProvider'
import { getAppointments, getBlogPosts, getPets, getVets, getUnreadNotificationCount, resendVerificationEmail, getAdBanners } from '../../services'
import { parseApiError } from '../../utils/apiError'
import { colors, radius, spacing } from '../../theme'
import { normalizeAppointment, normalizePet, normalizeVet, pickArray } from '../../utils/backendAdapters'

export default function HomeScreen() {
  const nav = useNavigation<any>()
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'there'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [vetFeed, setVetFeed] = useState<any[]>([])
  const [petFeed, setPetFeed] = useState<any[]>([])
  const [appointmentFeed, setAppointmentFeed] = useState<any[]>([])
  const [articleFeed, setArticleFeed] = useState<any[]>([])
  const [banners, setBanners] = useState<any[]>([])
  const [nearbyVetCount, setNearbyVetCount] = useState<string>('—')
  const [upcomingCount, setUpcomingCount] = useState<string>('—')
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [resendingVerify, setResendingVerify] = useState(false)
  const [verifyResent, setVerifyResent] = useState(false)

  const loadHome = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
        const [vetsRes, petsRes, appointmentsRes, postsRes, notifsRes, bannersRes] = await Promise.allSettled([
          getVets('limit=5'),
          getPets(),
          getAppointments('per_page=5'),
          getBlogPosts('per_page=3'),
          getUnreadNotificationCount(),
          getAdBanners(),
        ])

        if (notifsRes.status === 'fulfilled') {
          const count = (notifsRes.value?.data as any)?.unread_count
          if (typeof count === 'number') setUnreadNotifs(count)
        }

        if (vetsRes.status === 'fulfilled') {
          const vetList = pickArray(vetsRes.value?.data, ['vets', 'nearby_vets', 'all_vets']).map((vet, index) => normalizeVet(vet, index))
          if (vetList.length) {
            setVetFeed(vetList)
            setNearbyVetCount(String(vetList.length))
          }
        }

        if (petsRes.status === 'fulfilled') {
          const petList = pickArray(petsRes.value?.data, ['pets', 'items']).map((pet, index) => normalizePet(pet, index))
          if (petList.length) setPetFeed(petList)
        }

        if (appointmentsRes.status === 'fulfilled') {
          const appointmentList = pickArray(appointmentsRes.value?.data, ['appointments', 'items']).map((appt, index) => normalizeAppointment(appt, index))
          if (appointmentList.length) {
            setAppointmentFeed(appointmentList)
            const upcoming = appointmentList.filter(a => a.status !== 'completed' && a.status !== 'cancelled')
            setUpcomingCount(String(upcoming.length))
          } else {
            setUpcomingCount('0')
          }
        }

        if (postsRes.status === 'fulfilled') {
          const posts = pickArray(postsRes.value?.data as any, ['posts', 'items']).map((post: any, index: number) => ({
            id: String(post.uuid || post.id || `article-${index}`),
            title: post.title || post.name || 'Article',
            category: post.category || post.topic || 'Health',
            readTime: post.read_time || post.readTime || 'Read more',
          }))
          if (posts.length) setArticleFeed(posts)
        }

        if (bannersRes.status === 'fulfilled') {
          const bannerList = pickArray(bannersRes.value?.data as any, ['ad_banners', 'banners', 'items'])
          if (bannerList.length) setBanners(bannerList)
        }
    } catch (e) {
      setError(true)
      // individual feed errors are swallowed above via allSettled;
      // this catch only fires if Promise.allSettled itself throws (shouldn't happen)
      void parseApiError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadHome() }, [loadHome])

  function handleQuickAction(id: string) {
    if (id === 'book') {
      nav.navigate('Booking', { vetId: vetFeed[0]?.uuid || vetFeed[0]?.id, vet: vetFeed[0] })
      return
    }

    if (id === 'records') {
      nav.navigate('Bookings')
      return
    }

    if (id === 'consult') {
      nav.navigate('ModalityPicker')
      return
    }

    nav.navigate('Search')
  }

  async function handleResendVerification() {
    setResendingVerify(true)
    try {
      await resendVerificationEmail()
      setVerifyResent(true)
    } catch { /* ignore */ }
    setResendingVerify(false)
  }

  const showVerifyBanner = user && !user.email_verified_at && user.email

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {showVerifyBanner ? (
        <View style={styles.verifyBanner}>
          <Text style={styles.verifyText}>
            {verifyResent ? '✅ Verification email sent! Check your inbox.' : '📧 Please verify your email address.'}
          </Text>
          {!verifyResent ? (
            <Pressable onPress={handleResendVerification} disabled={resendingVerify} style={styles.resendBtn}>
              {resendingVerify
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Text style={styles.resendBtnText}>Resend</Text>}
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroEyebrow}>Today&apos;s pulse</Text>
          <Pressable onPress={() => nav.navigate('Notifications')} style={styles.bellButton}>
            <Text style={styles.bellIcon}>🔔</Text>
            {unreadNotifs > 0 ? (
              <View style={styles.badge}><Text style={styles.badgeText}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</Text></View>
            ) : null}
          </Pressable>
        </View>
        <Text style={styles.heroTitle}>Hi, {firstName}.</Text>
        <Text style={styles.heroSubtitle}>One calm place for care, records, and urgent help.</Text>
        <View style={styles.heroStats}>
          <Stat label="Nearby vets" value={nearbyVetCount} note="In your area" />
          <Stat label="Upcoming" value={upcomingCount} note="Appointments" />
          <Stat label="Pets" value={String(petFeed.length || '—')} note="Registered" />
        </View>
      </View>

      <View style={styles.quickGrid}>
        {quickActions.map(a => (
          <QuickAction key={a.id} action={a} onPress={() => handleQuickAction(a.id)} />
        ))}
      </View>

      {banners.length > 0 ? (
        <>
          <SectionHeader title="Featured" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow} style={styles.bannerScroll}>
            {banners.map((b: any, i: number) => (
              <View key={b.uuid || b.id || String(i)} style={styles.bannerCard}>
                <Text style={styles.bannerTitle}>{b.title || b.name || 'Offer'}</Text>
                {b.subtitle || b.description ? <Text style={styles.bannerSubtitle}>{b.subtitle || b.description}</Text> : null}
              </View>
            ))}
          </ScrollView>
        </>
      ) : null}

      <SectionHeader title="Nearby vets" action="See all" onAction={() => nav.navigate('Search')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
        {vetFeed.map(vet => (
          <VetCard key={vet.id} vet={vet} onPress={() => nav.navigate('VetDetail', { vetId: vet.uuid || vet.id, vet })} />
        ))}
      </ScrollView>

      <SectionHeader title="Your pets" action="Add pet" onAction={() => nav.navigate('Pets')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
        {petFeed.map(p => (
          <PetCard key={p.id} pet={p} />
        ))}
      </ScrollView>

      <SectionHeader title="Upcoming appointments" action="Bookings" onAction={() => nav.navigate('Bookings')} />
      {loading ? <ActivityIndicator color={colors.primary} style={{ marginBottom: spacing.sm }} /> : null}
      {error ? <ErrorCard message="Unable to load. Check your connection and try again." onRetry={loadHome} /> : null}
      {!error && appointmentFeed.slice(0, 3).map(a => (
        <Pressable key={a.id} onPress={() => nav.navigate('AppointmentDetail', { appointmentId: a.id, appointment: a })}>
          <AppointmentCard appt={a} />
        </Pressable>
      ))}

      <SectionHeader title="Tips & articles" action="Browse" onAction={() => nav.navigate('Blog')} />
      {articleFeed.map(a => (
        <Pressable key={a.id} style={styles.articleCard} onPress={() => nav.navigate('Blog')}>
          <Text style={styles.articleCategory}>{typeof a.category === 'object' ? (a.category as any)?.name || 'Health' : a.category}</Text>
          <Text style={styles.articleTitle}>{a.title}</Text>
          <Text style={styles.articleMeta}>{a.readTime}</Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statNote}>{note}</Text>
    </View>
  )
}

function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Pressable onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></Pressable> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 48 },
  verifyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.sky,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: spacing.sm,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  verifyText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
  resendBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.primary, borderRadius: 999 },
  resendBtnText: { color: colors.onPrimary, fontWeight: '700', fontSize: 12 },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bellButton: { position: 'relative', width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  bellIcon: { fontSize: 20 },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: colors.danger, borderRadius: 8, minWidth: 16, paddingHorizontal: 3, alignItems: 'center' },
  badgeText: { color: colors.surface, fontSize: 10, fontWeight: '800' },
  heroEyebrow: { color: 'rgba(255,247,241,0.85)', textTransform: 'uppercase', letterSpacing: 1.2, fontSize: 11, fontWeight: '700' },
  heroTitle: { color: colors.onPrimary, fontSize: 28, fontWeight: '800', marginTop: 6 },
  heroSubtitle: { color: colors.onPrimary, opacity: 0.9, marginTop: 6, lineHeight: 20 },
  heroStats: { flexDirection: 'row', gap: 10, marginTop: spacing.lg },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.md, padding: 12 },
  statValue: { color: colors.onPrimary, fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.onPrimary, marginTop: 4, fontWeight: '700', fontSize: 12 },
  statNote: { color: 'rgba(255,247,241,0.8)', marginTop: 2, fontSize: 11 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.lg },
  horizontalRow: { gap: 12, paddingBottom: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  sectionAction: { color: colors.primary, fontWeight: '700' },
  bannerScroll: { marginBottom: spacing.sm },
  bannerCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.md,
    minWidth: 220,
    maxWidth: 280,
    justifyContent: 'flex-end',
  },
  bannerTitle: { color: colors.onPrimary, fontWeight: '800', fontSize: 16 },
  bannerSubtitle: { color: 'rgba(255,247,241,0.85)', marginTop: 4, fontSize: 13, lineHeight: 18 },
  articleCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  articleCategory: { color: colors.primary, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
  articleTitle: { color: colors.text, fontWeight: '800', fontSize: 16, marginTop: 6 },
  articleMeta: { color: colors.muted, marginTop: 6, fontSize: 12 },
})
