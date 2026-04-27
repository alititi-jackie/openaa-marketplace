'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SECONDHAND_CATEGORIES } from '@/lib/constants'
import type { SecondhandItemType, SecondhandItem } from '@/types'

const SECONDHAND_LOCATIONS = [
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

type SecondhandLocation = (typeof SECONDHAND_LOCATIONS)[number]

interface Props {
  initialType?: SecondhandItemType
  editItem?: SecondhandItem | null
}

interface SellingFormData {
  title: string
  category: string
  price: string
  description: string
  location: SecondhandLocation
}

interface BuyingFormData {
  want: string
  budget: string
  contact: string
  description: string
  location: SecondhandLocation
}

function pickDefaultCategory() {
  return SECONDHAND_CATEGORIES.includes('其他') ? '其他' : SECONDHAND_CATEGORIES[0]
}

function safeNumber(s: string) {
  const n = parseFloat(s)
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

export default function ItemForm({ initialType, editItem }: Props) {
  const router = useRouter()

  const isEdit = Boolean(editItem)

  const [mode, setMode] = useState<SecondhandItemType>(() => {
    if (editItem?.type) return editItem.type
    return initialType || 'selling'
  })

  // Selling
  const [selling, setSelling] = useState<SellingFormData>(() => {
    return {
      title: editItem?.title || '',
      category: editItem?.category || pickDefaultCategory(),
      price: editItem?.price ? String(editItem.price) : '',
      description: '',
      location: '其它地区',
    }
  })

  // Buying
  const [buying, setBuying] = useState<BuyingFormData>(() => {
    return {
      want: editItem?.title || '',
      budget: '',
      contact: '',
      description: '',
      location: '其它地区',
    }
  })

  // Images: optional 0-3 images
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Initialize previews for edit mode (existing images)
  useEffect(() => {
    const existing = (editItem?.images || []).filter((u) => typeof u === 'string' && u.trim())
    if (existing.length > 0) {
      setImagePreviewUrls(existing.slice(0, 3))
    }
  }, [editItem?.images])

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

  function formatSellingDescription(location: SecondhandLocation, desc: string) {
    const lines: string[] = []
    if (location) lines.push(`地区：${location}`)
    if (desc) lines.push(`内容：${desc.trim()}`)
    return lines.join('\n')
  }

  function formatBuyingDescription(b: BuyingFormData) {
    const lines: string[] = []
    if (b.location) lines.push(`地区：${b.location}`)
    if (b.budget) lines.push(`预算范围：${b.budget.trim()}`)
    if (b.contact) lines.push(`联系方式：${b.contact.trim()}`)
    if (b.description) lines.push(`需求描述：${b.description.trim()}`)
    return lines.join('\n')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const content = mode === 'buying' ? buying.description.trim() : selling.description.trim()
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

    const title = mode === 'buying' ? buying.want.trim() || '求购' : selling.title.trim() || '二手商品'

    const category =
      mode === 'buying'
        ? pickDefaultCategory()
        : selling.category?.trim() || pickDefaultCategory()

    const price = mode === 'buying' ? 0 : safeNumber(selling.price)

    const description =
      mode === 'buying'
        ? formatBuyingDescription(buying)
        : formatSellingDescription(selling.location, selling.description)

    // If editing and no new images selected, keep existing images.
    // If new images are selected, we will overwrite with uploaded URLs.
    const shouldUpload = imageFiles.length > 0
    const baseImages = isEdit ? (editItem?.images || []) : []

    const payload = {
      type: mode,
      title,
      description,
      price,
      category,
      images: shouldUpload ? [] : baseImages,
      status: 'published' as const,
    }

    if (isEdit && editItem) {
      const { error: updateError } = await supabase
        .from('secondhand_items')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editItem.id)
        .eq('user_id', user.id)

      if (updateError) {
        setError(`保存失败：${updateError.message}`)
        setLoading(false)
        return
      }

      router.push('/profile/my-items')
      return
    }

    const { data, error } = await supabase
      .from('secondhand_items')
      .insert({
        ...payload,
        user_id: user.id,
        views: 0,
      })
      .select()
      .single()

    if (error) {
      setError(`发布失败：${error.message}`)
      setLoading(false)
      return
    }

    router.push(`/secondhand/${data.id}`)
  }

  const locationValue = mode === 'buying' ? buying.location : selling.location

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
      {error && <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">{error}</div>}

      {/* Mode selector */}
      <div>
        <div className="inline-flex rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setMode('selling')}
            disabled={isEdit}
            className={
              mode === 'selling'
                ? 'px-4 py-2 text-sm font-semibold rounded-lg bg-white text-gray-900 shadow-sm disabled:opacity-50'
                : 'px-4 py-2 text-sm font-semibold rounded-lg text-gray-600 hover:text-gray-900 disabled:opacity-50'
            }
          >
            我要出售
          </button>
          <button
            type="button"
            onClick={() => setMode('buying')}
            disabled={isEdit}
            className={
              mode === 'buying'
                ? 'px-4 py-2 text-sm font-semibold rounded-lg bg-white text-gray-900 shadow-sm disabled:opacity-50'
                : 'px-4 py-2 text-sm font-semibold rounded-lg text-gray-600 hover:text-gray-900 disabled:opacity-50'
            }
          >
            我要求购
          </button>
        </div>
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
            // allow selecting the same file again
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

      {/* Form fields */}
      {mode === 'selling' ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商品标题 *</label>
            <input
              type="text"
              value={selling.title}
              onChange={(e) => setSelling((p) => ({ ...p, title: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分类 *</label>
              <select
                value={selling.category}
                onChange={(e) => setSelling((p) => ({ ...p, category: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              >
                {SECONDHAND_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">价格 *</label>
              <input
                type="number"
                value={selling.price}
                onChange={(e) => setSelling((p) => ({ ...p, price: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">地区</label>
            <select
              value={selling.location}
              onChange={(e) => setSelling((p) => ({ ...p, location: e.target.value as SecondhandLocation }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            >
              {SECONDHAND_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">内容 *</label>
            <textarea
              value={selling.description}
              onChange={(e) => setSelling((p) => ({ ...p, description: e.target.value }))}
              required
              rows={6}
              placeholder="请描述商品新旧程度、取货方式、联系方式等..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent resize-none"
            />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">求购内容 *</label>
            <input
              type="text"
              value={buying.want}
              onChange={(e) => setBuying((p) => ({ ...p, want: e.target.value }))}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">预算范围</label>
              <input
                type="text"
                value={buying.budget}
                onChange={(e) => setBuying((p) => ({ ...p, budget: e.target.value }))}
                placeholder="例如：$50-$100"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系方式</label>
              <input
                type="text"
                value={buying.contact}
                onChange={(e) => setBuying((p) => ({ ...p, contact: e.target.value }))}
                placeholder="微信/电话"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">地区</label>
            <select
              value={buying.location}
              onChange={(e) => setBuying((p) => ({ ...p, location: e.target.value as SecondhandLocation }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            >
              {SECONDHAND_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">需求描述 *</label>
            <textarea
              value={buying.description}
              onChange={(e) => setBuying((p) => ({ ...p, description: e.target.value }))}
              required
              rows={6}
              placeholder="请描述需求、交易方式、联系方式等..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent resize-none"
            />
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1976d2] text-white py-3 rounded-lg font-medium hover:bg-[#1565c0] transition disabled:opacity-50"
      >
        {loading ? '发布中...' : isEdit ? '保存' : '发布'}
      </button>

      {/* Hidden: keep TS happy for unused var in earlier refactor */}
      <input type="hidden" value={locationValue} readOnly />
    </form>
  )
}
