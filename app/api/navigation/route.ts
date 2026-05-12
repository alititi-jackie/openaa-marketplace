import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = getServiceClient()

  const { data: categories, error: catError } = await supabase
    .from('navigation_categories')
    .select('id, name, slug, sort_order, display_limit')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (catError) {
    return NextResponse.json({ error: catError.message }, { status: 400 })
  }

  const { data: links, error: linkError } = await supabase
    .from('navigation_links')
    .select('id, category_id, title, url, description, open_mode, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 400 })
  }

  return NextResponse.json({ categories: categories ?? [], links: links ?? [] })
}
