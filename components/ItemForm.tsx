'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SECONDHAND_CATEGORIES } from '@/lib/constants'
import type { SecondhandItemType } from '@/types'

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
  // secondhand_items currently has no location column in schema docs,
  // so store as a formatted line in description for compatibility.
  const lines: string[] = []
  if (location) lines.push(`所在地区：${location}`)
  lines.push('')
  lines.push(description.trim())
  return lines.join('\n').trim()
}

export default function ItemForm({ initialType }: Props) {
  const router = useRouter()

  const defaultType: SecondhandItemType = useMemo(() => {
    return initialType === 'buying' ? 'buying' : 'selling'
  }, [initialType])

  const [mode, setMode] = useState<SecondhandItemType>(defaultType)

  const [selling, setSelling] = useState<SellingFormData>({
    title: '',
    category: pickDefaultCategory(),
    price: '',
    description: '',
    location: '其它地区',
  })

  const [buying, setBuying] = useState<BuyingFormData>({
    want: '',
    budget: '',
    contact: '',
    description: '',
    location: '其它地区',
  })

  // Optional image upload
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('')

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

    // 1) Upload optional image (if provided)
    let uploadedImageUrl = ''
    if (imageFile) {
      const ext = getFileExtFromType(imageFile.type)
      const filePath = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: imageFile.type || undefined,
        })

      if (uploadError) {
        setError(`图片上传失败：${uploadError.message}`)
        setLoading(false)
        return
      }

      const { data: publicData } = supabase.storage.from('item-images').getPublicUrl(filePath)

      uploadedImageUrl = publicData?.publicUrl || ''
    }

    const images = uploadedImageUrl ? [uploadedImageUrl] : []

    const title =
      mode === 'buying'
        ? (buying.want.trim() || '求购')
        : (selling.title.trim() || '二手商品')

    const category =
      mode === 'buying'
        ? pickDefaultCategory()
        : (selling.category?.trim() || pickDefaultCategory())

    const price = mode === 'buying' ? 0 : safeNumber(selling.price)

    const description =
      mode === 'buying'
        ? formatBuyingDescription(buying)
        : formatSellingDescription(selling.location, selling.description)

    const { data, error } = await supabase
      .from('secondhand_items')
      .insert({
        user_id: user.id,
        type: mode,
        title,
        description,
        price,
        category,
        images,
        status: 'published',
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
            className={
              mode === 'selling'
                ? 'px-4 py-2 text-sm font-semibold rounded-lg bg-white text-gray-900 shadow-sm'
                : 'px-4 py-2 text-sm font-semibold rounded-lg text-gray-600 hover:text-gray-900'
            }
          >
            我要出售
          </button>
          <button
            type="button"
            onClick={() => setMode('buying')}
            className={
              mode === 'buying'
                ? 'px-4 py-2 text-sm font-semibold rounded-lg bg-white text-gray-900 shadow-sm'
                : 'px-4 py-2 text-sm font-semibold rounded-lg text-gray-600 hover:text-gray-900'
            }
          >
            我要求购
          </button>
        </div>
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

      {/* Optional image upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">图片（可选）</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0] || null
            setImageFile(f)
            setImagePreviewUrl(f ? URL.createObjectURL(f) : '')
          }}
          className="w-full text-sm text-gray-600"
        />
        {imagePreviewUrl && (
          <div className="mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreviewUrl}
              alt="preview"
              className="h-24 w-24 object-cover rounded-lg border"
            />
          </div>
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
            {loading ? '发布中...' : '发布商品'}
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
            {loading ? '发布中...' : '发布求购'}
          </button>
        </>
      )}
    </form>
  )
}
