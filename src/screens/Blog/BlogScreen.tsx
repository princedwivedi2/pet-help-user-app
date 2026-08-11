import React, { useCallback, useEffect, useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, shadows, spacing, typography } from '../../theme'
import ErrorCard from '../../components/ErrorCard'
import EmptyState from '../../components/EmptyState'
import { getBlogPosts, getBlogCategories, likeBlogPost } from '../../services/blog'
import { pickArray } from '../../utils/adapters'

export default function BlogScreen() {
  const nav = useNavigation<any>()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({})

  const refetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [catRes, postsRes] = await Promise.all([
        getBlogCategories(),
        getBlogPosts(selectedCategory ? `category_uuid=${selectedCategory}` : ''),
      ])
      const cats = pickArray(catRes?.data ?? catRes, ['categories', 'items'])
      const postList = pickArray(postsRes?.data ?? postsRes, ['posts', 'items'])
      setCategories(cats)
      setPosts(postList)
    } catch {
      setError('Unable to load. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory])

  useEffect(() => { refetch() }, [refetch])

  async function handleLike(uuid: string) {
    setLikedPosts(prev => ({ ...prev, [uuid]: !prev[uuid] }))
    try {
      await likeBlogPost(uuid)
    } catch {
      // revert
      setLikedPosts(prev => ({ ...prev, [uuid]: !prev[uuid] }))
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="leaf-outline" size={24} color={colors.primary} /></View>
        <View style={styles.heroCopy}><Text style={styles.title}>Care journal</Text><Text style={styles.subtitle}>Thoughtful guidance for healthier, happier pets.</Text></View>
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={styles.chipRowContent}>
        <Pressable
          style={[styles.chip, selectedCategory === null && styles.chipActive]}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={[styles.chipText, selectedCategory === null && styles.chipTextActive]}>All</Text>
        </Pressable>
        {categories.map((cat: any) => {
          const uuid = cat.uuid ?? cat.id ?? cat.slug
          const active = selectedCategory === uuid
          return (
            <Pressable
              key={uuid}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setSelectedCategory(uuid)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {cat.name ?? cat.label ?? cat.title ?? 'Category'}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {loading ? <ActivityIndicator color={colors.primary} style={styles.spinner} /> : null}
      {!loading && error ? <ErrorCard message={error} onRetry={refetch} /> : null}
      {!loading && !error && posts.length === 0 ? (
        <EmptyState
          emoji="📰"
          title="No articles yet"
          subtitle="Pet care tips are coming soon. Check back later."
        />
      ) : null}

      {!loading && !error
        ? posts.map((post: any) => {
            const uuid = post.uuid ?? post.id ?? String(Math.random())
            const liked = likedPosts[uuid] ?? post.liked ?? false
            return (
              <Pressable
                key={uuid}
                style={styles.postCard}
                onPress={() => nav.navigate('BlogPost', { postUuid: uuid, post })}
              >
                {post.category_name ? (
                  <Text style={styles.categoryLabel}>{post.category_name}</Text>
                ) : null}
                <Text style={styles.postTitle}>{post.title ?? 'Untitled'}</Text>
                {post.excerpt || post.read_time ? (
                  <Text style={styles.excerpt}>
                    {[post.excerpt, post.read_time ? `${post.read_time} min read` : null].filter(Boolean).join(' · ')}
                  </Text>
                ) : null}
                <View style={styles.likeRow}>
                  <Pressable
                    onPress={() => handleLike(uuid)}
                    hitSlop={8}
                    accessibilityLabel={liked ? 'Unlike post' : 'Like post'}
                  >
                    <Ionicons
                      name={liked ? 'heart' : 'heart-outline'}
                      size={20}
                      color={liked ? colors.danger : colors.muted}
                    />
                  </Pressable>
                  {post.likes_count != null ? (
                    <Text style={styles.likeCount}>{post.likes_count}</Text>
                  ) : null}
                  <View style={styles.readAction}><Text style={styles.readActionText}>Read article</Text><Ionicons name="arrow-forward" size={15} color={colors.primary} /></View>
                </View>
              </Pressable>
            )
          })
        : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 48 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, marginBottom: spacing.lg, borderRadius: radius.xl, backgroundColor: colors.primarySoft },
  heroIcon: { width: 52, height: 52, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  heroCopy: { flex: 1 },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.caption, color: colors.muted, marginTop: 3 },
  chipRow: { flexGrow: 0, marginBottom: spacing.md },
  chipRowContent: { gap: 8, paddingBottom: 4 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  chipTextActive: { color: colors.onPrimary },
  spinner: { marginTop: spacing.xl },
  postCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: 7,
    ...shadows.card,
  },
  categoryLabel: { fontSize: 10, color: colors.primary, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  postTitle: { ...typography.h3, color: colors.text },
  excerpt: { ...typography.caption, color: colors.muted },
  likeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  likeCount: { fontSize: 12, color: colors.muted },
  readAction: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 },
  readActionText: { ...typography.caption, color: colors.primary, fontWeight: '800' },
})
