export const AD_SLUG_REGEX = /^[a-z0-9-]+$/

export const AD_INTERNAL_SLUG_ERROR = '内部广告必须填写有效 slug，只能使用小写字母、数字和短横线。'
export const AD_EXTERNAL_URL_ERROR = '外部广告必须填写有效链接地址'
export const AD_IMAGE_REQUIRED_ERROR = '请上传广告图片或填写外部图片链接。'
export const AD_SLUG_DUPLICATE_ERROR = '这个广告 slug 已存在，请换一个。'
export const AD_LINK_MODE_CONFLICT_ERROR = '广告打开方式配置冲突，请重新选择内部广告或外部链接。'

export type AdLinkType = 'internal' | 'external'
export type AdOpenMode = 'internal' | 'external_new' | 'external_same'

export interface AdValidationInput {
  image_url?: string | null
  link_url?: string | null
  link_type?: string | null
  external_url?: string | null
  slug?: string | null
  content?: string | null
  contact_name?: string | null
  phone?: string | null
  wechat?: string | null
  open_mode?: string | null
  position?: string | null
  is_active?: boolean
  start_date?: string | null
  end_date?: string | null
}

export interface NormalizedAdPayload {
  image_url: string
  link_url: string
  link_type: AdLinkType
  external_url: string | null
  slug: string | null
  content: string | null
  contact_name: string | null
  phone: string | null
  wechat: string | null
  open_mode: AdOpenMode
  position: string
  is_active: boolean
  start_date: string | null
  end_date: string | null
}

function toNullableTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return normalized || null
}

function normalizeLinkType(value: unknown): AdLinkType | null {
  return value === 'internal' || value === 'external' ? value : null
}

function normalizeOpenMode(value: unknown): AdOpenMode | null {
  return value === 'internal' || value === 'external_new' || value === 'external_same' ? value : null
}

export function normalizeAdSlug(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim().toLowerCase()
}

export function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function isValidAdSlug(slug: string): boolean {
  return AD_SLUG_REGEX.test(slug)
}

export function normalizeAndValidateAdInput(input: AdValidationInput): { data?: NormalizedAdPayload, error?: string } {
  const imageUrl = toNullableTrimmedString(input.image_url)
  if (!imageUrl) {
    return { error: AD_IMAGE_REQUIRED_ERROR }
  }

  if (!isHttpUrl(imageUrl)) {
    return { error: '图片链接必须以 http:// 或 https:// 开头' }
  }

  const rawLinkType = input.link_type
  const rawOpenMode = input.open_mode
  const linkType = rawLinkType == null ? null : normalizeLinkType(rawLinkType)
  const openMode = rawOpenMode == null ? null : normalizeOpenMode(rawOpenMode)

  if (rawLinkType != null && !linkType) {
    return { error: AD_LINK_MODE_CONFLICT_ERROR }
  }

  if (rawOpenMode != null && !openMode) {
    return { error: AD_LINK_MODE_CONFLICT_ERROR }
  }

  const wantsInternal = linkType === 'internal' || openMode === 'internal'
  const wantsExternal = linkType === 'external'
    || openMode === 'external_new'
    || openMode === 'external_same'

  if (wantsInternal && wantsExternal) {
    return { error: AD_LINK_MODE_CONFLICT_ERROR }
  }

  const position = toNullableTrimmedString(input.position) || ''
  const content = typeof input.content === 'string' ? input.content : null
  const contactName = toNullableTrimmedString(input.contact_name)
  const phone = toNullableTrimmedString(input.phone)
  const wechat = toNullableTrimmedString(input.wechat)
  const startDate = toNullableTrimmedString(input.start_date)
  const endDate = toNullableTrimmedString(input.end_date)
  const isActive = input.is_active !== false

  if (wantsInternal) {
    const slug = normalizeAdSlug(input.slug)
    if (!slug || !isValidAdSlug(slug)) {
      return { error: AD_INTERNAL_SLUG_ERROR }
    }

    return {
      data: {
        image_url: imageUrl,
        link_url: `/ads/${slug}`,
        link_type: 'internal',
        external_url: null,
        slug,
        content,
        contact_name: contactName,
        phone,
        wechat,
        open_mode: 'internal',
        position,
        is_active: isActive,
        start_date: startDate,
        end_date: endDate,
      },
    }
  }

  const externalUrl = toNullableTrimmedString(input.external_url) || toNullableTrimmedString(input.link_url)
  if (!externalUrl || !isHttpUrl(externalUrl)) {
    return { error: AD_EXTERNAL_URL_ERROR }
  }

  return {
    data: {
      image_url: imageUrl,
      link_url: externalUrl,
      link_type: 'external',
      external_url: externalUrl,
      slug: null,
      content,
      contact_name: contactName,
      phone,
      wechat,
      open_mode: openMode === 'external_same' ? 'external_same' : 'external_new',
      position,
      is_active: isActive,
      start_date: startDate,
      end_date: endDate,
    },
  }
}
