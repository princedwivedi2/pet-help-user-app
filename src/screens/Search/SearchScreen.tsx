import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import VetCard from '../../components/VetCard'
import { useNavigation } from '@react-navigation/native'
import { getVets } from '../../services'
import { colors, radius, spacing } from '../../theme'
import { normalizeVet, pickArray } from '../../utils/backendAdapters'

type FilterKey = 'emergency' | 'available' | 'rating' | 'homeVisit' | 'online'

const FILTERS: { key: FilterKey; label: string; param: string }[] = [
  { key: 'emergency', label: 'Emergency', param: 'emergency_only=true' },
  { key: 'available', label: 'Available now', param: 'available_only=true' },
  { key: 'rating', label: 'Rating 4.5+', param: 'min_rating=4.5' },
  { key: 'homeVisit', label: 'Home visit', param: 'home_visit_available=true' },
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
      } catch {
        setError('Unable to load vets right now.')
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
        <Text style={styles.sectionMeta}>{loading ? 'Loading…' : `${data.length} vets`}</Text>
      </View>

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : null}

      {!loading && error ? (
        <View style={styles.errorBlock}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => setQuery(q => q)} style={styles.retryBtn}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && !error && !data.length ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>{activeFilters.size > 0 || query ? 'No vets match your filters' : 'No vets found'}</Text>
          <Text style={styles.emptyMeta}>{activeFilters.size > 0 ? 'Try removing some filters.' : 'Check your connection and try again.'}</Text>
        </View>
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
  content: { padding: spacing.lg, paddingBottom: 44 },
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
  chipTextActive: { color: '#fff7f1' },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  sectionMeta: { color: colors.muted },
  resultCard: { marginBottom: spacing.sm },
  errorBlock: { marginTop: spacing.sm },
  error: { color: colors.danger },
  retryBtn: { marginTop: spacing.sm, alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border },
  retryText: { color: colors.text, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  emptyMeta: { color: colors.muted, marginTop: 6 },
})
