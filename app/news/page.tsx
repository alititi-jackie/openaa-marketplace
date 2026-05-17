import NewsListClient from './NewsListClient'
import { NEWS_PAGE_SIZE, normalizeNewsFilterCategory } from '@/lib/news'
import { fetchPublishedNewsPosts } from '@/lib/newsPosts'
import { getPublicSupabaseServerClient } from '@/lib/serverSupabase'

export const dynamic = 'force-dynamic'

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>
}) {
  const params = await searchParams
  const rawCategory = Array.isArray(params.category) ? params.category[0] : params.category
  const category = normalizeNewsFilterCategory(rawCategory ?? null)
  const supabase = getPublicSupabaseServerClient()
  const initialPosts = supabase
    ? await fetchPublishedNewsPosts(supabase, {
        category: category === '全部' ? undefined : category,
        limit: NEWS_PAGE_SIZE,
      })
    : []

  return (
    <NewsListClient initialPosts={initialPosts} initialCategory={category} />
  )
}
