import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import VetCard from '../../components/VetCard'
import ErrorCard from '../../components/ErrorCard'
import EmptyState from '../../components/EmptyState'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { getVets } from '../../services'
import { colors, radius, spacing } from '../../theme'
import { normalizeVet, pickArray } from '../../utils/backendAdapters'
import { parseApiError } from '../../utils/apiError'

type FilterKey = 'emergency' | 'available' | 'rating' | 'online'

const FILTERS: { key: FilterKey; label: string; param: string }[] = [
  { key: 'emergency', label: 'Emergency', param: 'emergency_only=true' },
  { key: 'available', label: 'Available now', param: 'available_only=true' },
  { key: 'rating', label: 'Rating 4.5+', param: 'min_rating=4.5' },
  { key: 'online', label: 'Online', param: 'online_available=true' },
]

export default function SearchScreen() {
  const [query, setQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [vets, setVets] = useState<any[]>([])
  const nav = useNavigation<any>()

  function toggleFilter(key: FilterKey) {
    setActiveFilters(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function clearSearch() {
    setQuery('')
    setActiveFilters(new Set())
  }

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const params: string[] = ['limit=20']
        if (query) params.push(`search=${encodeURIComponent(query)}`)
        FILTERS.forEach(f => { if (activeFilters.has(f.key)) params.push(f.param) })

        const res = await getVets(params.join('&'))
        const data = res?.data as any
        const list = pickArray(data, ['vets', 'nearby_vets', 'all_vets', 'city_vets']).map((vet, index) => normalizeVet(vet, index))
        setVets(list)
      } catch (e) {
        setError(parseApiError(e))
        setVets([])
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [query, activeFilters])

  // Client-side text filter as fallback when backend doesn't support search param
  const data = useMemo(() => {
    if (!query) return vets
    const needle = query.toLowerCase()
    return vets.filter(v =>
      v.name.toLowerCase().includes(needle) ||
      v.clinic.toLowerCase().includes(needle) ||
      v.specialization.toLowerCase().includes(needle),
    )
  }, [query, vets])

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Search vets</Text>
      <Text style={styles.subtitle}>Find nearby clinics, emergency care, and online consults.</Text>

      <View style={styles.searchBar}>
        <TextInput
          placeholder="Search vets or clinics"
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          placeholderTextColor={colors.muted}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {FILTERS.map(f => {
          const active = activeFilters.has(f.key)
          return (
            <Pressable
              key={f.key}
              onPress={() => toggleFilter(f.key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <View style={styles.resultsHeader}>
        <Text style={styles.sectionTitle}>Results</Text>
        <Pressable style={styles.mapToggle} onPress={() => nav.navigate('NearbyVets')}>
          <Ionicons name="map-outline" size={15} color={colors.primary} />
          <Text style={styles.mapToggleText}>Map</Text>
        </Pressable>
      </View>
      <Text style={styles.sectionMeta}>{loading ? 'Loading…' : `${data.length} vets`}</Text>

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : null}

      {!loading && error ? <ErrorCard message={error} onRetry={() => setQuery(q => q)} /> : null}

      {!loading && !error && !data.length ? (
        <EmptyState
          emoji="🔍"
          title="No vets found"
          subtitle="Try adjusting your search or filters."
          ctaLabel="Clear search"
          onCta={clearSearch}
        />
      ) : null}

      {data.map(vet => (
        <View key={vet.id} style={styles.resultCard}>
          <VetCard vet={vet} onPress={() => nav.navigate('VetDetail', { vetId: vet.uuid || vet.id, vet })} />
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  subtitle: { marginTop: 6, color: colors.muted, lineHeight: 20 },
  searchBar: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  searchInput: { paddingVertical: 14, color: colors.text },
  filters: { gap: 8, marginTop: spacing.md, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  chipTextActive: { color: colors.onPrimary },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mapToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapToggleText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  sectionMeta: { color: colors.muted, marginTop: spacing.xs, marginBottom: spacing.sm },
  resultCard: { marginBottom: spacing.sm },
})
