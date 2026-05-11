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

function toSortOrder(value: unknown): number | null | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) return null
  return value
}

function toOpenMode(value: unknown): 'same' | 'new' | null | undefined {
  if (value === undefined) return undefined
  if (value !== 'same' && value !== 'new') return null
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
  const { title, url, sort_order, is_active, open_mode } = body as Record<string, unknown>

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (title !== undefined) {
    const normalizedTitle = toRequiredString(title)
    if (!normalizedTitle) {
      return NextResponse.json({ error: 'title 不能为空' }, { status: 400 })
    }
    updates.title = normalizedTitle
  }

  if (url !== undefined) {
    const normalizedUrl = toRequiredString(url)
    if (!normalizedUrl) {
      return NextResponse.json({ error: 'url 不能为空' }, { status: 400 })
    }
    updates.url = normalizedUrl
  }

  const normalizedSortOrder = toSortOrder(sort_order)
  if (sort_order !== undefined && normalizedSortOrder === null) {
    return NextResponse.json({ error: 'sort_order 必须是大于等于 0 的整数' }, { status: 400 })
  }
  if (normalizedSortOrder !== undefined) {
    updates.sort_order = normalizedSortOrder
  }

  if (is_active !== undefined) {
    if (typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'is_active 必须为布尔值' }, { status: 400 })
    }
    updates.is_active = is_active
  }

  const normalizedOpenMode = toOpenMode(open_mode)
  if (open_mode !== undefined && normalizedOpenMode === null) {
    return NextResponse.json({ error: 'open_mode 只能是 same 或 new' }, { status: 400 })
  }
  if (normalizedOpenMode !== undefined) {
    updates.open_mode = normalizedOpenMode
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json({ error: '至少需要提供一个可更新字段' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('top_quick_links')
    .update(updates)
    .eq('id', id)
    .select('id, title, url, sort_order, is_active, open_mode, created_at, updated_at')
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
  const { error } = await supabase
    .from('top_quick_links')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
