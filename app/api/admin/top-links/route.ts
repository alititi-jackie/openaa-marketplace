import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

function toRequiredString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function toSortOrder(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) return null
  return value
}

function toOpenMode(value: unknown): 'same' | 'new' | null {
  if (value !== 'same' && value !== 'new') return null
  return value
}

export async function GET(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('top_quick_links')
    .select('id, title, url, sort_order, is_active, open_mode, created_at, updated_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const body: unknown = await request.json()
  if (body === null || typeof body !== 'object') {
    return NextResponse.json({ error: '无效请求体' }, { status: 400 })
  }

  const { title, url, sort_order, is_active, open_mode } = body as Record<string, unknown>
  const normalizedTitle = toRequiredString(title)
  const normalizedUrl = toRequiredString(url)
  const normalizedSortOrder = toSortOrder(sort_order)
  const normalizedOpenMode = toOpenMode(open_mode)

  if (!normalizedTitle) {
    return NextResponse.json({ error: 'title 不能为空' }, { status: 400 })
  }
  if (!normalizedUrl) {
    return NextResponse.json({ error: 'url 不能为空' }, { status: 400 })
  }
  if (normalizedSortOrder === null) {
    return NextResponse.json({ error: 'sort_order 必须是大于等于 0 的整数' }, { status: 400 })
  }
  if (!normalizedOpenMode) {
    return NextResponse.json({ error: 'open_mode 只能是 same 或 new' }, { status: 400 })
  }
  if (is_active !== undefined && typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'is_active 必须为布尔值' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('top_quick_links')
    .insert({
      title: normalizedTitle,
      url: normalizedUrl,
      sort_order: normalizedSortOrder,
      is_active: typeof is_active === 'boolean' ? is_active : true,
      open_mode: normalizedOpenMode,
    })
    .select('id, title, url, sort_order, is_active, open_mode, created_at, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
