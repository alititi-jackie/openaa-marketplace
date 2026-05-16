'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import AppTopSection from '@/components/AppTopSection'
import HorizontalCategoryTabs from '@/components/HorizontalCategoryTabs'
import NewsCover from '@/components/NewsCover'
import OpenAAAttractCard from '@/components/OpenAAAttractCard'
import BackToTopButton from '@/components/BackToTopButton'
import { fetchPublishedNewsPosts } from '@/lib/newsPosts'
import { supabase } from '@/lib/supabase'
import { NEWS_FILTER_CATEGORIES, NEWS_PAGE_SIZE, normalizeNewsFilterCategory } from '@/lib/news'
import type { NewsPost } from '@/types'

function formatDate(value: string | null) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return value
  }
}

function toSortableTime(value: string | null | undefined): number {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

function isEffectivePinned(post: NewsPost, nowTime: number): boolean {
  if (!post.is_pinned) return false
  if (!post.is_published) return false
  if (!post.pinned_until) return true
  return toSortableTime(post.pinned_until) > nowTime
}

export default function NewsListClient() {
  const searchParams = useSearchParams()
  const [posts, setPosts] = useState<NewsPost[]>([])
  const [loading, setLoading] = useState(true)
  const category = normalizeNewsFilterCategory(searchParams.get('category'))

  const fetchPosts = useCallback(async (currentCategory: string) => {
    setLoading(true)
    const merged = await fetchPublishedNewsPosts(supabase, {
      category: currentCategory === '全部' ? undefined : currentCategory,
      limit: NEWS_PAGE_SIZE,
    })
    setPosts(merged)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPosts(category)
  }, [category, fetchPosts])

  const featured = posts[0]
  const normalList = useMemo(() => posts.slice(1), [posts])
  const nowTime = Date.now()

  return (
    <div className="min-h-screen bg-white pb-24">
      <AppTopSection bannerPosition="news" showQuickGrid={false} />

      <div className="px-4 pt-5 pb-3">
        <h1 className="text-xl font-black text-gray-900">新闻资讯</h1>
        <p className="mt-1 text-sm text-gray-500">
          美国华人生活资讯、平台公告、新手指南与实用教程
        </p>
      </div>

      <HorizontalCategoryTabs
        categories={NEWS_FILTER_CATEGORIES}
        activeCategory={category}
        getHref={(cat) => (cat === '全部' ? '/news' : `/news?category=${encodeURIComponent(cat)}`)}
      />

      <div className="px-4 pt-2 space-y-4">
        {loading ? (
          <div className="py-16 text-center text-sm text-gray-400">加载中...</div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 py-14 text-center">
            <p className="text-base font-semibold text-zinc-700">暂无新闻资讯</p>
            <p className="mt-2 text-sm text-zinc-500">更多内容正在整理中，请稍后查看。</p>
          </div>
        ) : (
          <>
            {featured ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-zinc-800">推荐文章</p>
                <Link
                  href={`/news/${featured.slug}`}
                  className="block overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm"
                >
                  <NewsCover
                    src={featured.cover_image_url}
                    alt={featured.title}
                    className="h-44 w-full"
                  />
                  <div className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-medium text-blue-600">{featured.category}</p>
                      {isEffectivePinned(featured, nowTime) ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-100">
                          置顶
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mt-1 text-lg font-bold text-zinc-900 line-clamp-2">{featured.title}</h2>
                    {featured.summary ? (
                      <p className="mt-2 text-sm text-zinc-600 line-clamp-2">{featured.summary}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-zinc-400">{formatDate(featured.published_at)}</p>
                  </div>
                </Link>
              </div>
            ) : null}

            <div className="space-y-3">
              {normalList.map((post) => (
                <Link
                  key={post.id}
                  href={`/news/${post.slug}`}
                  className="flex gap-3 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm"
                >
                  <NewsCover
                    src={post.cover_image_url}
                    alt={post.title}
                    className="h-24 w-28 flex-shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-medium text-blue-600">{post.category}</p>
                      {isEffectivePinned(post, nowTime) ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 border border-amber-100">
                          置顶
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-1 text-sm font-semibold text-zinc-900 line-clamp-2">{post.title}</h3>
                    {post.summary ? (
                      <p className="mt-1 text-xs text-zinc-600 line-clamp-2">{post.summary}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-zinc-400">{formatDate(post.published_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        <OpenAAAttractCard />
      </div>
      <BackToTopButton />
    </div>
  )
}
