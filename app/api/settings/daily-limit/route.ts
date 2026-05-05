import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const DEFAULT_DAILY_POST_LIMIT = 5

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * Public GET endpoint — no auth required.
 * Uses service role so RLS on site_settings does not block the read.
 * Called by checkDailyPostLimit (client-side) to retrieve the configured limit.
 */
export async function GET() {
  const supabase = getServiceClient()

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'daily_post_limit')
      .single()

    if (error) {
      // Any DB error (including "no rows found") — return default so publishing isn't blocked
      // by a missing/unconfigured site_settings table.
      return NextResponse.json({ daily_post_limit: DEFAULT_DAILY_POST_LIMIT })
    }

    if (!data) {
      return NextResponse.json({ daily_post_limit: DEFAULT_DAILY_POST_LIMIT })
    }

    const parsed = parseInt((data as { value: string }).value, 10)
    const limit = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_POST_LIMIT

    return NextResponse.json({ daily_post_limit: limit })
  } catch {
    return NextResponse.json({ daily_post_limit: DEFAULT_DAILY_POST_LIMIT })
  }
}
