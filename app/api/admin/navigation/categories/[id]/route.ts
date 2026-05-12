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

function toPositiveInt(value: unknown, min = 0, max = 9999): number | null | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max)
    return null
  return value
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const body: unknown = await request.json()
  if (body === null || typeof body !== 'object') {
    return NextResponse.json({ error: '无效请求体' }, { status: 400 })
  }

  const { id } = await params
  const { name, sort_order, display_limit, is_active } = body as Record<string, unknown>

  const updates: Record<string, unknown> = {}

  if (name !== undefined) {
    const normalizedName = toRequiredString(name)
    if (!normalizedName) {
      return NextResponse.json({ error: 'name 不能为空' }, { status: 400 })
    }
    updates.name = normalizedName
  }

  const normalizedSortOrder = toPositiveInt(sort_order, 0, 9999)
  if (sort_order !== undefined && normalizedSortOrder === null) {
    return NextResponse.json({ error: 'sort_order 必须是 0–9999 的整数' }, { status: 400 })
  }
  if (normalizedSortOrder !== undefined) {
    updates.sort_order = normalizedSortOrder
  }

  const normalizedDisplayLimit = toPositiveInt(display_limit, 1, 50)
  if (display_limit !== undefined && normalizedDisplayLimit === null) {
    return NextResponse.json({ error: 'display_limit 必须是 1–50 的整数' }, { status: 400 })
  }
  if (normalizedDisplayLimit !== undefined) {
    updates.display_limit = normalizedDisplayLimit
  }

  if (is_active !== undefined) {
    if (typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'is_active 必须为布尔值' }, { status: 400 })
    }
    updates.is_active = is_active
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: '至少需要提供一个可更新字段' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('navigation_categories')
    .update(updates)
    .eq('id', id)
    .select('id, name, slug, sort_order, display_limit, is_active, created_at, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
