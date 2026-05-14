import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

type UserStatus = 'active' | 'restricted' | 'banned'
type PostCounts = {
  jobs: number
  housing: number
  secondhand: number
  services: number
  total: number
}

type UserRow = {
  id: string
  email: string | null
  username: string | null
  phone: string | null
  bio: string | null
  status: UserStatus | null
  is_posting_exempt: boolean | null
  admin_note: string | null
  banned_reason: string | null
  banned_at: string | null
  banned_by: string | null
  created_at: string | null
  updated_at: string | null
}

const VALID_STATUS_FILTERS = ['all', 'active', 'restricted', 'banned'] as const

type StatusFilter = typeof VALID_STATUS_FILTERS[number]

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

function parsePositiveInt(value: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(value || '', 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(parsed, max)
}

function normalizeStatusFilter(value: string | null): StatusFilter {
  return VALID_STATUS_FILTERS.includes(value as StatusFilter) ? (value as StatusFilter) : 'all'
}

function escapeSearch(value: string): string {
  return value.replace(/[%_]/g, (match) => `\\${match}`)
}

function emptyCounts(): PostCounts {
  return { jobs: 0, housing: 0, secondhand: 0, services: 0, total: 0 }
}

async function countUsers(
  supabase: ReturnType<typeof getServiceClient>,
  status?: UserStatus
): Promise<number> {
  let query = supabase.from('users').select('id', { count: 'exact', head: true })
  if (status) query = query.eq('status', status)
  const { count } = await query
  return count ?? 0
}

async function countPostsByUser(
  supabase: ReturnType<typeof getServiceClient>,
  table: string,
  userIds: string[]
): Promise<{ counts: Record<string, number>; warning?: string }> {
  const counts: Record<string, number> = {}
  if (userIds.length === 0) return { counts }

  const { data, error } = await supabase
    .from(table)
    .select('user_id')
    .in('user_id', userIds)

  if (error) {
    return { counts, warning: `${table} 统计失败` }
  }

  for (const row of data ?? []) {
    const userId = (row as { user_id?: string | null }).user_id
    if (!userId) continue
    counts[userId] = (counts[userId] ?? 0) + 1
  }

  return { counts }
}

export async function GET(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const search = (searchParams.get('search') || '').trim()
  const status = normalizeStatusFilter(searchParams.get('status'))
  const page = parsePositiveInt(searchParams.get('page'), 1, 999999)
  const limit = parsePositiveInt(searchParams.get('limit'), 20, 100)
  const from = (page - 1) * limit
  const to = from + limit - 1

  const supabase = getServiceClient()

  let query = supabase
    .from('users')
    .select(
      'id, email, username, phone, bio, status, is_posting_exempt, admin_note, banned_reason, banned_at, banned_by, created_at, updated_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  if (search) {
    const q = escapeSearch(search)
    query = query.or(`email.ilike.%${q}%,username.ilike.%${q}%,phone.ilike.%${q}%`)
  }

  const [{ data, error, count }, activeCount, restrictedCount, bannedCount] = await Promise.all([
    query,
    countUsers(supabase, 'active'),
    countUsers(supabase, 'restricted'),
    countUsers(supabase, 'banned'),
  ])

  if (error) {
    return NextResponse.json({ error: '获取用户列表失败' }, { status: 400 })
  }

  const rows = (data ?? []) as UserRow[]
  const userIds = rows.map((user) => user.id).filter(Boolean)
  const warnings: string[] = []

  const [jobs, housing, secondhand, services] = await Promise.all([
    countPostsByUser(supabase, 'job_postings', userIds),
    countPostsByUser(supabase, 'housing_posts', userIds),
    countPostsByUser(supabase, 'secondhand_items', userIds),
    countPostsByUser(supabase, 'service_posts', userIds),
  ])

  for (const result of [jobs, housing, secondhand, services]) {
    if (result.warning) warnings.push(result.warning)
  }

  const users = rows.map((user) => {
    const postCounts = emptyCounts()
    postCounts.jobs = jobs.counts[user.id] ?? 0
    postCounts.housing = housing.counts[user.id] ?? 0
    postCounts.secondhand = secondhand.counts[user.id] ?? 0
    postCounts.services = services.counts[user.id] ?? 0
    postCounts.total = postCounts.jobs + postCounts.housing + postCounts.secondhand + postCounts.services

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      phone: user.phone,
      bio: user.bio,
      status: user.status || 'active',
      is_posting_exempt: Boolean(user.is_posting_exempt),
      admin_note: user.admin_note,
      banned_reason: user.banned_reason,
      banned_at: user.banned_at,
      banned_by: user.banned_by,
      created_at: user.created_at,
      updated_at: user.updated_at,
      postCounts,
    }
  })

  const total = count ?? 0

  return NextResponse.json({
    users,
    total,
    activeCount,
    restrictedCount,
    bannedCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasPrev: page > 1,
      hasNext: page * limit < total,
    },
    ...(warnings.length > 0 ? { warnings } : {}),
  })
}
