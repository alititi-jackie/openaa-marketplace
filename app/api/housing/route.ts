import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isPublicUserStatusVisible } from '@/lib/publicVisibility'

export const dynamic = 'force-dynamic'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function toInt(value: string | null, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(value || '', 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function normalizeTypeFilter(value: string | null): 'renting' | 'seeking' | null {
  if (value === 'renting' || value === 'seeking') return value
  return null
}

function normalizeLocationFilter(value: string | null): string {
  const v = (value || '').trim()
  if (!v || v === '全部地区') return ''
  return v
}

function normalizeSearch(value: string | null): string {
  return (value || '').trim()
}

function typeCandidates(type: 'renting' | 'seeking'): string[] {
  if (type === 'seeking') return ['seeking', 'seek', 'wanted', '求租', '求购']
  return ['renting', 'rent', 'rent_out', 'rentout', 'sale', 'sell', '出租', '出售']
}

function safeLike(value: string): string {
  // Escape % and _ for ilike pattern.
  return value.replace(/[%_]/g, (m) => `\\${m}`)
}

function toSortableTime(value: unknown): number {
  if (!value || typeof value !== 'string') return 0
  const t = new Date(value).getTime()
  return Number.isNaN(t) ? 0 : t
}

type HousingRow = {
  id: number
  user_id: string
  type: string | null
  title: string | null
  description: string | null
  price: number | null
  location: string | null
  room_type: string | null
  contact: string | null
  contact_name: string | null
  phone: string | null
  wechat: string | null
  images: unknown
  status: string | null
  views: number | null
  created_at: string | null
  updated_at: string | null
  is_pinned?: boolean | null
  pinned_until?: string | null
  pinned_order?: number | null
}

type UserStatusRow = {
  id: string
  status: string | null
}

function isVisiblePostStatus(status: unknown): boolean {
  return status === 'published' || status === 'active'
}

function isPinnedActive(row: HousingRow, nowTime: number): boolean {
  if (row.is_pinned !== true) return false
  if (!isVisiblePostStatus(row.status)) return false
  if (!row.pinned_until) return true
  return toSortableTime(row.pinned_until) > nowTime
}

type DebugHousingRow = {
  id: number
  title: string | null
  status: string | null
  type: string | null
  location: string | null
  user_id: string
  created_at: string | null
}

export async function GET(request: NextRequest) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase service role missing' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const debug = searchParams.get('debug')

  const type = normalizeTypeFilter(searchParams.get('type'))
  const typeValues = type ? typeCandidates(type) : null
  const location = normalizeLocationFilter(searchParams.get('location'))
  const search = normalizeSearch(searchParams.get('search'))
  const limit = toInt(searchParams.get('limit'), 50, 1, 200)
  const statusValues = ['published', 'active']

  const supabase = getServiceClient()

  // Debug: return raw latest 10 rows without any filters (no status/type/location/search)
  if (debug === '1') {
    const { data, error } = await supabase
      .from('housing_posts')
      .select('id, title, status, type, location, user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      debug: true,
      params: {
        type,
        typeValues,
        location,
        search,
        statusValues,
      },
      data: (data || []) as DebugHousingRow[],
    })
  }

  let query = supabase
    .from('housing_posts')
    .select(
      'id, user_id, type, title, description, price, location, room_type, contact, contact_name, phone, wechat, images, status, views, created_at, updated_at, is_pinned, pinned_until, pinned_order'
    )
    .in('status', statusValues)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (type) {
    query = query.in('type', typeValues || [])
  }

  if (location) {
    query = query.eq('location', location)
  }

  if (search) {
    const q = safeLike(search)
    // Search title / description / location / contact_name / phone / wechat
    query = query.or(
      [
        `title.ilike.%${q}%`,
        `description.ilike.%${q}%`,
        `location.ilike.%${q}%`,
        `contact_name.ilike.%${q}%`,
        `phone.ilike.%${q}%`,
        `wechat.ilike.%${q}%`,
      ].join(',')
    )
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const rows = (data || []) as HousingRow[]

  // user status visibility
  const userIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)))
  const userStatusMap = new Map<string, string | null>()

  if (userIds.length > 0) {
    const { data: userRows } = await supabase.from('users').select('id, status').in('id', userIds)
    for (const u of (userRows || []) as UserStatusRow[]) {
      userStatusMap.set(u.id, u.status ?? null)
    }
  }

  const visibleByUser = rows.filter((row) => {
    const status = userStatusMap.get(row.user_id)
    // If user not found / null -> do NOT hide
    if (status === undefined || status === null) return true
    // Only hide when explicitly restricted/banned/hidden/deleted
    if (status === 'restricted' || status === 'banned' || status === 'hidden' || status === 'deleted') return false
    return isPublicUserStatusVisible(status)
  })

  // Sort pinned first (effective pinned), then created_at desc
  const nowTime = Date.now()
  visibleByUser.sort((a, b) => {
    const aPinned = isPinnedActive(a, nowTime)
    const bPinned = isPinnedActive(b, nowTime)
    if (aPinned !== bPinned) return aPinned ? -1 : 1

    if (aPinned && bPinned) {
      const pinnedOrderDiff = (a.pinned_order ?? 0) - (b.pinned_order ?? 0)
      if (pinnedOrderDiff !== 0) return pinnedOrderDiff
    }

    return toSortableTime(b.created_at) - toSortableTime(a.created_at)
  })

  return NextResponse.json({ data: visibleByUser })
}
