import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const VALID_STATUSES = ['active', 'restricted', 'banned'] as const
type UserStatus = typeof VALID_STATUSES[number]

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

function normalizeOptionalText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : null
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
    return NextResponse.json({ error: '无效请求体' }, { status: 400 })
  }

  const payload = body as Record<string, unknown>
  const updates: Record<string, unknown> = {}
  const now = new Date().toISOString()

  if ('status' in payload) {
    if (!VALID_STATUSES.includes(payload.status as UserStatus)) {
      return NextResponse.json({ error: '无效的用户状态' }, { status: 400 })
    }

    const status = payload.status as UserStatus
    updates.status = status
    updates.last_admin_action_at = now

    if (status === 'banned') {
      updates.banned_at = now
      updates.banned_by = 'admin'
      const reason = normalizeOptionalText(payload.banned_reason)
      if (reason !== undefined) updates.banned_reason = reason
    }
  }

  if ('admin_note' in payload) {
    const adminNote = normalizeOptionalText(payload.admin_note)
    if (adminNote === undefined) {
      return NextResponse.json({ error: 'admin_note 必须为字符串' }, { status: 400 })
    }
    updates.admin_note = adminNote
    updates.last_admin_action_at = now
  }

  if ('banned_reason' in payload && !('banned_reason' in updates)) {
    const bannedReason = normalizeOptionalText(payload.banned_reason)
    if (bannedReason === undefined) {
      return NextResponse.json({ error: 'banned_reason 必须为字符串' }, { status: 400 })
    }
    updates.banned_reason = bannedReason
    updates.last_admin_action_at = now
  }

  if ('is_posting_exempt' in payload) {
    if (typeof payload.is_posting_exempt !== 'boolean') {
      return NextResponse.json({ error: 'is_posting_exempt 必须为布尔值' }, { status: 400 })
    }
    updates.is_posting_exempt = payload.is_posting_exempt
    updates.last_admin_action_at = now
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: '没有可更新的字段' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select(
      'id, email, username, phone, bio, status, is_posting_exempt, admin_note, banned_reason, banned_at, banned_by, created_at, updated_at'
    )
    .single()

  if (error || !data) {
    return NextResponse.json({ error: '更新用户失败' }, { status: 400 })
  }

  return NextResponse.json({ data })
}
