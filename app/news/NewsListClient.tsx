'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import AppTopSection from '@/components/AppTopSection'
import HorizontalCategoryTabs from '@/components/HorizontalCategoryTabs'
import NewsCover from '@/components/NewsCover'
import OpenAAAttractCard from '@/components/OpenAAAttractCard'
import BackToTopButton from '@/components/BackToTopButton'
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

export default function NewsListClient() {
  const searchParams = useSearchParams()
  const [posts, setPosts] = useState<NewsPost[]>([])
  const [loading, setLoading] = useState(true)
  const category = normalizeNewsFilterCategory(searchParams.get('category'))

  const fetchPosts = useCallback(async (currentCategory: string) => {
    setLoading(true)
    let query = supabase
      .from('news_posts')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(NEWS_PAGE_SIZE)

    if (currentCategory !== '全部') {
      query = query.eq('category', currentCategory)
    }

    const { data } = await query
    setPosts((data as NewsPost[] | null) || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPosts(category)
  }, [category, fetchPosts])

  const featured = posts[0]
  const normalList = useMemo(() => posts.slice(1), [posts])

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
                    <p className="text-xs font-medium text-blue-600">{featured.category}</p>
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
                    <p className="text-xs font-medium text-blue-600">{post.category}</p>
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
