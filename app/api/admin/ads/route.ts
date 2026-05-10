import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  AD_LINK_MODE_CONFLICT_ERROR,
  AD_SLUG_DUPLICATE_ERROR,
  normalizeAndValidateAdInput,
} from '@/lib/ads'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function checkAdminToken(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token')
  return token === process.env.ADMIN_TOKEN && !!process.env.ADMIN_TOKEN
}

function sanitizeSegment(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function hasInternalSlugConflict(
  supabase: ReturnType<typeof getServiceClient>,
  slug: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('ads')
    .select('id')
    .eq('link_type', 'internal')
    .eq('slug', slug)
    .limit(1)

  if (error) throw error
  return Array.isArray(data) && data.length > 0
}

export async function GET(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const position = searchParams.get('position')

  const supabase = getServiceClient()
  let query = supabase
    .from('ads')
    .select('*')
    .order('created_at', { ascending: false })

  if (position) query = query.eq('position', position)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const supabase = getServiceClient()

  let file: File | null = null
  let image_url: string | null = null
  let link_url: string | null = null
  let link_type = 'external'
  let external_url: string | null = null
  let slug: string | null = null
  let content: string | null = null
  let contact_name: string | null = null
  let phone: string | null = null
  let wechat: string | null = null
  let open_mode = 'external_new'
  let position = ''
  let is_active = true
  let start_date: string | null = null
  let end_date: string | null = null

  const contentType = request.headers.get('content-type') || ''
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    const imageValue = formData.get('image')
    file = imageValue instanceof File ? imageValue : null
    image_url = (formData.get('image_url') as string | null)?.trim() || null
    link_url = (formData.get('link_url') as string | null)?.trim() || null
    link_type = (formData.get('link_type') as string) || 'external'
    external_url = (formData.get('external_url') as string | null)?.trim() || null
    slug = (formData.get('slug') as string | null)?.trim() || null
    content = (formData.get('content') as string | null) || null
    contact_name = (formData.get('contact_name') as string | null)?.trim() || null
    phone = (formData.get('phone') as string | null)?.trim() || null
    wechat = (formData.get('wechat') as string | null)?.trim() || null
    open_mode = (formData.get('open_mode') as string) || 'external_new'
    position = ((formData.get('position') as string) || '').trim()
    is_active = formData.get('is_active') !== 'false'
    start_date = ((formData.get('start_date') as string | null) || '').trim() || null
    end_date = ((formData.get('end_date') as string | null) || '').trim() || null
  } else {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
    }

    if (body === null || typeof body !== 'object') {
      return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
    }

    const payload = body as Record<string, unknown>
    image_url = typeof payload.image_url === 'string' ? payload.image_url.trim() : null
    link_url = typeof payload.link_url === 'string' ? payload.link_url.trim() : null
    link_type = typeof payload.link_type === 'string' ? payload.link_type : 'external'
    external_url = typeof payload.external_url === 'string' ? payload.external_url.trim() : null
    slug = typeof payload.slug === 'string' ? payload.slug.trim() : null
    content = typeof payload.content === 'string' ? payload.content : null
    contact_name = typeof payload.contact_name === 'string' ? payload.contact_name.trim() || null : null
    phone = typeof payload.phone === 'string' ? payload.phone.trim() || null : null
    wechat = typeof payload.wechat === 'string' ? payload.wechat.trim() || null : null
    open_mode = typeof payload.open_mode === 'string' ? payload.open_mode : 'external_new'
    position = typeof payload.position === 'string' ? payload.position.trim() : ''
    is_active = payload.is_active !== false
    start_date = typeof payload.start_date === 'string' ? payload.start_date.trim() || null : null
    end_date = typeof payload.end_date === 'string' ? payload.end_date.trim() || null : null
  }

  if (!position) {
    return NextResponse.json({ error: 'position is required' }, { status: 400 })
  }

  if (file && file.size > 0 && image_url) {
    return NextResponse.json({ error: '上传图片和外部图片链接只能二选一' }, { status: 400 })
  }

  if (file && file.size > 0) {
    const fileExt = (file.name.split('.').pop() || '').toLowerCase()
    if (!fileExt || !ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXTS.includes(fileExt)) {
      return NextResponse.json({ error: '图片格式仅支持 JPG、PNG、WEBP' }, { status: 400 })
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: '图片大小不能超过 5MB' }, { status: 400 })
    }

    const baseName = file.name.slice(0, file.name.length - fileExt.length - 1)
    const safeBaseName = sanitizeSegment(baseName) || 'ad'
    const filePath = `ads/${Date.now()}-${safeBaseName}.${fileExt}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('ads')
      .upload(filePath, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 })
    }

    const { data: urlData } = supabase.storage.from('ads').getPublicUrl(filePath)
    image_url = urlData.publicUrl
  }

  const { data: normalized, error: validationError } = normalizeAndValidateAdInput({
    image_url,
    link_url,
    link_type,
    external_url,
    slug,
    content,
    contact_name,
    phone,
    wechat,
    open_mode,
    position,
    is_active,
    start_date,
    end_date,
  })

  if (validationError) {
    return NextResponse.json(
      { error: validationError || AD_LINK_MODE_CONFLICT_ERROR },
      { status: 400 }
    )
  }

  if (!normalized) {
    return NextResponse.json({ error: AD_LINK_MODE_CONFLICT_ERROR }, { status: 400 })
  }

  if (normalized.link_type === 'internal' && normalized.slug) {
    try {
      const hasConflict = await hasInternalSlugConflict(supabase, normalized.slug)
      if (hasConflict) {
        return NextResponse.json({ error: AD_SLUG_DUPLICATE_ERROR }, { status: 400 })
      }
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'slug 校验失败' },
        { status: 400 }
      )
    }
  }

  const { data, error } = await supabase
    .from('ads')
    .insert({
      ...normalized,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data }, { status: 201 })
}
