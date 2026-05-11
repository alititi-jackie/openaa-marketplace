import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_HOME_LATEST_SECTIONS } from '@/lib/homeSections'

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

type PatchPayload = {
  sections: Array<{
    section_key: string
    is_visible: boolean
    display_order: number
    limit_count: number
  }>
}

const VALID_SECTION_KEYS = new Set(DEFAULT_HOME_LATEST_SECTIONS.map((section) => section.section_key))

export async function GET(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('home_latest_sections')
    .select('section_key, section_name, section_type, parent_key, is_visible, display_order, limit_count')
    .order('display_order', { ascending: true })
    .order('section_key', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

export async function PATCH(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const body = (await request.json()) as Partial<PatchPayload>
  if (!Array.isArray(body.sections) || body.sections.length === 0) {
    return NextResponse.json({ error: 'sections 不能为空' }, { status: 400 })
  }

  for (const item of body.sections) {
    if (typeof item.section_key !== 'string' || !item.section_key.trim()) {
      return NextResponse.json({ error: 'section_key 无效' }, { status: 400 })
    }
    if (!VALID_SECTION_KEYS.has(item.section_key.trim())) {
      return NextResponse.json({ error: `不支持的 section_key: ${item.section_key}` }, { status: 400 })
    }
    if (typeof item.is_visible !== 'boolean') {
      return NextResponse.json({ error: 'is_visible 必须为 boolean' }, { status: 400 })
    }
    if (
      typeof item.display_order !== 'number' ||
      !Number.isInteger(item.display_order) ||
      item.display_order < 0
    ) {
      return NextResponse.json({ error: 'display_order 必须是 >= 0 的整数' }, { status: 400 })
    }
    if (
      typeof item.limit_count !== 'number' ||
      !Number.isInteger(item.limit_count) ||
      item.limit_count < 1 ||
      item.limit_count > 30
    ) {
      return NextResponse.json({ error: 'limit_count 必须是 1~30 的整数' }, { status: 400 })
    }
  }

  const supabase = getServiceClient()
  const updatedAt = new Date().toISOString()

  for (const item of body.sections) {
    const { error } = await supabase
      .from('home_latest_sections')
      .update({
        is_visible: item.is_visible,
        display_order: item.display_order,
        limit_count: item.limit_count,
        updated_at: updatedAt,
      })
      .eq('section_key', item.section_key.trim())

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  const { data, error: fetchError } = await supabase
    .from('home_latest_sections')
    .select('section_key, section_name, section_type, parent_key, is_visible, display_order, limit_count')
    .order('display_order', { ascending: true })
    .order('section_key', { ascending: true })

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  return NextResponse.json({
    data: data ?? [],
  })
}
