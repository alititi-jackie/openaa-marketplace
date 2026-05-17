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

  const { status, admin_note } = body as { status?: string; admin_note?: string }

  const VALID_STATUSES = ['pending', 'processing', 'resolved', 'ignored']
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: '无效的状态值' }, { status: 400 })
  }

  // Only allow updating status and admin_note
  const updates: Record<string, unknown> = {}
  if (status !== undefined) updates.status = status
  if (admin_note !== undefined) updates.admin_note = admin_note

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: '无可更新字段' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('feedback_posts')
    .update(updates)
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
  const { data, error } = await supabase.from('feedback_posts').delete().eq('id', id).select('id')

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data || data.length === 0) {
    return NextResponse.json({ error: '未找到对应记录，删除失败' }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
