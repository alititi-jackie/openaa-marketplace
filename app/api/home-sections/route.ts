import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('home_latest_sections')
    .select('section_key, section_name, section_type, parent_key, is_visible, display_order, limit_count')
    .eq('is_visible', true)
    .order('display_order', { ascending: true })
    .order('section_key', { ascending: true })

  if (error) {
    console.error('GET /api/home-sections query failed:', error)
    return NextResponse.json({ error: 'Failed to fetch home sections' }, { status: 500, headers: NO_STORE_HEADERS })
  }

  return NextResponse.json({ data: data ?? [] }, { headers: NO_STORE_HEADERS })
}
