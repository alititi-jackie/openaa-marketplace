'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import SecondhandCard from '@/components/SecondhandCard'
import { SECONDHAND_CATEGORIES } from '@/lib/constants'
import type { SecondhandItem } from '@/types'

export default function SecondhandPage() {
  const [items, setItems] = useState<SecondhandItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')

  const fetchItems = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('secondhand_items')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(50)

    if (category) query = query.eq('category', category)

    const { data } = await query
    setItems(data || [])
    setLoading(false)
  }, [category])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const filtered = items.filter(item =>
    !search || item.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">二手交易</h1>
        <Link
          href="/secondhand/publish"
          className="bg-[#1976d2] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1565c0] transition"
        >
          + 发布商品
        </Link>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索商品..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
        />
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
        >
          <option value="">全部分类</option>
          {SECONDHAND_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-3">🛍️</div>
          <p>暂无商品</p>
          <Link href="/secondhand/publish" className="text-[#1976d2] mt-2 inline-block hover:underline">
            成为第一个发布者
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(item => (
            <SecondhandCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
