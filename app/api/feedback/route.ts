import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const DEFAULT_USER_DAILY_LIMIT = 5
const DEFAULT_TOTAL_DAILY_LIMIT = 100
const LIMIT_REACHED_USER_MESSAGE =
  '你今天提交反馈的次数已达上限，请明天再试。如有紧急问题，请邮件联系：323748@gmail.com'
const LIMIT_REACHED_TOTAL_MESSAGE =
  '今日反馈提交数量已达上限，请明天再试。如有紧急问题，请邮件联系：323748@gmail.com'

function getServiceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function getAnonClient(token?: string) {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  })
}

function startOfToday() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
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
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

async function resolveUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '').trim()
  if (!token) return null
  try {
    const anonClient = getAnonClient(token)
    const {
      data: { user },
    } = await anonClient.auth.getUser(token)
    return user?.id ?? null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const body: unknown = await request.json()
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: '请求参数无效' }, { status: 400 })
  }

  const payload = body as Record<string, unknown>
  const type = typeof payload.type === 'string' ? payload.type.trim() : ''
  const content = typeof payload.content === 'string' ? payload.content.trim() : ''
  const contact = typeof payload.contact === 'string' ? payload.contact.trim() : ''
  const relatedUrl = typeof payload.related_url === 'string' ? payload.related_url.trim() : ''
  const visitorId = typeof payload.visitor_id === 'string' ? payload.visitor_id.trim() : ''

  if (!type) {
    return NextResponse.json({ error: '请选择反馈类型。' }, { status: 400 })
  }
  if (!content) {
    return NextResponse.json({ error: '请填写反馈内容。' }, { status: 400 })
  }
  if (relatedUrl) {
    try {
      new URL(relatedUrl)
    } catch {
      return NextResponse.json({ error: '相关链接格式不正确，请输入完整 URL。' }, { status: 400 })
    }
  }

  const userId = await resolveUserId(request)
  if (!userId && !visitorId) {
    return NextResponse.json({ error: '无法识别访客，请刷新页面后重试。' }, { status: 400 })
  }

  try {
    const supabase = getServiceClient()
    const [userDailyLimit, totalDailyLimit] = await Promise.all([
      readLimitSetting(supabase, 'feedback_daily_user_limit', DEFAULT_USER_DAILY_LIMIT),
      readLimitSetting(supabase, 'feedback_daily_total_limit', DEFAULT_TOTAL_DAILY_LIMIT),
    ])

    const todayStart = startOfToday()
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)
    const todayStartISO = todayStart.toISOString()
    const tomorrowStartISO = tomorrowStart.toISOString()

    const { count: totalTodayCount, error: totalCountError } = await supabase
      .from('feedback_posts')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStartISO)
      .lt('created_at', tomorrowStartISO)

    if (totalCountError) {
      return NextResponse.json({ error: totalCountError.message }, { status: 500 })
    }

    if ((totalTodayCount ?? 0) >= totalDailyLimit) {
      return NextResponse.json({ error: LIMIT_REACHED_TOTAL_MESSAGE }, { status: 429 })
    }

    let scopedCountQuery = supabase
      .from('feedback_posts')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStartISO)
      .lt('created_at', tomorrowStartISO)

    scopedCountQuery = userId ? scopedCountQuery.eq('user_id', userId) : scopedCountQuery.eq('visitor_id', visitorId)

    const { count: scopedTodayCount, error: scopedCountError } = await scopedCountQuery

    if (scopedCountError) {
      return NextResponse.json({ error: scopedCountError.message }, { status: 500 })
    }

    if ((scopedTodayCount ?? 0) >= userDailyLimit) {
      return NextResponse.json({ error: LIMIT_REACHED_USER_MESSAGE }, { status: 429 })
    }

    const { error: insertError } = await supabase.from('feedback_posts').insert({
      user_id: userId,
      visitor_id: visitorId || null,
      type,
      related_url: relatedUrl || null,
      contact: contact || null,
      content,
    })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '提交失败，请稍后重试。'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
