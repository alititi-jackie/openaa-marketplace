import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const TABLE_MAP = {
  jobs: 'job_postings',
  housing: 'housing_posts',
  secondhand: 'secondhand_items',
} as const

type PostModule = keyof typeof TABLE_MAP

// All status values accepted across modules.
// 'hidden' and 'deleted' are unlocked for jobs/secondhand by the migration
// 20260510220000_add_hidden_deleted_status_to_posts.sql.
// 'unpublished' is kept for backward-compat with pre-migration rows.
const VALID_STATUSES = ['published', 'hidden', 'deleted', 'unpublished'] as const

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

  const { module, status } = body as { module?: string; status?: string }

  if (!module || !Object.keys(TABLE_MAP).includes(module)) {
    return NextResponse.json({ error: '无效的模块名，必须为 jobs、housing 或 secondhand' }, { status: 400 })
  }

  if (!status || !(VALID_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json(
      { error: `无效的状态值，允许值为：${VALID_STATUSES.join('、')}` },
      { status: 400 }
    )
  }

  const table = TABLE_MAP[module as PostModule]
  const supabase = getServiceClient()

  const { data, error } = await supabase
    .from(table)
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
