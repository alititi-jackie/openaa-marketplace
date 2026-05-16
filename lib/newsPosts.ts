import type { SupabaseClient } from '@supabase/supabase-js'
import type { NewsPost } from '@/types'

const NEWS_POST_SELECT_FIELDS =
  'id, title, slug, category, summary, cover_image_url, content, seo_title, seo_description, is_published, published_at, created_at, updated_at, is_pinned, pinned_until, pinned_order'

type FetchPublishedNewsPostsOptions = {
  category?: string
  limit?: number
}

export async function fetchPublishedNewsPosts(
  supabase: SupabaseClient,
  options: FetchPublishedNewsPostsOptions = {}
) {
  const { category, limit = 20 } = options
  const safeLimit = Math.max(1, Math.min(limit, 30))
  const now = new Date().toISOString()

  let pinnedQuery = supabase
    .from('news_posts')
    .select(NEWS_POST_SELECT_FIELDS)
    .eq('is_published', true)
    .eq('is_pinned', true)
    .or(`pinned_until.is.null,pinned_until.gt.${now}`)
    .order('pinned_order', { ascending: true })
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(30)

  let normalQuery = supabase
    .from('news_posts')
    .select(NEWS_POST_SELECT_FIELDS)
    .eq('is_published', true)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(Math.max(30, safeLimit))

  if (category) {
    pinnedQuery = pinnedQuery.eq('category', category)
    normalQuery = normalQuery.eq('category', category)
  }

  const [
    { data: pinnedData, error: pinnedError },
    { data: normalData, error: normalError },
  ] = await Promise.all([pinnedQuery, normalQuery])

  if (pinnedError && normalError) {
    console.error('Failed to load published news posts:', pinnedError, normalError)
    return [] as NewsPost[]
  }

  const merged: NewsPost[] = []
  const seenIds = new Set<string>()

  for (const item of [...((pinnedData as NewsPost[] | null) ?? []), ...((normalData as NewsPost[] | null) ?? [])]) {
    const key = String(item.id)
    if (seenIds.has(key)) continue
    seenIds.add(key)
    merged.push(item)
    if (merged.length >= safeLimit) break
  }

  return merged.slice(0, safeLimit)
}
