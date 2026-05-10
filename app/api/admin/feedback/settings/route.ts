import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const DEFAULT_USER_DAILY_LIMIT = 5
const DEFAULT_TOTAL_DAILY_LIMIT = 100
const LIMIT_MIN = 1
const LIMIT_MAX = 1000

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function checkAdminToken(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token')
  return token === process.env.ADMIN_TOKEN && !!process.env.ADMIN_TOKEN
}

async function readLimitSetting(
  supabase: ReturnType<typeof getServiceClient>,
  key: string,
  fallback: number
): Promise<number> {
  const { data, error } = await supabase.from('site_settings').select('value').eq('key', key).single()
  if (error) {
    if ((error as { code?: string }).code === 'PGRST116') return fallback
    throw new Error(error.message)
  }
  const parsed = parseInt((data as { value: string }).value, 10)
  return Number.isFinite(parsed) && parsed >= LIMIT_MIN && parsed <= LIMIT_MAX ? parsed : fallback
}

export async function GET(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  try {
    const supabase = getServiceClient()
    const [userDailyLimit, totalDailyLimit] = await Promise.all([
      readLimitSetting(supabase, 'feedback_daily_user_limit', DEFAULT_USER_DAILY_LIMIT),
      readLimitSetting(supabase, 'feedback_daily_total_limit', DEFAULT_TOTAL_DAILY_LIMIT),
    ])
    return NextResponse.json({ userDailyLimit, totalDailyLimit })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '读取设置失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const body: unknown = await request.json()
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: '无效请求体' }, { status: 400 })
  }

  const raw = body as Record<string, unknown>
  const allowedKeys = ['userDailyLimit', 'totalDailyLimit']
  const hasUnknownField = Object.keys(raw).some((key) => !allowedKeys.includes(key))
  if (hasUnknownField) {
    return NextResponse.json({ error: '只允许更新 userDailyLimit 与 totalDailyLimit' }, { status: 400 })
  }

  const userDailyLimit = raw.userDailyLimit
  const totalDailyLimit = raw.totalDailyLimit

  if (
    typeof userDailyLimit !== 'number' ||
    !Number.isInteger(userDailyLimit) ||
    userDailyLimit < LIMIT_MIN ||
    userDailyLimit > LIMIT_MAX
  ) {
    return NextResponse.json(
      { error: `userDailyLimit 必须是 ${LIMIT_MIN}~${LIMIT_MAX} 之间的整数` },
      { status: 400 }
    )
  }

  if (
    typeof totalDailyLimit !== 'number' ||
    !Number.isInteger(totalDailyLimit) ||
    totalDailyLimit < LIMIT_MIN ||
    totalDailyLimit > LIMIT_MAX
  ) {
    return NextResponse.json(
      { error: `totalDailyLimit 必须是 ${LIMIT_MIN}~${LIMIT_MAX} 之间的整数` },
      { status: 400 }
    )
  }
  if (userDailyLimit > totalDailyLimit) {
    return NextResponse.json(
      { error: '单个用户每日上限不能大于全站每日反馈总上限' },
      { status: 400 }
    )
  }

  const supabase = getServiceClient()
  const now = new Date().toISOString()

  const { error } = await supabase.from('site_settings').upsert(
    [
      { key: 'feedback_daily_user_limit', value: String(userDailyLimit), updated_at: now },
      { key: 'feedback_daily_total_limit', value: String(totalDailyLimit), updated_at: now },
    ],
    { onConflict: 'key' }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ userDailyLimit, totalDailyLimit })
}
