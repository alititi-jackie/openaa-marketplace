'use client'

import { useMemo, useState } from 'react'
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
    category:
      editItem?.type !== 'buying'
        ? (editItem?.category || pickDefaultCategory())
        : pickDefaultCategory(),
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

  // Optional multi-image upload (0~3)
  // - imagePreviewUrls is the single source of truth for what user currently intends to keep.
  // - imageFiles only tracks newly selected local files (blob: previews) that need upload.
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>(() => {
    // Edit mode: start from existing images
    return editItem?.images?.length ? [...editItem.images].slice(0, 3) : []
  })
  const [imageTip, setImageTip] = useState('')

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

    const title = mode === 'buying' ? buying.want.trim() || '求购' : selling.title.trim() || '二手商品'

    const category = mode === 'buying' ? pickDefaultCategory() : selling.category?.trim() || pickDefaultCategory()

    const price = mode === 'buying' ? 0 : safeNumber(selling.price)

    const description =
      mode === 'buying'
        ? formatBuyingDescription(buying)
        : formatSellingDescription(selling.location, selling.description)

    const basePayload = {
      type: mode,
      title,
      description,
      price,
      category,
      // images will be determined below (keep existing / remove / overwrite with new)
      images: [] as string[],
      status: 'published' as const,
    }

    // Determine desired images on submit
    // - If user selected new files: overwrite with newly uploaded urls
    // - Else: use current previews (remote urls after deletions)
    const overwriteWithNewUploads = imageFiles.length > 0
    if (!overwriteWithNewUploads) {
      basePayload.images = imagePreviewUrls.slice(0, 3)
    }

    const uploadImagesForPost = async (postId: number) => {
      if (imageFiles.length === 0) return [] as string[]

      const ts = Date.now()
      const urls: string[] = []

      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i]
        const ext = getFileExtFromType(file.type)
        const n = i + 1
        const filePath = `secondhand/${user.id}/${postId}/${ts}-${n}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || undefined,
          })

        if (uploadError) throw uploadError

        const { data: publicData } = supabase.storage.from('post-images').getPublicUrl(filePath)
        const publicUrl = publicData?.publicUrl || ''
        if (!publicUrl) throw new Error('无法获取图片公开链接')
        urls.push(publicUrl)
      }

      return urls
    }

    try {
      if (isEdit && editItem) {
        // 1) Update base payload first (including deletions when no new selection)
        const { data: updatedBase, error: updateError } = await supabase
          .from('secondhand_items')
          .update({ ...basePayload, updated_at: new Date().toISOString() })
          .eq('id', editItem.id)
          .eq('user_id', user.id)
          .select()
          .single()

        if (updateError || !updatedBase) {
          setError('保存失败：未找到记录或无权限')
          setLoading(false)
          return
        }

        // 2) If user selected new images, upload then overwrite images
        if (overwriteWithNewUploads) {
          let urls: string[] = []
          try {
            urls = await uploadImagesForPost(editItem.id)
          } catch (err: unknown) {
            const message =
              err instanceof Error ? err.message : typeof err === 'string' ? err : '未知错误'
            setError(`图片上传失败：${message}`)
            setLoading(false)
            return
          }

          const { data: updatedImages, error: updateImagesError } = await supabase
            .from('secondhand_items')
            .update({ images: urls, updated_at: new Date().toISOString() })
            .eq('id', editItem.id)
            .eq('user_id', user.id)
            .select()
            .single()

          if (updateImagesError || !updatedImages) {
            setError('保存失败：未找到记录或无权限')
            setLoading(false)
            return
          }
        }

        router.push('/profile/my-items')
        return
      }

      // New post
      // 1) insert first with images = [] (or previews when no uploads? should be empty)
      const { data: inserted, error: insertError } = await supabase
        .from('secondhand_items')
        .insert({
          ...basePayload,
          user_id: user.id,
          views: 0,
          images: [],
        })
        .select()
        .single()

      if (insertError || !inserted) {
        setError(`发布失败：${insertError?.message || '未知错误'}`)
        setLoading(false)
        return
      }

      const postId = inserted.id as number

      // 2) upload images if selected
      if (imageFiles.length > 0) {
        let urls: string[] = []
        try {
          urls = await uploadImagesForPost(postId)
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : typeof err === 'string' ? err : '未知错误'
          setError(`图片上传失败：${message}`)
          setLoading(false)
          return
        }

        // 3) update images field (must validate by select().single())
        const { data: updatedImages, error: updateImagesError } = await supabase
          .from('secondhand_items')
          .update({ images: urls, updated_at: new Date().toISOString() })
          .eq('id', postId)
          .eq('user_id', user.id)
          .select()
          .single()

        if (updateImagesError || !updatedImages) {
          setError('保存失败：未找到记录或无权限')
          setLoading(false)
          return
        }
      }

      router.push(`/secondhand/${postId}`)
    } finally {
      setLoading(false)
    }
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
        {isEdit && <p className="mt-2 text-xs text-gray-400">编辑模式下不支持切换类型（出售/求购）。</p>}
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

      {/* Optional image upload (0~3) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">图片（可选，最多3张）</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            setImageTip('')
            const files = Array.from(e.target.files || [])
            if (files.length === 0) return

            // Merge: existing remote previews + new local selections, total <= 3
            setImageFiles((prevFiles) => {
              const mergedFiles = [...prevFiles, ...files]
              const remainingSlots = Math.max(0, 3 - imagePreviewUrls.length)
              const keptNewFiles = mergedFiles.slice(0, remainingSlots)
              if (mergedFiles.length > remainingSlots) {
                setImageTip('最多只能上传 3 张图片（包含已有图片）。已自动截断超出部分。')
              }

              // Create blob previews for the newly kept files and append to previews
              setImagePreviewUrls((prevUrls) => {
                const nextUrls = [...prevUrls, ...keptNewFiles.map((f) => URL.createObjectURL(f))]
                return nextUrls.slice(0, 3)
              })

              return keptNewFiles
            })

            // allow selecting same file again
            e.currentTarget.value = ''
          }}
          className="w-full text-sm text-gray-600"
        />

        {imageTip && <p className="mt-1 text-xs text-amber-600">{imageTip}</p>}

        {imagePreviewUrls.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {imagePreviewUrls.slice(0, 3).map((url, idx) => (
              <div key={`${url}-${idx}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`preview-${idx + 1}`} className="h-24 w-full object-cover rounded-lg border" />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreviewUrls((prev) => {
                      const toRemove = prev[idx]
                      if (toRemove?.startsWith('blob:')) URL.revokeObjectURL(toRemove)
                      return prev.filter((_, i) => i !== idx)
                    })

                    // If removing a blob preview, also remove corresponding file from imageFiles
                    setImageFiles((prevFiles) => {
                      const removedUrl = imagePreviewUrls[idx]
                      if (!removedUrl?.startsWith('blob:')) return prevFiles

                      // blob previews correspond to the newly selected files in order
                      const blobIndices = imagePreviewUrls
                        .map((u, i) => (u.startsWith('blob:') ? i : -1))
                        .filter((i) => i >= 0)
                      const blobPosition = blobIndices.indexOf(idx)
                      if (blobPosition < 0) return prevFiles
                      return prevFiles.filter((_, i) => i !== blobPosition)
                    })
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/70 text-white text-xs flex items-center justify-center"
                  aria-label="删除图片"
                >
                  ×
                </button>
              </div>
            ))}
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
            {loading ? '保存中...' : isEdit ? '保存修改' : '发布商品'}
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
            {loading ? '保存中...' : isEdit ? '保存修改' : '发布求购'}
          </button>
        </>
      )}
    </form>
  )
}
