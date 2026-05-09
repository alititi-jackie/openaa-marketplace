import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { Clock, ChevronRight } from 'lucide-react'
import type { NewsPost } from '@/types'

type HomeNewsItem = Pick<
  NewsPost,
  'id' | 'title' | 'slug' | 'category' | 'summary' | 'content' | 'published_at' | 'created_at'
>

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  return createClient(url, anonKey)
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}/${mm}/${dd}`
}

function getSummary(item: HomeNewsItem) {
  if (item.summary && item.summary.trim()) return item.summary.trim()
  const plain = item.content
    .replace(/[#*_`>\-\[\]\(\)]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!plain) return '更多内容正在整理中'
  return plain.length > 60 ? `${plain.slice(0, 60)}...` : plain
}

interface NewsUiItem {
  id: string
  slug: string
  title: string
  category: string
  time: string
  summary: string
}

async function getHomeNewsItems() {
  const supabase = getSupabaseClient()
  if (!supabase) return [] as NewsUiItem[]
  const { data, error } = await supabase
    .from('news_posts')
    .select('id, title, slug, category, summary, content, published_at, created_at')
    .eq('is_published', true)
    .eq('category', '本地新闻')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(15)

  if (error) {
    console.error('Failed to load homepage local news:', error)
    return [] as NewsUiItem[]
  }

  const rows = (data as HomeNewsItem[] | null) ?? []
  return rows
    .filter((item) => !!item.slug)
    .map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      category: item.category,
      time: formatDate(item.published_at ?? item.created_at),
      summary: getSummary(item),
    }))
}

export default async function NewsSection() {
  const newsItems = await getHomeNewsItems()
  return (
    <section className="pt-6 pb-4">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-[18px] bg-blue-500 rounded-full" />
          <h2 className="text-[15px] font-bold text-zinc-800">本地新闻</h2>
        </div>
        <Link
          href="/news"
          className="flex items-center gap-0.5 text-[12px] text-blue-500 font-medium"
        >
          更多
          <ChevronRight size={13} />
        </Link>
      </div>

      {/* News list */}
      {newsItems.length === 0 ? (
        <div className="px-4">
          <div className="rounded-2xl border border-zinc-100/70 bg-zinc-50 py-10 text-center">
            <p className="text-sm font-semibold text-zinc-700">暂无本地新闻</p>
            <p className="mt-1 text-xs text-zinc-500">更多内容正在整理中</p>
          </div>
        </div>
      ) : (
        <div className="px-4 space-y-2.5">
          {newsItems.map((item, idx) => (
            <Link
              key={item.id}
              href={`/news/${item.slug}`}
              className="flex gap-3 bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-zinc-100/70 active:scale-[0.99] transition-transform duration-150"
            >
              {/* Left: rank */}
              <div className="flex-shrink-0 w-6 flex flex-col items-center pt-0.5 gap-1.5">
                <span
                  className={`text-[12px] font-black tabular-nums ${
                    idx === 0
                      ? 'text-rose-500'
                      : idx === 1
                      ? 'text-orange-400'
                      : idx === 2
                      ? 'text-amber-400'
                      : 'text-zinc-300'
                  }`}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="w-1 h-1 rounded-full flex-shrink-0 bg-blue-400" />
              </div>

              {/* Right: content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-0.5 text-zinc-400">
                    <Clock size={10} />
                    <span className="text-[10px]">{item.time}</span>
                  </div>
                </div>
                <p className="text-[13px] font-semibold text-zinc-800 line-clamp-1 leading-snug">
                  {item.title}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
