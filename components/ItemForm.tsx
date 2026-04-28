'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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

function parseLocationFromDescription(description: string): SecondhandLocation {
  const lines = (description || '').split('\n')
  for (const line of lines) {
    const m = line.match(/^所在地区[:：]\s*(.+)\s*$/)
    const v = m?.[1]?.trim()
    if (v && (SECONDHAND_LOCATIONS as readonly string[]).includes(v)) return v as SecondhandLocation
  }
  return '其它地区'
}

function parseBudget(description: string): string {
  const lines = (description || '').split('\n')
  for (const line of lines) {
    const m = line.match(/^预算范围[:：]\s*(.+)\s*$/)
    if (m && m[1]) return m[1].trim()
  }
  return ''
}

function parseContact(description: string): string {
  const lines = (description || '').split('\n')
  for (const line of lines) {
    const m = line.match(/^联系方式[:：]\s*(.+)\s*$/)
    if (m && m[1]) return m[1].trim()
  }
  return ''
}

function stripMetaLines(description: string) {
  // Remove formatted meta lines (location/budget/contact) and headings to prefill textarea cleanly
  const lines = (description || '').split('\n')
  const filtered = lines.filter((l) => {
    const line = l.trim()
    if (!line) return true
    if (line === '【求购信息】') return false
    if (line.startsWith('求购物品：')) return false
    if (line.startsWith('所在地区：') || line.startsWith('所在地区:')) return false
    if (line.startsWith('预算范围：') || line.startsWith('预算范围:')) return false
    if (line.startsWith('联系方式：') || line.startsWith('联系方式:')) return false
    return true
  })
  return filtered.join('\n').trim()
}

function formatBuyingDescription(input: BuyingFormData) {
  const lines: string[] = []
  lines.push('【求购信息】')

  if (input.want.trim()) lines.push(`求购物品：${input.want.trim()}`)
  if (input.location) lines.push(`所在地区：${input.location}`)
  if (input.budget.trim()) lines.push(`预算范围：${input.budget.trim()}`)
  if (input.contact.trim()) lines.push(`联系方式：${input.contact.trim()}`)

  lines.push('')
  lines.push(input.description.trim())

  return lines.join('\n')
}

function formatSellingDescription(location: SecondhandLocation, description: string) {
  const lines: string[] = []
  if (location) lines.push(`所在地区：${location}`)
  lines.push('')
  lines.push(description.trim())
  return lines.join('\n').trim()
}

