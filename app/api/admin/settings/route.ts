import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const DEFAULT_DAILY_POST_LIMIT = 5

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

export async function GET(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const supabase = getServiceClient()

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'daily_post_limit')
      .single()

    if (error || !data) {
      return NextResponse.json({ daily_post_limit: DEFAULT_DAILY_POST_LIMIT })
    }

    const parsed = parseInt((data as { value: string }).value, 10)
    const limit = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_POST_LIMIT

    return NextResponse.json({ daily_post_limit: limit })
  } catch {
    return NextResponse.json({ daily_post_limit: DEFAULT_DAILY_POST_LIMIT })
  }
}

export async function PUT(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const body: unknown = await request.json()
  const rawLimit = (body as Record<string, unknown>)?.daily_post_limit

  if (
    typeof rawLimit !== 'number' ||
    !Number.isFinite(rawLimit) ||
    rawLimit < 1 ||
    rawLimit > 100
  ) {
    return NextResponse.json(
      { error: 'daily_post_limit 必须是 1~100 之间的整数' },
      { status: 400 }
    )
  }

  const limit = Math.floor(rawLimit)
  const supabase = getServiceClient()

  const { error } = await supabase.from('site_settings').upsert(
    { key: 'daily_post_limit', value: String(limit), updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ daily_post_limit: limit })
}
