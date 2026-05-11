import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

type TopQuickLink = {
  id: string
  title: string
  url: string
  sort_order: number
  open_mode: 'same' | 'new'
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('top_quick_links')
    .select('id, title, url, sort_order, open_mode')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const normalized: TopQuickLink[] = ((data ?? []) as Record<string, unknown>[])
    .map((row) => {
      const id = typeof row.id === 'string' ? row.id : ''
      const title = typeof row.title === 'string' ? row.title : ''
      const url = typeof row.url === 'string' ? row.url : ''
      const sort_order =
        typeof row.sort_order === 'number' && Number.isFinite(row.sort_order) ? Math.floor(row.sort_order) : 0
      const open_mode: TopQuickLink['open_mode'] = row.open_mode === 'new' ? 'new' : 'same'
      return { id, title, url, sort_order, open_mode }
    })
    .filter((row) => row.id && row.title && row.url && row.sort_order >= 0)

  return NextResponse.json({ data: normalized })
}
