'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AppTopSection from '@/components/AppTopSection'
import type { HousingPost, HousingPostType } from '@/types'

const TABS: Array<{ key: HousingPostType; label: string }> = [
  { key: 'renting', label: '房屋出租' },
  { key: 'seeking', label: '求租信息' },
]

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return s
  }
}

function typeLabel(t?: string) {
  return t === 'seeking' ? '求租' : '出租'
}

function typeBadgeClass(t?: string) {
  return t === 'seeking'
    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
    : 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
}

function displayPrice(p: number) {
  const price = Number(p || 0)
  if (!Number.isFinite(price) || price <= 0) return '租金面议'
  return `$${price}`
}

export default function HousingPage() {
  const [activeTab, setActiveTab] = useState<HousingPostType>('renting')
  const [posts, setPosts] = useState<HousingPost[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchPosts = useCallback(async () => {
    setLoading(true)

    const baseQuery = supabase
      .from('housing_posts')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(50)

    let query = baseQuery
    query = query.eq('type', activeTab)

    const { data, error } = await query
    if (!error) {
      setPosts(data || [])
      setLoading(false)
      return
    }

    // Fallback: ignore type filter (for older DB / env without the column)
    const { data: fallbackData } = await baseQuery
    setPosts(fallbackData || [])
    setLoading(false)
  }, [activeTab])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return posts

    return posts.filter((p) => {
      const hay = `${p.title || ''} ${p.description || ''} ${p.location || ''} ${p.room_type || ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [posts, search])

  const pageTitle = activeTab === 'renting' ? '房屋出租' : '求租信息'
  const publishLabel = activeTab === 'renting' ? '发布出租' : '发布求租'

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppTopSection bannerPosition="housing" />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <Link
            href={`/housing/publish?type=${activeTab}`}
            className="bg-[#1976d2] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1565c0] transition"
          >
            + {publishLabel}
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="inline-flex rounded-xl bg-gray-100 p-1">
            {TABS.map((t) => {
              const isActive = t.key === activeTab
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={
                    isActive
                      ? 'px-4 py-2 text-sm font-semibold rounded-lg bg-white text-gray-900 shadow-sm'
                      : 'px-4 py-2 text-sm font-semibold rounded-lg text-gray-600 hover:text-gray-900'
                  }
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === 'renting' ? '搜索出租信息...' : '搜索求租信息...'}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20 text-gray-500">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <div className="text-4xl mb-3">🏠</div>
            <p className="text-gray-700 font-medium">暂无房屋信息</p>
            <Link
              href={`/housing/publish?type=${activeTab}`}
              className="inline-flex mt-4 bg-[#1976d2] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1565c0] transition"
            >
              去发布
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((p) => (
              <Link
                key={p.id}
                href="#"
                className="block rounded-2xl border border-gray-100 bg-white shadow-sm p-4 hover:bg-zinc-50 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 truncate max-w-[260px] sm:max-w-[520px]">
                        {p.title || (p.type === 'seeking' ? '求租' : '房屋出租')}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${typeBadgeClass(p.type)}`}>
                        {typeLabel(p.type)}
                      </span>
                      {p.room_type ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-50 text-zinc-600 ring-1 ring-zinc-100">
                          {p.room_type}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                      <span>💰 {displayPrice(p.price)}</span>
                      {p.location ? <span>📍 {p.location}</span> : null}
                      <span>🕒 {formatDate(p.created_at)}</span>
                    </div>

                    {p.description ? (
                      <p className="mt-3 text-sm text-gray-600 line-clamp-2 whitespace-pre-wrap">
                        {p.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