export default function ItemForm({ initialType, editItem }: Props) {
  const router = useRouter()

  const defaultType: SecondhandItemType = useMemo(() => {
    if (editItem?.type) return editItem.type
    return initialType === 'buying' ? 'buying' : 'selling'
  }, [initialType, editItem?.type])

  const [mode, setMode] = useState<SecondhandItemType>(defaultType)

  const isEdit = !!editItem
  const initialLocation = editItem ? parseLocationFromDescription(editItem.description) : '其它地区'

  const [selling, setSelling] = useState<SellingFormData>(() => ({
    title: editItem?.type !== 'buying' ? editItem?.title || '' : '',
    category: editItem?.type !== 'buying' ? (editItem?.category || pickDefaultCategory()) : pickDefaultCategory(),
    price: editItem?.type !== 'buying' ? String(editItem?.price ?? '') : '',
    description: editItem?.type !== 'buying' ? stripMetaLines(editItem?.description || '') : '',
    location: initialLocation,
  }))

  const [buying, setBuying] = useState<BuyingFormData>(() => ({
    want: editItem?.type === 'buying' ? (editItem?.title || '') : '',
    budget: editItem?.type === 'buying' ? parseBudget(editItem?.description || '') : '',
    contact: editItem?.type === 'buying' ? parseContact(editItem?.description || '') : '',
    description: editItem?.type === 'buying' ? stripMetaLines(editItem?.description || '') : '',
    location: initialLocation,
  }))

  // Multi-image upload (0–3 images)
  const MAX_IMAGES = 3
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(() => editItem?.images || [])
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [imageCountError, setImageCountError] = useState('')

  // Track all created object URLs so we can revoke them on unmount
  const createdObjectUrls = useRef<string[]>([])
  useEffect(() => {
    return () => {
      createdObjectUrls.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

    // 1) Upload new images to post-images bucket under secondhand/
    const uploadedUrls: string[] = []
    const ts = Date.now()
    for (let i = 0; i < newImageFiles.length; i++) {
      const file = newImageFiles[i]
      const ext = getFileExtFromType(file.type)
      const filePath = `secondhand/${user.id}/${ts}_${i}_${Math.random().toString(36).slice(2)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || undefined,
        })

      if (uploadError) {
        setError(`图片上传失败：${uploadError.message}`)
        setLoading(false)
        return
      }

      const { data: publicData } = supabase.storage.from('post-images').getPublicUrl(filePath)
      uploadedUrls.push(publicData?.publicUrl || '')
    }

    const images = isEdit
      ? [...existingImageUrls, ...uploadedUrls]
      : uploadedUrls

    const title =
      mode === 'buying' ? buying.want.trim() || '求购' : selling.title.trim() || '二手商品'

    const category = mode === 'buying' ? pickDefaultCategory() : selling.category?.trim() || pickDefaultCategory()

    const price = mode === 'buying' ? 0 : safeNumber(selling.price)

    const description =
      mode === 'buying'
        ? formatBuyingDescription(buying)
        : formatSellingDescription(selling.location, selling.description)

    const payload = {
      type: mode,
      title,
      description,
      price,
      category,
      images,
      status: 'published' as const,
    }

    if (isEdit && editItem) {
      const { data: updated, error: updateError } = await supabase
        .from('secondhand_items')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', editItem.id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError || !updated) {
        setError('保存失败：未找到记录或无权限')
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
        {isEdit && (
          <p className="mt-2 text-xs text-gray-400">编辑模式下不支持切换类型（出售/求购）。</p>
        )}
      </div>

      {/* Location select (both modes) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">所在地区</label>
        <select
          value={locationValue}
          onChange={(e) => {
            const val = e.target.value as SecondhandLocation
            if (mode === 'buying') setBuying((p) => ({ ...p, location: val }))
            else setSelling((p) => ({ ...p, location: val }))
          }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
        >
          {SECONDHAND_LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      {/* Multi-image upload (0–3 images) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          图片（可选，最多 {MAX_IMAGES} 张）
        </label>

        {/* Thumbnail previews */}
        {(existingImageUrls.length > 0 || newImageFiles.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-2">
            {existingImageUrls.map((url, i) => (
              <div key={`existing-${i}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`图片${i + 1}`} className="h-24 w-24 object-cover rounded-lg border" />
                <button
                  type="button"
                  onClick={() => setExistingImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -top-1 -right-1 bg-white text-gray-600 rounded-full border shadow text-xs w-5 h-5 flex items-center justify-center hover:bg-red-50"
                  aria-label="删除图片"
                >
                  ✕
                </button>
              </div>
            ))}
            {newImagePreviews.map((preview, i) => (
              <div key={`new-${i}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt={`图片${existingImageUrls.length + i + 1}`} className="h-24 w-24 object-cover rounded-lg border" />
                <button
                  type="button"
                  onClick={() => {
                    setNewImageFiles((prev) => prev.filter((_, idx) => idx !== i))
                    setNewImagePreviews((prev) => {
                      URL.revokeObjectURL(prev[i])
                      return prev.filter((_, idx) => idx !== i)
                    })
                    setImageCountError('')
                  }}
                  className="absolute -top-1 -right-1 bg-white text-gray-600 rounded-full border shadow text-xs w-5 h-5 flex items-center justify-center hover:bg-red-50"
                  aria-label="删除图片"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* File picker – only shown when under the limit */}
        {existingImageUrls.length + newImageFiles.length < MAX_IMAGES && (
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files: File[] = Array.from(e.target.files || [])
              const total = existingImageUrls.length + newImageFiles.length + files.length
              if (total > MAX_IMAGES) {
                setImageCountError(`最多只能上传 ${MAX_IMAGES} 张图片`)
                e.target.value = ''
                return
              }
              setImageCountError('')
              const previews = files.map((f) => URL.createObjectURL(f))
              createdObjectUrls.current.push(...previews)
              setNewImageFiles((prev) => [...prev, ...files])
              setNewImagePreviews((prev) => [...prev, ...previews])
              e.target.value = ''
            }}
            className="w-full text-sm text-gray-600"
          />
        )}

        {imageCountError && (
          <p className="mt-1 text-xs text-red-500">{imageCountError}</p>
        )}
      </div>

      {mode === 'selling' ? (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商品标题</label>
            <input
              type="text"
              value={selling.title}
              onChange={(e) => setSelling((p) => ({ ...p, title: e.target.value }))}
              placeholder="例：iPad Pro 11 寸"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">商品分类</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">价格 (USD)</label>
            <input
              type="number"
              value={selling.price}
              onChange={(e) => setSelling((p) => ({ ...p, price: e.target.value }))}
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">信息内容 *</label>
            <textarea
              value={selling.description}
              onChange={(e) => setSelling((p) => ({ ...p, description: e.target.value }))}
              required
              rows={5}
              placeholder="请描述商品的品牌、型号、成色、交易方式等"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1976d2] text-white py-3 rounded-lg font-medium hover:bg-[#1565c0] transition disabled:opacity-50"
          >
            {loading ? '保存中...' : (isEdit ? '保存修改' : '发布商品')}
          </button>
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">求购物品</label>
            <input
              type="text"
              value={buying.want}
              onChange={(e) => setBuying((p) => ({ ...p, want: e.target.value }))}
              placeholder="例：二手自行车"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">预算范围</label>
            <input
              type="text"
              value={buying.budget}
              onChange={(e) => setBuying((p) => ({ ...p, budget: e.target.value }))}
              placeholder="例：$100 - $200"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">联系方式</label>
            <input
              type="text"
              value={buying.contact}
              onChange={(e) => setBuying((p) => ({ ...p, contact: e.target.value }))}
              placeholder="例：微信 / 电话 / 邮箱"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">信息内容 *</label>
            <textarea
              value={buying.description}
              onChange={(e) => setBuying((p) => ({ ...p, description: e.target.value }))}
              required
              rows={5}
              placeholder="请描述需求、期望成色、交易方式等"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1976d2] focus:border-transparent resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1976d2] text-white py-3 rounded-lg font-medium hover:bg-[#1565c0] transition disabled:opacity-50"
          >
            {loading ? '保存中...' : (isEdit ? '保存修改' : '发布求购')}
          </button>
        </>
      )}
    </form>
  )
}
