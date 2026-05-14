import { SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_LIMIT = 5

export interface DailyPostLimitResult {
  allowed: boolean
  limit: number
  used: number
  unlimited?: boolean
  message?: string
}

/**
 * Fetches the daily post limit from the public API route, which uses the
 * service role key and therefore bypasses RLS on the site_settings table.
 * Falls back to DEFAULT_LIMIT only when the fetch itself fails.
 *
 * NOTE: uses a relative URL (/api/settings/daily-limit).
 * This function must only be called from 'use client' components where a
 * browser base URL is available. All current callers (JobForm, ItemForm,
 * housing/publish) satisfy this constraint.
 */
async function getDailyLimit(): Promise<number> {
  try {
    const res = await fetch('/api/settings/daily-limit', { cache: 'no-store' })
    if (!res.ok) return DEFAULT_LIMIT
    const json: unknown = await res.json()
    if (
      json !== null &&
      typeof json === 'object' &&
      'daily_post_limit' in json &&
      typeof (json as Record<string, unknown>).daily_post_limit === 'number'
    ) {
      const limit = (json as { daily_post_limit: number }).daily_post_limit
      return Number.isFinite(limit) && limit > 0 ? limit : DEFAULT_LIMIT
    }
    return DEFAULT_LIMIT
  } catch {
    return DEFAULT_LIMIT
  }
}

async function isPostingExempt(supabase: SupabaseClient, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_posting_exempt')
      .eq('id', userId)
      .maybeSingle()

    if (error) return false
    return Boolean((data as { is_posting_exempt?: boolean } | null)?.is_posting_exempt)
  } catch {
    return false
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

  if (await isPostingExempt(supabase, userId)) {
    return { allowed: true, limit: 0, used: 0, unlimited: true }
  }

  const limit = await getDailyLimit()

  try {
    const [jobsResult, housingResult, secondhandResult, servicesResult] = await Promise.all([
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
      supabase
        .from('service_posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', todayStartISO)
        .lt('created_at', tomorrowStartISO),
    ])

    if (jobsResult.error || housingResult.error || secondhandResult.error || servicesResult.error) {
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
      (secondhandResult.count ?? 0) +
      (servicesResult.count ?? 0)

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
