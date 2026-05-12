'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import AppTopSection from '@/components/AppTopSection'
import BackToTopButton from '@/components/BackToTopButton'

// ─── Types ────────────────────────────────────────────────────────────────────

type OpenMode = 'auto' | 'same' | 'new'

interface NavCategory {
  id: string
  name: string
  slug: string
  sort_order: number
  display_limit: number
}

interface NavLink {
  id: string
  category_id: string
  title: string
  url: string
  description: string | null
  open_mode: OpenMode
  sort_order: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OPENAA_HOSTS = ['openaa.com', 'app.openaa.com', 'www.openaa.com']

function resolveOpenMode(url: string, mode: OpenMode): 'same' | 'new' {
  if (mode === 'same') return 'same'
  if (mode === 'new') return 'new'
  // auto
  if (url.startsWith('/') || url.startsWith('#')) return 'same'
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (OPENAA_HOSTS.some((h) => host === h || host.endsWith('.' + h))) return 'same'
  } catch {
    return 'same'
  }
  return 'new'
}

// Short display names for the category tab bar
const SLUG_SHORT_NAME: Record<string, string> = {
  featured: '热门',
  government: '政府',
  finance: '银行',
  shopping: '购物',
  telecom: '通讯',
  ai: 'AI',
  video: '视频',
  social: '社交',
  life: '生活',
  other: '其它',
}

// ─── LinkCard ─────────────────────────────────────────────────────────────────

function LinkCard({ link }: { link: NavLink }) {
  const target = resolveOpenMode(link.url, link.open_mode)
  const isNew = target === 'new'

  const inner = (
    <div className="flex items-center justify-between gap-2">
      <div className="text-[12.5px] font-bold text-zinc-900 truncate" title={link.title}>{link.title}</div>
      {isNew && <ExternalLink size={13} className="shrink-0 text-zinc-400" />}
    </div>
  )

  const cls =
    'group rounded-2xl px-3 py-3 bg-zinc-50 ring-1 ring-zinc-100 hover:bg-white hover:ring-zinc-200 transition block'

  if (isNew) {
    return (
      <a href={link.url} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
        {link.description ? (
          <div className="mt-1 text-[11px] text-zinc-500 line-clamp-2">{link.description}</div>
        ) : null}
      </a>
    )
  }

  return (
    <Link href={link.url} className={cls}>
      {inner}
      {link.description ? (
        <div className="mt-1 text-[11px] text-zinc-500 line-clamp-2">{link.description}</div>
      ) : null}
    </Link>
  )
}

// ─── CategorySection ──────────────────────────────────────────────────────────

