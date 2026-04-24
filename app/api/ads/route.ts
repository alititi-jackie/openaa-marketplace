import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const VALID_POSITIONS = ['home', 'jobs', 'housing', 'marketplace'] as const
type AdPosition = (typeof VALID_POSITIONS)[number]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const position = searchParams.get('position') as AdPosition | null

  if (!position || !VALID_POSITIONS.includes(position)) {
    return NextResponse.json(
      { error: 'Invalid or missing position. Must be one of: home, jobs, housing, marketplace' },
      { status: 400 }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('ads')
    .select('id, image_url, link_url, position, start_date, end_date, is_active, created_at')
    .eq('is_active', true)
    .eq('position', position)
    .or(
      `and(start_date.is.null,end_date.is.null),` +
      `and(start_date.is.null,end_date.gte.${now}),` +
      `and(start_date.lte.${now},end_date.is.null),` +
      `and(start_date.lte.${now},end_date.gte.${now})`
    )
    .order('start_date', { ascending: false, nullsFirst: false })
    .limit(5)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data: data ?? [] })
}
