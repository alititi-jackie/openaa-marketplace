'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { HousingPostType } from '@/types'

const HOUSING_LOCATIONS = [
  '其它地区',
  '法拉盛',
  '布鲁克林',
  '曼哈顿',
  '皇后区',
  '布朗士',
  '长岛',
  '新泽西',
  '史丹顿岛',
  '纽约上州',
  '费城',
  '波士顿',
  '洛杉矶',
  '旧金山',
  '芝加哥',
] as const

type HousingLocation = (typeof HOUSING_LOCATIONS)[number]

type PublishMode = HousingPostType

function normalizeType(v: string | null): PublishMode {
  return v === 'seeking' ? 'seeking' : 'renting'
}

function safeNumber(s: string): number {
  const n = parseFloat((s || '').trim())
  return Number.isFinite(n) ? n : 0
}

export default function HousingPublishPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialType = useMemo(() => normalizeType(searchParams.get('type')), [searchParams])

  const [mode, setMode] = useState<PublishMode>(initialType)

  // Optional fields
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState<HousingLocation>('其它地区')
  const [price, setPrice] = useState('')
  const [roomType, setRoomType] = useState('')
  const [contact, setContact] = useState('')
  const [description, setDescription] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Keep query-driven initial mode in sync on first load
  useEffect(() => {
    setMode(initialType)
  }, [initialType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const content = description.trim()
    if (!content) {
      setError('请填写信息内容')
      return
    }

    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    // Lightweight, DB-safe payload
    const payload = {
      type: mode,
      title: title.trim() || (mode === 'seeking' ? '求租' : '房屋出租'),
      description: content,
      price: safeNumber(price),
      location: location || '其它地区',
      room_type: roomType.trim() || '-',
      contact: contact.trim() || '-',
      images: [], // images optional; upload comes later
      status: 'published' as const,
      views: 0,
      user_id: user.id,
    }

    const { error: insertError } = await supabase.from('housing_posts').insert(payload)

    if (insertError) {
      setError(`发布失败：${insertError.message}`)
      setLoading(false)
      return
    }

    router.push('/housing')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">发布房屋</h1>

      {error && <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm mb-4">{error}</div>}

      {/* Mode switch */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">发布类型</label>
        <div className="inline-flex rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setMode('renting')}
            className={
              mode === 'renting'
                ? 'px-4 py-2 text-sm font-semibold rounded-lg bg-white text-gray-900 shadow-sm'
                : 'px-4 py-2 text-sm font-semibold rounded-lg text-gray-600 hover:text-gray-900'
            }
          >
            我要出租
          </button>
          <button
            type="button"
            onClick={() => setMode('seeking')}
            className={
              mode === 'seeking'
                ? 'px-4 py-2 text-sm font-semibold rounded-lg bg-white text-gray-900 shadow-sm'
                : 'px-4 py-2 text-sm font-semibold rounded-lg text-gray-600 hover:text-gray-900'
            }
          >
            我要求租
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={mode === 'seeking' ? '不填默认：求租' : '不填默认：房屋出租'}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">地区</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value as HousingLocation)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            >
              {HOUSING_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">不选默认：其它地区</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">租金 (USD)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              placeholder="不填默认：0（面议）"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">房型</label>
            <input
              type="text"
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              placeholder="例：一室一厅 / 主卧 / 次卧（可不填）"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系方式</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="微信 / 电话 / 邮箱（可不填）"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">信息内容 *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={7}
            placeholder={
              mode === 'seeking'
                ? '请描述：期望地区、预算、入住时间、人数、需求、联系方式等（可只写一段内容）'
                : '请描述：地址/区域、租金、房型、入住时间、要求、联系方式等（可只写一段内容）'
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent resize-none"
          />
          <p className="mt-2 text-xs text-gray-400">提示：图片功能后续统一优化，本次可不传图。</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#1976d2] text-white py-3 rounded-lg font-medium hover:bg-[#1565c0] transition disabled:opacity-50"
        >
          {loading ? '发布中...' : '发布'}
        </button>
      </form>
    </div>
  )
}
