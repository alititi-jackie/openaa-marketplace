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

function toOpenMode(value: unknown): 'auto' | 'same' | 'new' | null {
  if (value !== 'auto' && value !== 'same' && value !== 'new') return null
  return value
}

export async function GET(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('category_id')

  const supabase = getServiceClient()
  let query = supabase
    .from('navigation_links')
    .select('id, category_id, title, url, description, open_mode, sort_order, is_active, created_at, updated_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data, error } = await query

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

  const { category_id, title, url, description, open_mode, sort_order, is_active } = body as Record<string, unknown>

  const normalizedCategoryId = toRequiredString(category_id)
  if (!normalizedCategoryId) {
    return NextResponse.json({ error: 'category_id 不能为空' }, { status: 400 })
  }

  const normalizedTitle = toRequiredString(title)
  if (!normalizedTitle) {
    return NextResponse.json({ error: 'title 不能为空' }, { status: 400 })
  }

  const normalizedUrl = toRequiredString(url)
  if (!normalizedUrl) {
    return NextResponse.json({ error: 'url 不能为空' }, { status: 400 })
  }

  const normalizedSortOrder = toSortOrder(sort_order)
  if (sort_order !== undefined && normalizedSortOrder === null) {
    return NextResponse.json({ error: 'sort_order 必须是大于等于 0 的整数' }, { status: 400 })
  }

  const normalizedOpenMode = toOpenMode(open_mode)
  if (open_mode !== undefined && normalizedOpenMode === null) {
    return NextResponse.json({ error: 'open_mode 只能是 auto、same 或 new' }, { status: 400 })
  }

  if (is_active !== undefined && typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'is_active 必须为布尔值' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('navigation_links')
    .insert({
      category_id: normalizedCategoryId,
      title: normalizedTitle,
      url: normalizedUrl,
      description: typeof description === 'string' && description.trim() ? description.trim() : null,
      open_mode: normalizedOpenMode ?? 'auto',
      sort_order: normalizedSortOrder ?? 0,
      is_active: typeof is_active === 'boolean' ? is_active : true,
    })
    .select('id, category_id, title, url, description, open_mode, sort_order, is_active, created_at, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
