import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import PrimaryButton from '../../components/PrimaryButton'
import ErrorCard from '../../components/ErrorCard'
import { useNavigation, useRoute } from '@react-navigation/native'
import { getVet, getReviewsForVet } from '../../services'
import { colors, radius, spacing } from '../../theme'
import { normalizeVet, pickArray } from '../../utils/backendAdapters'
import { parseApiError } from '../../utils/apiError'
import { openDirections, DEFAULT_DELTA, HAS_MAPS_KEY } from '../../utils/geo'

export default function VetDetailScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const [vet, setVet] = useState<any>(route.params?.vet ? normalizeVet(route.params.vet) : null)
  const [loading, setLoading] = useState(!route.params?.vet)
  const [loadError, setLoadError] = useState('')
  const [reviews, setReviews] = useState<any[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [avgRating, setAvgRating] = useState<number | null>(null)

  async function loadVet() {
    if (!route.params?.vetId || route.params?.vet) return
    setLoading(true)
    setLoadError('')
    try {
      const res = await getVet(route.params.vetId)
      const data = res?.data as any
      setVet(normalizeVet(data?.vet || data || {}, 0))
    } catch (e) {
      setLoadError(parseApiError(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadVet()
  }, [route.params?.vet, route.params?.vetId])

  useEffect(() => {
    async function loadReviews() {
      const vetUuid = route.params?.vetId || vet?.uuid || vet?.id
      if (!vetUuid) return
      setReviewsLoading(true)
      try {
        const res = await getReviewsForVet(vetUuid)
        const data = res?.data as any
        const list = pickArray(data, ['reviews', 'items'])
        setReviews(list)
        if (data?.avg_rating != null) setAvgRating(Number(data.avg_rating))
      } catch {
        // non-fatal
      } finally {
        setReviewsLoading(false)
      }
    }
    if (vet) loadReviews()
  }, [vet, route.params?.vetId])

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  if (loadError) {
    return (
      <View style={[styles.screen, styles.centered, { padding: spacing.lg }]}>
        <ErrorCard message={loadError} onRetry={loadVet} />
      </View>
    )
  }

  if (!vet) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    )
  }

  const about = vet.raw?.bio || vet.raw?.about || vet.raw?.description || null
  const feeNum = Number(String(vet.fee).replace(/[^0-9.]/g, '')) || 0
  const displayRating = avgRating != null ? avgRating.toFixed(1) : vet.rating || 0
  const displayReviews = reviews.length || vet.reviews || 0

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.name}>{vet.name}</Text>
        <Text style={styles.clinic}>{vet.clinic}</Text>
        <Text style={styles.meta}>{vet.specialization} · {vet.distance}</Text>

        <View style={styles.statsRow}>
          <Stat label="Rating" value={`${displayRating}`} />
          <Stat label="Reviews" value={`${displayReviews}`} />
          <Stat label="Fee" value={vet.fee} />
        </View>
      </View>

      <View style={styles.chipRow}>
        {vet.chips.map((chip: string) => (
          <View key={chip} style={styles.chip}>
            <Text style={styles.chipText}>{chip}</Text>
          </View>
        ))}
      </View>

      {about ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.body}>{about}</Text>
        </View>
      ) : null}

      <ClinicLocation vet={vet} />

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Fee summary</Text>
        {feeNum > 0 ? (
          <>
            <LineItem label="Consultation" value={vet.fee} />
            <LineItem label="Platform fee" value="₹49" />
            <LineItem label="Total" value={`₹${feeNum + 49}`} bold />
          </>
        ) : (
          <Text style={styles.body}>Fee information not available. Contact the clinic directly.</Text>
        )}
      </View>

      {/* Reviews section */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        {reviewsLoading ? <ActivityIndicator color={colors.primary} /> : null}
        {!reviewsLoading && !reviews.length ? (
          <Text style={styles.body}>No reviews yet. Be the first to review after your appointment.</Text>
        ) : null}
        {reviews.slice(0, 5).map((r, i) => (
          <ReviewRow key={String(r.uuid || r.id || i)} review={r} />
        ))}
        {reviews.length > 5 ? (
          <Text style={styles.moreReviews}>+{reviews.length - 5} more reviews</Text>
        ) : null}
      </View>

      {/* Favorites — backend not yet available */}
      <View style={[styles.card, styles.comingSoonCard]}>
        <Text style={styles.comingSoonLabel}>Save to favourites — coming soon</Text>
      </View>

      <View style={styles.buttonWrap}>
        <PrimaryButton title="Book Appointment" onPress={() => navigation.navigate('Booking', { vetId: vet.uuid || vet.id, vet })} />
        <View style={{ height: spacing.sm }} />
        <PrimaryButton title="Consult Online" onPress={() => navigation.navigate('Booking', { vetId: vet.uuid || vet.id, vet, preselectedType: 'online' })} />
      </View>
    </ScrollView>
  )
}

