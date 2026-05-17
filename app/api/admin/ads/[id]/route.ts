import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  AD_LINK_MODE_CONFLICT_ERROR,
  AD_SLUG_DUPLICATE_ERROR,
  normalizeAndValidateAdInput,
} from '@/lib/ads'

export const dynamic = 'force-dynamic'

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

async function hasInternalSlugConflict(
  supabase: ReturnType<typeof getServiceClient>,
  slug: string,
  currentId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('ads')
    .select('id')
    .eq('link_type', 'internal')
    .eq('slug', slug)
    .neq('id', currentId)
    .limit(1)

  if (error) throw error
  return Array.isArray(data) && data.length > 0
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { id } = await params
  const body: unknown = await request.json()
  if (body === null || typeof body !== 'object') {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }

  const payload = body as Record<string, unknown>
  const supabase = getServiceClient()
  const { data: existing, error: existingError } = await supabase
    .from('ads')
    .select('*')
    .eq('id', id)
    .single()

  if (existingError || !existing) {
    return NextResponse.json({ error: '广告不存在' }, { status: 404 })
  }

  // Whitelist allowed fields
  const ALLOWED_FIELDS = ['is_active', 'start_date', 'end_date', 'link_url', 'position', 'link_type', 'external_url', 'slug', 'content', 'open_mode', 'image_url', 'contact_name', 'phone', 'wechat'] as const
  type AllowedField = typeof ALLOWED_FIELDS[number]
  const update: Partial<Record<AllowedField, unknown>> = {}
  for (const field of ALLOWED_FIELDS) {
    if (field in payload) update[field] = payload[field]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: '没有可更新的字段' }, { status: 400 })
  }

  const requiresAdValidation = [
    'image_url',
    'link_url',
    'link_type',
    'external_url',
    'slug',
    'content',
    'open_mode',
    'contact_name',
    'phone',
    'wechat',
    'position',
    'start_date',
    'end_date',
  ].some((field) => field in update)

  const finalUpdate: Record<string, unknown> = requiresAdValidation
    ? {}
    : update as Record<string, unknown>

  if (requiresAdValidation) {
    const merged = {
      image_url: 'image_url' in update ? update.image_url : existing.image_url,
      link_url: 'link_url' in update ? update.link_url : existing.link_url,
      link_type: 'link_type' in update ? update.link_type : existing.link_type,
      external_url: 'external_url' in update ? update.external_url : existing.external_url,
      slug: 'slug' in update ? update.slug : existing.slug,
      content: 'content' in update ? update.content : existing.content,
      contact_name: 'contact_name' in update ? update.contact_name : existing.contact_name,
      phone: 'phone' in update ? update.phone : existing.phone,
      wechat: 'wechat' in update ? update.wechat : existing.wechat,
      open_mode: 'open_mode' in update ? update.open_mode : existing.open_mode,
      position: 'position' in update ? update.position : existing.position,
      is_active: 'is_active' in update ? update.is_active : existing.is_active,
      start_date: 'start_date' in update ? update.start_date : existing.start_date,
      end_date: 'end_date' in update ? update.end_date : existing.end_date,
    }

    const { data: normalized, error: validationError } = normalizeAndValidateAdInput(merged)
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
        const hasConflict = await hasInternalSlugConflict(supabase, normalized.slug, id)
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

    Object.assign(finalUpdate, normalized)
    if ('is_active' in update) finalUpdate.is_active = update.is_active === true
  }

  const { data, error } = await supabase
    .from('ads')
    .update(finalUpdate)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { id } = await params
  const supabase = getServiceClient()
  const { data, error } = await supabase.from('ads').delete().eq('id', id).select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data || data.length === 0) {
    return NextResponse.json({ error: '未找到对应记录，删除失败' }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
