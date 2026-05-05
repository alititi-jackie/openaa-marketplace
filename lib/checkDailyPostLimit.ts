import { SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_LIMIT = 5

export interface DailyPostLimitResult {
  allowed: boolean
  limit: number
  used: number
  message?: string
}

async function getDailyLimit(supabase: SupabaseClient): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'daily_post_limit')
      .single()

    if (error || !data) return DEFAULT_LIMIT

    const parsed = parseInt((data as { value: string }).value, 10)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_LIMIT
  } catch {
    return DEFAULT_LIMIT
  }
}

export async function checkDailyPostLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<DailyPostLimitResult> {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  const todayStartISO = todayStart.toISOString()
  const tomorrowStartISO = tomorrowStart.toISOString()

  const limit = await getDailyLimit(supabase)

  try {
    const [jobsResult, housingResult, secondhandResult] = await Promise.all([
      supabase
        .from('job_postings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', todayStartISO)
        .lt('created_at', tomorrowStartISO),
      supabase
        .from('housing_posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', todayStartISO)
        .lt('created_at', tomorrowStartISO),
      supabase
        .from('secondhand_items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', todayStartISO)
        .lt('created_at', tomorrowStartISO),
    ])

    if (jobsResult.error || housingResult.error || secondhandResult.error) {
      return {
        allowed: false,
        limit,
        used: 0,
        message: '暂时无法验证发帖次数，请稍后重试。',
      }
    }

    const used =
      (jobsResult.count ?? 0) +
      (housingResult.count ?? 0) +
      (secondhandResult.count ?? 0)

    if (used >= limit) {
      return {
        allowed: false,
        limit,
        used,
        message: '您今天发布的信息已达到平台限制，请明天再发布。',
      }
    }

    return { allowed: true, limit, used }
  } catch {
    return {
      allowed: false,
      limit,
      used: 0,
      message: '暂时无法验证发帖次数，请稍后重试。',
    }
  }
}
