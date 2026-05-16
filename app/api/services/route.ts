import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function isAllRegion(value: string | null) {
  const v = (value || '').trim()
  return !v || v === '全部地区' || v === '全部' || v.toLowerCase() === 'all'
}

function isAllCategory(value: string | null) {
  const v = (value || '').trim()
  return !v || v === '全部'
}

function normalizeFilter(value: string | null): string {
  return (value || '').trim()
}

function escapeLikePattern(value: string): string {
  return value.replace(/[%_]/g, (m) => `\\${m}`)
}

function toSortableTime(value: unknown): number {
  if (!value || typeof value !== 'string') return 0
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

function isVisiblePostStatus(status: unknown): boolean {
  return status === 'active' || status === 'published'
}

function isEffectivePinned(
  row: Pick<ServicePublicRow, 'is_pinned' | 'pinned_until' | 'status'>,
  nowTime: number
): boolean {
  if (row.is_pinned !== true) return false
  if (!isVisiblePostStatus(row.status)) return false
  if (!row.pinned_until) return true
  return toSortableTime(row.pinned_until) > nowTime
}

type ServicePublicRow = {
  id: string
  title: string | null
  category: string | null
  location: string | null
  description: string | null
  price_note: string | null
  images: unknown
  status: string | null
  is_active?: boolean | null
  created_at: string | null
  updated_at: string | null
  is_pinned?: boolean | null
  pinned_until?: string | null
  pinned_order?: number | null
  user_id: string
}

type UserStatusRow = {
  id: string
  status: string | null
}

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function isServicePublicRow(value: unknown): value is ServicePublicRow {
  if (!value || typeof value !== 'object') return false
  const row = value as { id?: unknown; user_id?: unknown }
  return (typeof row.id === 'string' || typeof row.id === 'number') && typeof row.user_id === 'string'
}

async function queryServicePosts(
  supabase: ReturnType<typeof getServiceClient>,
  location: string,
  category: string,
  search: string
) {
  const buildQuery = (withIsActive: boolean) => {
    const selectFields = withIsActive
      ? 'id, title, category, location, description, price_note, images, status, is_active, created_at, updated_at, is_pinned, pinned_until, pinned_order, user_id'
      : 'id, title, category, location, description, price_note, images, status, created_at, updated_at, is_pinned, pinned_until, pinned_order, user_id'

    let query = supabase
      .from('service_posts')
      .select(selectFields)
      .in('status', ['active', 'published'])
      .order('created_at', { ascending: false })

    if (!isAllRegion(location)) {
      query = query.eq('location', location)
    }

    if (!isAllCategory(category)) {
      query = query.eq('category', category)
    }

    if (search) {
      const q = escapeLikePattern(search)
      query = query.or(
        [
          `title.ilike.%${q}%`,
          `description.ilike.%${q}%`,
          `category.ilike.%${q}%`,
          `location.ilike.%${q}%`,
        ].join(',')
      )
    }

    return query
  }

  const first = await buildQuery(true)
  if (!first.error) return first

  const errMsg = first.error.message.toLowerCase()
  const isMissingIsActiveColumn =
    errMsg.includes('is_active') && (errMsg.includes('does not exist') || errMsg.includes('column'))

  if (!isMissingIsActiveColumn) return first
  return buildQuery(false)
}

export async function GET(request: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase service role missing' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const location = normalizeFilter(searchParams.get('location'))
  const category = normalizeFilter(searchParams.get('category'))
  const search = normalizeFilter(searchParams.get('search'))

  const supabase = getServiceClient()
  const { data, error } = await queryServicePosts(supabase, location, category, search)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const rows = ensureArray<unknown>(data)
    .filter(isServicePublicRow)
    .map((row) => ({ ...row, id: String(row.id) }))
    .filter((row) => row.is_active !== false)

  const userIds = Array.from(new Set(rows.map((row) => row.user_id).filter(Boolean)))
  const userStatusMap = new Map<string, string | null>()

  if (userIds.length > 0) {
    const { data: userRows } = await supabase.from('users').select('id, status').in('id', userIds)
    for (const row of (userRows || []) as UserStatusRow[]) {
      userStatusMap.set(row.id, row.status ?? null)
    }
  }

  const invisibleStatuses = new Set(['banned', 'restricted', 'hidden', 'deleted'])
  const visibleByUser = rows.filter((row) => {
    const userStatus = userStatusMap.get(row.user_id)
    if (userStatus === undefined || userStatus === null) return true
    return !invisibleStatuses.has(userStatus.toLowerCase())
  })

  const nowTime = Date.now()
  visibleByUser.sort((a, b) => {
    const aPinned = isEffectivePinned(a, nowTime)
    const bPinned = isEffectivePinned(b, nowTime)
    if (aPinned !== bPinned) return aPinned ? -1 : 1

    if (aPinned && bPinned) {
      const pinnedOrderDiff = (a.pinned_order ?? 0) - (b.pinned_order ?? 0)
      if (pinnedOrderDiff !== 0) return pinnedOrderDiff

      const createdAtDiff = toSortableTime(b.created_at) - toSortableTime(a.created_at)
      if (createdAtDiff !== 0) return createdAtDiff
    }

    return toSortableTime(b.created_at) - toSortableTime(a.created_at)
  })

  return NextResponse.json({ data: visibleByUser })
}
