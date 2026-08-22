import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, shadows, spacing, typography } from '../../theme'
import ErrorCard from '../../components/ErrorCard'
import PageHeader from '../../components/PageHeader'
import { getBlogPost, likeBlogPost } from '../../services/blog'

export default function BlogPostScreen() {
  const route = useRoute<any>()
  const { postUuid, post: routePost } = (route.params ?? {}) as any

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<any>(routePost ?? null)
  const [liked, setLiked] = useState<boolean>(routePost?.liked ?? false)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await getBlogPost(postUuid)
      const post: any = res?.data ?? res
      setData(post)
      setLiked(post?.liked ?? false)
    } catch {
      setError('Unable to load. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [postUuid])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function handleLike() {
    setLiked(prev => !prev)
    try {
      await likeBlogPost(postUuid)
    } catch {
      setLiked(prev => !prev)
    }
  }

  const title = data?.title ?? routePost?.title ?? ''

  return (
    <View style={styles.screen}>
      <View style={styles.header}><PageHeader title="Care journal" subtitle="Practical guidance from the Respaw community" rightIcon={liked ? 'heart' : 'heart-outline'} rightLabel={liked ? 'Unlike article' : 'Like article'} onRightPress={handleLike} /></View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Optimistic title always shown */}
        {title ? <Text style={styles.postTitle}>{title}</Text> : null}

        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            size="large"
            style={styles.spinner}
            accessibilityLabel="Loading"
          />
        ) : null}

        {!loading && error ? (
          <ErrorCard message={error} onRetry={refetch} />
        ) : null}

        {!loading && !error && data ? (
          <>
            {data.category_name ? (
              <Text style={styles.categoryLabel}>{String(data.category_name).toUpperCase()}</Text>
            ) : null}
            {!title ? (
              <Text style={styles.postTitle}>{data.title ?? 'Untitled'}</Text>
            ) : null}
            {data.author || data.read_time ? (
              <Text style={styles.meta}>
                {[data.author, data.read_time ? `${data.read_time} min read` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            ) : null}
            {data.body ? (
              <Text style={styles.body}>{data.body}</Text>
            ) : data.content ? (
              <Text style={styles.body}>{data.content}</Text>
            ) : null}
            {/* Bottom like row */}
            <View style={styles.likeRow}>
              <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={20}
                color={liked ? colors.danger : colors.muted}
              />
              {data.likes_count != null ? (
                <Text style={styles.likeCount}>{data.likes_count}</Text>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 48,
    maxWidth: 720,
  },
  categoryLabel: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  postTitle: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  meta: {
    ...typography.caption,
    color: colors.muted,
    marginBottom: spacing.xl,
  },
  body: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 27,
    marginBottom: spacing.md,
  },
  spinner: { marginTop: spacing.xl },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  likeCount: { fontSize: 14, color: colors.muted },
})
