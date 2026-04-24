import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const position = searchParams.get('position')

  if (!position || !['home', 'jobs', 'secondhand'].includes(position)) {
    return NextResponse.json({ error: 'position must be home, jobs, or secondhand' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const now = new Date().toISOString()

  // (start_date IS NULL OR start_date <= now) AND (end_date IS NULL OR end_date >= now)
  const { data, error } = await supabase
    .from('ads')
    .select('id, image_url, link_url, position, start_date, end_date')
    .eq('position', position)
    .eq('is_active', true)
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data ?? [])
}
