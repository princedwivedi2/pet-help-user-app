import React, { useCallback, useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { colors, radius, spacing } from '../../theme'
import ErrorCard from '../../components/ErrorCard'
import { getBlogPost, likeBlogPost } from '../../services/blog'

export default function BlogPostScreen() {
  const nav = useNavigation<any>()
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
      {/* Header row */}
      <View style={styles.header}>
        <Pressable
          onPress={() => nav.goBack()}
          accessible
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Pressable
          onPress={handleLike}
          accessible
          accessibilityLabel="Like post"
          hitSlop={8}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={24}
            color={colors.danger}
          />
        </Pressable>
      </View>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 48,
  },
  categoryLabel: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  postTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 34,
    marginBottom: spacing.sm,
  },
  meta: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: spacing.md,
  },
  body: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  spinner: { marginTop: spacing.xl },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  likeCount: { fontSize: 14, color: colors.muted },
})
