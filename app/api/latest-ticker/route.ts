import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export interface TickerItem {
  type: 'news' | 'job' | 'housing' | 'secondhand' | 'service'
  label: string
  title: string
  subtitle: string
  href: string
  created_at: string
}

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [newsResult, jobsResult, housingResult, secondhandResult, servicesResult] =
    await Promise.all([
      // News: is_published = true
      supabase
        .from('news_posts')
        .select('id, slug, title, summary, category, created_at, published_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(3),

      // Jobs: status = 'published'
      supabase
        .from('job_postings')
        .select('id, title, company, location, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3),

      // Housing: status = 'published'
      supabase
        .from('housing_posts')
        .select('id, title, location, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3),

      // Secondhand: status = 'published'
      supabase
        .from('secondhand_items')
        .select('id, title, category, created_at')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(3),

      // Services: status = 'active' AND is_active = true
      supabase
        .from('service_posts')
        .select('id, title, category, location, created_at')
        .eq('status', 'active')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3),
    ])

  const items: TickerItem[] = []

  for (const item of newsResult.data ?? []) {
    items.push({
      type: 'news',
      label: '新闻',
      title: String(item.title ?? ''),
      subtitle: String(item.category ?? ''),
      href: `/news/${item.slug}`,
      created_at: String(item.published_at ?? item.created_at ?? ''),
    })
  }

  for (const item of jobsResult.data ?? []) {
    const loc = item.location ? ` ${item.location}` : ''
    items.push({
      type: 'job',
      label: '招聘',
      title: String(item.title ?? ''),
      subtitle: `${item.company ?? ''}${loc}`.trim(),
      href: `/jobs/${item.id}`,
      created_at: String(item.created_at ?? ''),
    })
  }

  for (const item of housingResult.data ?? []) {
    items.push({
      type: 'housing',
      label: '房屋',
      title: String(item.title ?? ''),
      subtitle: String(item.location ?? ''),
      href: `/housing/${item.id}`,
      created_at: String(item.created_at ?? ''),
    })
  }

  for (const item of secondhandResult.data ?? []) {
    items.push({
      type: 'secondhand',
      label: '二手',
      title: String(item.title ?? ''),
      subtitle: String(item.category ?? ''),
      href: `/secondhand/${item.id}`,
      created_at: String(item.created_at ?? ''),
    })
  }

  for (const item of servicesResult.data ?? []) {
    const loc = item.location ? ` ${item.location}` : ''
    items.push({
      type: 'service',
      label: '服务',
      title: String(item.title ?? ''),
      subtitle: `${item.category ?? ''}${loc}`.trim(),
      href: `/services/${item.id}`,
      created_at: String(item.created_at ?? ''),
    })
  }

  // Sort by created_at descending, keep top 10
  items.sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0
    return tb - ta
  })

  return NextResponse.json({ data: items.slice(0, 10) })
}
