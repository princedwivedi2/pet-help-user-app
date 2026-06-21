import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import MapView, { Marker, Callout, PROVIDER_GOOGLE, type Region } from 'react-native-maps'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import VetCard from '../../components/VetCard'
import ErrorCard from '../../components/ErrorCard'
import EmptyState from '../../components/EmptyState'
import { getNearbyVets, getVets } from '../../services'
import { normalizeVet, pickArray } from '../../utils/backendAdapters'
import { parseApiError } from '../../utils/apiError'
import { useUserLocation } from '../../hooks/useUserLocation'
import {
  DEFAULT_REGION,
  DEFAULT_DELTA,
  HAS_MAPS_KEY,
  haversineKm,
  formatDistance,
  type LatLng,
} from '../../utils/geo'
import { colors, radius, spacing } from '../../theme'

type ViewMode = 'map' | 'list'

export default function NearbyVetsScreen() {
  const nav = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const mapRef = useRef<MapView>(null)
  const { status, coords, loading: locating, request } = useUserLocation(true)

  const [mode, setMode] = useState<ViewMode>(HAS_MAPS_KEY ? 'map' : 'list')
  const [vets, setVets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [usingFallback, setUsingFallback] = useState(false)

  // The point we search/sort around: real location when granted, else default city.
  const center: LatLng = useMemo(
    () => coords ?? { latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude },
    [coords],
  )

  const region: Region = useMemo(
    () => ({ ...center, ...DEFAULT_DELTA }),
    [center],
  )

  // Load vets once we know whether we have a real fix or are falling back.
  useEffect(() => {
    if (status === 'requesting' || status === 'idle') return
    const isFallback = status !== 'granted' || !coords
    setUsingFallback(isFallback)

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await getNearbyVets({ lat: center.latitude, lng: center.longitude, radiusKm: 15 })
        if (cancelled) return
        const data = res?.data as any
        const list = pickArray(data, ['nearby_vets', 'city_vets', 'all_vets', 'vets']).map(
          (v, i) => normalizeVet(v, i),
        )
        setVets(list)
      } catch (e) {
        if (!cancelled) {
          setError(parseApiError(e))
          setVets([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [status, coords, center.latitude, center.longitude])

  // Attach a client-computed distance (haversine) and sort nearest-first.
  const sortedVets = useMemo(() => {
    const withDist = vets.map((v) => {
      const km =
        v.latitude != null && v.longitude != null
          ? haversineKm(center, { latitude: v.latitude, longitude: v.longitude })
          : v.distanceKm ?? null
      return { ...v, _km: km, distance: km != null ? formatDistance(km) : v.distance }
    })
    return withDist.sort((a, b) => {
      if (a._km == null) return 1
      if (b._km == null) return -1
      return a._km - b._km
    })
  }, [vets, center])

  const mappable = useMemo(
    () => sortedVets.filter((v) => v.latitude != null && v.longitude != null),
    [sortedVets],
  )

  function recenter() {
    mapRef.current?.animateToRegion(region, 400)
  }

  function openVet(vet: any) {
    nav.navigate('VetDetail', { vetId: vet.uuid || vet.id, vet })
  }

  const showLocationBanner = status === 'denied' || status === 'unavailable'

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => nav.goBack()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Nearby vets</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {usingFallback ? `Showing ${DEFAULT_REGION.label} · location off` : 'Around your location'}
          </Text>
        </View>
        {HAS_MAPS_KEY ? (
          <View style={styles.toggle}>
            <ToggleBtn label="Map" icon="map" active={mode === 'map'} onPress={() => setMode('map')} />
            <ToggleBtn label="List" icon="list" active={mode === 'list'} onPress={() => setMode('list')} />
          </View>
        ) : null}
      </View>

      {/* Location permission / unavailable banner */}
      {showLocationBanner ? (
        <View style={styles.banner}>
          <Ionicons name="location-outline" size={18} color={colors.primary} />
          <Text style={styles.bannerText}>
            {status === 'denied'
              ? `Location permission is off. Showing vets near ${DEFAULT_REGION.label}.`
              : `Couldn't get your location. Showing vets near ${DEFAULT_REGION.label}.`}
          </Text>
          <Pressable onPress={request} hitSlop={8}>
            <Text style={styles.bannerAction}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {/* Body */}
      {locating && status === 'requesting' ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.muted}>Finding vets near you…</Text>
        </View>
      ) : mode === 'map' && HAS_MAPS_KEY ? (
        <View style={styles.mapWrap}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            showsUserLocation={status === 'granted'}
            showsMyLocationButton={false}
          >
            {mappable.map((vet) => (
              <Marker
                key={vet.id}
                coordinate={{ latitude: vet.latitude, longitude: vet.longitude }}
                pinColor={colors.primary}
                onCalloutPress={() => openVet(vet)}
              >
                <Callout tooltip onPress={() => openVet(vet)}>
                  <View style={styles.callout}>
                    <Text style={styles.calloutName} numberOfLines={1}>{vet.name}</Text>
                    <Text style={styles.calloutMeta} numberOfLines={1}>
                      {vet.specialization}
                    </Text>
                    <View style={styles.calloutRow}>
                      <Text style={styles.calloutDist}>{vet.distance}</Text>
                      <Text style={styles.calloutRating}>★ {vet.rating || '—'}</Text>
                    </View>
                    <Text style={styles.calloutLink}>View details ›</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>

          {/* Recenter FAB */}
          <Pressable style={styles.fab} onPress={recenter} hitSlop={8}>
            <Ionicons name="locate" size={22} color={colors.primary} />
          </Pressable>

          {/* Footer summary / no-coords notice */}
          <View style={styles.mapFooter}>
            {loading ? (
              <Text style={styles.mapFooterText}>Loading vets…</Text>
            ) : error ? (
              <Text style={styles.mapFooterText}>{error}</Text>
            ) : (
              <Text style={styles.mapFooterText}>
                {mappable.length} on map
                {sortedVets.length > mappable.length
                  ? ` · ${sortedVets.length - mappable.length} without a pin (see List)`
                  : ''}
              </Text>
            )}
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          {!HAS_MAPS_KEY ? (
            <View style={styles.banner}>
              <Ionicons name="map-outline" size={18} color={colors.primary} />
              <Text style={styles.bannerText}>Map view is unavailable right now. Showing nearby vets as a list.</Text>
            </View>
          ) : null}
          {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}
          {!loading && error ? <ErrorCard message={error} onRetry={request} /> : null}
          {!loading && !error && !sortedVets.length ? (
            <EmptyState
              emoji="📍"
              title="No vets nearby"
              subtitle="Try again, or browse all vets from Search."
              ctaLabel="Retry"
              onCta={request}
            />
          ) : null}
          {sortedVets.map((vet) => (
            <VetCard key={vet.id} vet={vet} onPress={() => openVet(vet)} />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

function ToggleBtn({
  label,
  icon,
  active,
  onPress,
}: {
  label: string
  icon: React.ComponentProps<typeof Ionicons>['name']
  active: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={[styles.toggleBtn, active && styles.toggleBtnActive]}>
      <Ionicons name={icon} size={15} color={active ? colors.onPrimary : colors.muted} />
      <Text style={[styles.toggleText, active && styles.toggleTextActive]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 2 },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  toggleTextActive: { color: colors.onPrimary },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 18 },
  bannerAction: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  muted: { color: colors.muted },
  mapWrap: { flex: 1, overflow: 'hidden' },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: 84,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  mapFooter: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    elevation: 3,
  },
  mapFooterText: { color: colors.text, fontWeight: '600', fontSize: 13, textAlign: 'center' },
  listContent: { padding: spacing.lg, paddingBottom: 48 },
  callout: {
    width: 200,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  calloutName: { fontWeight: '800', color: colors.text, fontSize: 15 },
  calloutMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  calloutRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  calloutDist: { color: colors.text, fontSize: 12, fontWeight: '700' },
  calloutRating: { color: colors.warning, fontSize: 12, fontWeight: '700' },
  calloutLink: { color: colors.primary, fontWeight: '800', fontSize: 12, marginTop: 8 },
})