function CategorySection({
  category,
  links,
  sectionRef,
}: {
  category: NavCategory
  links: NavLink[]
  sectionRef: React.RefObject<HTMLElement>
}) {
  const [expanded, setExpanded] = useState(false)
  const displayLinks = expanded ? links : links.slice(0, category.display_limit)
  const hasMore = links.length > category.display_limit

  return (
    <section ref={sectionRef} id={`section-${category.slug}`} className="scroll-mt-24">
      <div className="flex items-center justify-between px-1 mb-2">
        <h2 className="text-[14px] md:text-[15px] font-black text-zinc-900">{category.name}</h2>
        {hasMore && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-[12px] text-blue-600 hover:text-blue-700 font-medium shrink-0 ml-2"
          >
            {expanded ? '收起' : `更多 (${links.length})`}
          </button>
        )}
      </div>

      <div className="rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {displayLinks.map((link) => (
            <LinkCard key={link.id} link={link} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CategoryTabs ─────────────────────────────────────────────────────────────

const SCROLL_DISTANCE = 200

function CategoryTabs({
  categories,
  activeSlug,
  onSelect,
}: {
  categories: NavCategory[]
  activeSlug: string
  onSelect: (slug: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const tabCls = (active: boolean) =>
    `flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition ${
      active
        ? 'bg-[#1976d2] text-white border-[#1976d2]'
        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
    }`

  return (
    <div className="sticky top-14 z-40 mb-2 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-zinc-100">
      <div className="flex items-center gap-2 px-4 py-2">
        {/* "全部" is always first */}
        <button
          type="button"
          className={tabCls(activeSlug === 'all')}
          onClick={() => onSelect('all')}
        >
          全部
        </button>

        <div className="min-w-0 flex-1 relative flex items-center">
          <button
            type="button"
            onClick={() => scrollRef.current?.scrollBy({ left: -SCROLL_DISTANCE, behavior: 'smooth' })}
            className="hidden md:flex flex-shrink-0 items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-500 shadow-sm hover:bg-gray-50 transition mr-1"
            aria-label="向左滚动"
          >
            ‹
          </button>

          <div
            ref={scrollRef}
            className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            role="region"
            aria-label="分类筛选"
          >
            <div className="flex items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  className={tabCls(activeSlug === cat.slug)}
                  onClick={() => onSelect(cat.slug)}
                >
                  {SLUG_SHORT_NAME[cat.slug] ?? cat.name}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => scrollRef.current?.scrollBy({ left: SCROLL_DISTANCE, behavior: 'smooth' })}
            className="hidden md:flex flex-shrink-0 items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-500 shadow-sm hover:bg-gray-50 transition ml-1"
            aria-label="向右滚动"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NavigationPage() {
  const [categories, setCategories] = useState<NavCategory[]>([])
  const [links, setLinks] = useState<NavLink[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [activeSlug, setActiveSlug] = useState<string>('all')

  // One ref per category slug, stable across renders
  const sectionRefs = useRef<Map<string, React.RefObject<HTMLElement>>>(new Map())
  function getSectionRef(slug: string): React.RefObject<HTMLElement> {
    if (!sectionRefs.current.has(slug)) {
      sectionRefs.current.set(slug, React.createRef<HTMLElement>())
    }
    return sectionRefs.current.get(slug)!
  }

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/navigation')
        const json: unknown = await res.json()
        if (!res.ok || json === null || typeof json !== 'object') {
          setFetchError('数据加载失败，请稍后重试')
          return
        }
        const { categories: cats, links: lks } = json as {
          categories: NavCategory[]
          links: NavLink[]
        }
        setCategories(cats ?? [])
        setLinks(lks ?? [])
      } catch {
        setFetchError('数据加载失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  // Merge categories with their links; drop empty categories
  const categoriesWithLinks = categories
    .map((cat) => ({ cat, links: links.filter((l) => l.category_id === cat.id) }))
    .filter(({ links: ls }) => ls.length > 0)

  const handleSelect = useCallback((slug: string) => {
    setActiveSlug(slug)
    if (slug === 'all') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const ref = sectionRefs.current.get(slug)
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top section – keeps banner + latest ticker; layout provides Header */}
      <AppTopSection bannerPosition="navigation" />

      <div className="mx-auto w-full max-w-[860px] px-4 pt-4">
        <Link
          href="/navigation/my"
          className="block rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_10px_35px_rgba(0,0,0,0.06)] px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-[0_14px_38px_rgba(0,0,0,0.08)]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[15px] font-black text-zinc-900">我的导航</div>
              <div className="mt-1 text-[12px] text-zinc-500">
                保存自己的常用网站，下次打开更方便
              </div>
            </div>
            <div className="shrink-0 text-[13px] font-bold text-blue-600">进入 →</div>
          </div>
        </Link>
      </div>

      {/* Category tab bar */}
      {!loading && categoriesWithLinks.length > 0 && (
        <CategoryTabs
          categories={categoriesWithLinks.map(({ cat }) => cat)}
          activeSlug={activeSlug}
          onSelect={handleSelect}
        />
      )}

      <div className="mx-auto w-full max-w-[860px] px-4 pt-6 pb-16">
        {loading ? (
          <p className="text-center text-sm text-zinc-400 py-16">加载中...</p>
        ) : fetchError ? (
          <p className="text-center text-sm text-red-500 py-16">{fetchError}</p>
        ) : categoriesWithLinks.length === 0 ? (
          <p className="text-center text-sm text-zinc-400 py-16">
            导航内容正在整理中，请稍后再来。
          </p>
        ) : (
          <div className="space-y-5">
            {categoriesWithLinks.map(({ cat, links: catLinks }) => (
              <CategorySection
                key={cat.id}
                category={cat}
                links={catLinks}
                sectionRef={getSectionRef(cat.slug)}
              />
            ))}
          </div>
        )}

        {/* Bottom SEO block */}
        {!loading && categoriesWithLinks.length > 0 && (
          <div className="mt-8 rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_10px_35px_rgba(0,0,0,0.06)] p-5">
            <h3 className="text-[13px] font-black text-zinc-900">关于本页</h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-zinc-600">
              OpenAA 美国华人生活导航整理在美华人常用网站入口，包括 DMV、USCIS、IRS、银行开户、招聘求职、房屋生活、
              二手交易、AI工具和新闻资讯等，帮助用户快速找到可靠资源。
            </p>
          </div>
        )}
      </div>
      <BackToTopButton />
    </div>
  )
}
