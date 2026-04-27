'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
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

function getFileExtFromType(mimeType: string) {
  const t = (mimeType || '').toLowerCase()
  if (t.includes('png')) return 'png'
  if (t.includes('webp')) return 'webp'
  if (t.includes('gif')) return 'gif'
  return 'jpg'
}

function safeUrlFromFile(file: File) {
  try {
    return URL.createObjectURL(file)
  } catch {
    return ''
  }
}

function HousingPublishClient() {
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

  // Images: optional 0-3 images
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Keep query-driven initial mode in sync on first load
  useEffect(() => {
    setMode(initialType)
  }, [initialType])

  // Cleanup object URLs created from local File objects
  useEffect(() => {
    return () => {
      for (const url of imagePreviewUrls) {
        if (url.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(url)
          } catch {
            // ignore
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handlePickImages = (files: FileList | null) => {
    if (!files) return

    const incoming = Array.from(files).filter((f) => f && f.type?.startsWith('image/'))
    if (incoming.length === 0) return

    setError('')

    setImageFiles((prev) => {
      const next = [...prev]
      for (const f of incoming) {
        if (next.length >= 3) break
        next.push(f)
      }

      if (prev.length + incoming.length > 3) {
        setError('最多只能上传 3 张图片')
      }

      return next
    })

    setImagePreviewUrls((prev) => {
      const next = [...prev]
      for (const f of incoming) {
        if (next.length >= 3) break
        const url = safeUrlFromFile(f)
        if (url) next.push(url)
      }
      return next
    })
  }

  const removeImageAt = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx))
    setImagePreviewUrls((prev) => {
      const target = prev[idx]
      const next = prev.filter((_, i) => i !== idx)
      if (target && target.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(target)
        } catch {
          // ignore
        }
      }
      return next
    })
  }

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

    // 1) Create post row first (images optional)
    const payload = {
      type: mode,
      title: title.trim() || (mode === 'seeking' ? '求租' : '房屋出租'),
      description: content,
      price: safeNumber(price),
      location: location || '其它地区',
      room_type: roomType.trim() || '-',
      contact: contact.trim() || '-',
      images: [],
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

    // 2) Image upload + patch comes later (commit 2)
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">租金</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="不填默认：0"
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
              placeholder="例如：一室一厅/单间"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系方式</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="微信/电话"
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
        </div>

        {/* Images (optional, 0-3) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">图片（可选，最多 3 张）</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              handlePickImages(e.target.files)
              e.currentTarget.value = ''
            }}
            disabled={imagePreviewUrls.length >= 3}
            className="block w-full text-sm text-gray-600"
          />

          {imagePreviewUrls.length > 0 ? (
            <div className="mt-3 grid grid-cols-3 gap-3">
              {imagePreviewUrls.map((url, idx) => (
                <div key={`${url}-${idx}`} className="relative rounded-xl overflow-hidden ring-1 ring-zinc-200 bg-zinc-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-20 object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImageAt(idx)}
                    className="absolute top-1 right-1 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded-full"
                  >
                    移除
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-400">可不传图；支持最多 3 张，发布前可删除。</p>
          )}
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

export default function HousingPublishPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20 text-gray-500">加载中...</div>}>
      <HousingPublishClient />
    </Suspense>
  )
}