function ClinicLocation({ vet }: { vet: any }) {
  const hasCoords = vet.latitude != null && vet.longitude != null
  const address = vet.address || vet.clinic || ''
  // Nothing useful to show if we have neither coordinates nor an address.
  if (!hasCoords && !address) return null

  const canDirect = hasCoords || !!address

  async function onDirections() {
    await openDirections({
      latitude: vet.latitude,
      longitude: vet.longitude,
      label: vet.clinic || vet.name,
      address,
    })
  }

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Clinic location</Text>

      {hasCoords && HAS_MAPS_KEY ? (
        <View style={styles.miniMapWrap}>
          <MapView
            style={styles.miniMap}
            provider={PROVIDER_GOOGLE}
            pointerEvents="none"
            initialRegion={{
              latitude: vet.latitude,
              longitude: vet.longitude,
              ...DEFAULT_DELTA,
            }}
          >
            <Marker
              coordinate={{ latitude: vet.latitude, longitude: vet.longitude }}
              pinColor={colors.primary}
            />
          </MapView>
        </View>
      ) : (
        <View style={styles.noMap}>
          <Ionicons name="map-outline" size={22} color={colors.muted} />
          <Text style={styles.noMapText}>Map preview unavailable for this clinic.</Text>
        </View>
      )}

      {address ? <Text style={[styles.body, { marginTop: spacing.sm }]}>{address}</Text> : null}

      <Pressable
        onPress={onDirections}
        disabled={!canDirect}
        style={[styles.directionsBtn, !canDirect && styles.directionsBtnDisabled]}
      >
        <Ionicons name="navigate" size={16} color={colors.onPrimary} />
        <Text style={styles.directionsText}>Get directions</Text>
      </Pressable>
    </View>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )
}

function LineItem({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.lineItem}>
      <Text style={[styles.lineLabel, bold && styles.lineLabelBold]}>{label}</Text>
      <Text style={[styles.lineValue, bold && styles.lineValueBold]}>{value}</Text>
    </View>
  )
}

function ReviewRow({ review }: { review: any }) {
  const stars = Number(review.rating || 0)
  const comment = review.comment || review.body || ''
  const author = review.user?.name || review.author || 'Pet owner'
  const date = review.created_at ? new Date(review.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' }) : ''

  return (
    <View style={styles.reviewRow}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewAuthor}>{author}</Text>
        <View style={styles.reviewStars}>
          {[1, 2, 3, 4, 5].map(s => (
            <Text key={s} style={{ color: s <= stars ? colors.warning : colors.border, fontSize: 13 }}>★</Text>
          ))}
        </View>
      </View>
      {comment ? <Text style={styles.reviewComment}>{comment}</Text> : null}
      {date ? <Text style={styles.reviewDate}>{date}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  centered: { alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.lg, paddingBottom: 48 },
  heroCard: { backgroundColor: colors.primary, borderRadius: 28, padding: spacing.lg, marginBottom: spacing.lg },
  name: { color: colors.onPrimary, fontSize: 28, fontWeight: '800' },
  clinic: { color: colors.onPrimary, fontSize: 16, marginTop: 4, opacity: 0.95 },
  meta: { color: 'rgba(255,247,241,0.9)', marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: 10, marginTop: spacing.lg },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: radius.md, padding: 12 },
  statLabel: { color: 'rgba(255,247,241,0.8)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
  statValue: { color: colors.onPrimary, fontSize: 18, fontWeight: '800', marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  chip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10 },
  chipText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  card: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  body: { color: colors.muted, lineHeight: 20 },
  lineItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  lineLabel: { color: colors.text },
  lineLabelBold: { fontWeight: '800' },
  lineValue: { color: colors.text, fontWeight: '700' },
  lineValueBold: { fontWeight: '800' },
  reviewRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewAuthor: { fontWeight: '700', color: colors.text },
  reviewStars: { flexDirection: 'row' },
  reviewComment: { color: colors.muted, marginTop: 4, lineHeight: 18 },
  reviewDate: { color: colors.muted, fontSize: 11, marginTop: 4 },
  moreReviews: { color: colors.primary, fontWeight: '700', marginTop: spacing.sm, textAlign: 'center' },
  miniMapWrap: { borderRadius: radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  miniMap: { height: 150, width: '100%' },
  noMap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  noMapText: { color: colors.muted, flex: 1 },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    marginTop: spacing.md,
  },
  directionsBtnDisabled: { backgroundColor: colors.border },
  directionsText: { color: colors.onPrimary, fontWeight: '800' },
  comingSoonCard: { borderStyle: 'dashed', backgroundColor: colors.surfaceSoft },
  comingSoonLabel: { color: colors.muted, fontWeight: '700', textAlign: 'center' },
  buttonWrap: { marginTop: spacing.sm },
})
