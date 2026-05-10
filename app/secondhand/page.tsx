'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AppTopSection from '@/components/AppTopSection'
import SecondhandCard from '@/components/SecondhandCard'
import BackToTopButton from '@/components/BackToTopButton'
import { SECONDHAND_CATEGORIES } from '@/lib/constants'
import RegionFilter, { ALL_REGIONS } from '@/components/RegionFilter'
import { LOCATION_OPTIONS } from '@/lib/locationOptions'
import type { SecondhandItem, SecondhandItemType } from '@/types'

/** Extract the region from a secondhand item.
 * Selling items: "所在地区：{loc}" is prepended to description.
 * Buying items: same line is embedded in the structured description.
 * Some rows may also carry a top-level `location` field.
 */
function getItemRegion(item: SecondhandItem): string {
  const withLoc = item as SecondhandItem & { location?: string | null }
  if (withLoc.location && withLoc.location.trim()) return withLoc.location.trim()
  const lines = (item.description || '').split('\n')
  for (const line of lines) {
    const m = line.match(/^所在地区[:：]\s*(.+)\s*$/)
    const v = m?.[1]?.trim()
    if (v && (LOCATION_OPTIONS as readonly string[]).includes(v)) return v
  }
  return ''
}

const TABS: Array<{ key: SecondhandItemType; label: string }> = [
  { key: 'selling', label: '出售商品' },
  { key: 'buying', label: '求购信息' },
]

function toSortableTime(value: string | null | undefined): number {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

function isEffectivePinned(item: SecondhandItem, nowTime: number): boolean {
  if (!item.is_pinned) return false
  if (item.status !== 'published') return false
  if (!item.pinned_until) return true
  return toSortableTime(item.pinned_until) > nowTime
}

export default function SecondhandPage() {
  const [activeTab, setActiveTab] = useState<SecondhandItemType>('selling')
  const [items, setItems] = useState<SecondhandItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState(ALL_REGIONS)

  const fetchItems = useCallback(async () => {
    setLoading(true)

    // Note: 'type' is a new column; some environments might not have it yet.
    // We try applying the filter, and if it errors we fall back to the old query.
    const baseQuery = supabase
      .from('secondhand_items')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(50)

    let query = baseQuery
    query = query.eq('type', activeTab)

    if (category) query = query.eq('category', category)

    const { data, error } = await query
    if (!error) {
      setItems(data || [])
      setLoading(false)
      return
    }

    // Fallback: ignore type filter (for older DB without the column)
    let fallback = baseQuery
    if (category) fallback = fallback.eq('category', category)

    const { data: fallbackData } = await fallback
    setItems(fallbackData || [])
    setLoading(false)
  }, [activeTab, category])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase()
    const nowTime = Date.now()
    return items
      .filter((item) =>
        (!search || item.title.toLowerCase().includes(searchLower)) &&
        (location === ALL_REGIONS || getItemRegion(item) === location)
      )
      .sort((a, b) => {
        const aPinned = isEffectivePinned(a, nowTime)
        const bPinned = isEffectivePinned(b, nowTime)
        if (aPinned !== bPinned) return aPinned ? -1 : 1

        if (aPinned && bPinned) {
          const pinnedOrderDiff = (a.pinned_order ?? 0) - (b.pinned_order ?? 0)
          if (pinnedOrderDiff !== 0) return pinnedOrderDiff

          const createdAtDiff = toSortableTime(b.created_at) - toSortableTime(a.created_at)
          if (createdAtDiff !== 0) return createdAtDiff
        }

        return toSortableTime(b.created_at) - toSortableTime(a.created_at)
      })
  }, [items, search, location])

  const pageTitle = activeTab === 'selling' ? '二手交易' : '求购信息'
  const publishLabel = activeTab === 'selling' ? '发布商品' : '发布求购'

  return (
    <div className="min-h-screen bg-zinc-50">
      <AppTopSection bannerPosition="secondhand" />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          <Link
            href={`/secondhand/publish?type=${activeTab}`}
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

        <div className="flex flex-wrap gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeTab === 'selling' ? '搜索商品...' : '搜索求购...'}
            className="flex-1 min-w-[12rem] border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
          >
            <option value="">全部分类</option>
            {SECONDHAND_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <RegionFilter value={location} onChange={setLocation} />
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-3">🛍️</div>
            <p>{activeTab === 'selling' ? '暂无符合条件的二手信息' : '暂无符合条件的求购信息'}</p>
            <Link
              href={`/secondhand/publish?type=${activeTab}`}
              className="text-[#1976d2] mt-2 inline-block hover:underline"
            >
              {activeTab === 'selling' ? '成为第一个发布者' : '发布第一条求购'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((item) => (
              <SecondhandCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
      <BackToTopButton />
    </div>
  )
}
