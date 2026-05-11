import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

interface SearchResult {
  type: 'news' | 'job' | 'housing' | 'secondhand' | 'service'
  label: string
  title: string
  subtitle: string
  excerpt: string
  href: string
  created_at: string
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawQ = searchParams.get('q') ?? ''
  const q = rawQ.trim()

  if (q.length < 1) {
    return NextResponse.json({ data: [] })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const like = (col: string) => `${col}.ilike.%${q}%`

  const [newsResult, jobsResult, housingResult, secondhandResult, servicesResult] = await Promise.all([
    // News: only is_published = true
    supabase
      .from('news_posts')
      .select('id, slug, title, summary, category, created_at, published_at')
      .eq('is_published', true)
      .or(`${like('title')},${like('summary')},${like('category')}`)
      .order('created_at', { ascending: false })
      .limit(5),

    // Jobs: only status = 'published'
    supabase
      .from('job_postings')
      .select('id, title, company, description, location, created_at')
      .eq('status', 'published')
      .or(`${like('title')},${like('company')},${like('description')},${like('location')}`)
      .order('created_at', { ascending: false })
      .limit(5),

    // Housing: only status = 'published'
    supabase
      .from('housing_posts')
      .select('id, title, description, location, created_at')
      .eq('status', 'published')
      .or(`${like('title')},${like('description')},${like('location')}`)
      .order('created_at', { ascending: false })
      .limit(5),

    // Secondhand: only status = 'published' (table is secondhand_items)
    supabase
      .from('secondhand_items')
      .select('id, title, description, category, created_at')
      .eq('status', 'published')
      .or(`${like('title')},${like('description')},${like('category')}`)
      .order('created_at', { ascending: false })
      .limit(5),

    // Services: only status = 'active' AND is_active = true
    supabase
      .from('service_posts')
      .select('id, title, description, category, location, created_at')
      .eq('status', 'active')
      .eq('is_active', true)
      .or(`${like('title')},${like('description')},${like('category')},${like('location')}`)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const results: SearchResult[] = []

  for (const item of (newsResult.data ?? [])) {
    results.push({
      type: 'news',
      label: '新闻',
      title: String(item.title ?? ''),
      subtitle: String(item.category ?? ''),
      excerpt: String(item.summary ?? ''),
      href: `/news/${item.slug}`,
      created_at: String(item.published_at ?? item.created_at ?? ''),
    })
  }

  for (const item of (jobsResult.data ?? [])) {
    const loc = item.location ? ` · ${item.location}` : ''
    results.push({
      type: 'job',
      label: '招聘',
      title: String(item.title ?? ''),
      subtitle: `${item.company ?? ''}${loc}`,
      excerpt: String(item.description ?? ''),
      href: `/jobs/${item.id}`,
      created_at: String(item.created_at ?? ''),
    })
  }

  for (const item of (housingResult.data ?? [])) {
    results.push({
      type: 'housing',
      label: '房屋',
      title: String(item.title ?? ''),
      subtitle: String(item.location ?? ''),
      excerpt: String(item.description ?? ''),
      href: `/housing/${item.id}`,
      created_at: String(item.created_at ?? ''),
    })
  }

  for (const item of (secondhandResult.data ?? [])) {
    results.push({
      type: 'secondhand',
      label: '二手',
      title: String(item.title ?? ''),
      subtitle: String(item.category ?? ''),
      excerpt: String(item.description ?? ''),
      href: `/secondhand/${item.id}`,
      created_at: String(item.created_at ?? ''),
    })
  }

  for (const item of (servicesResult.data ?? [])) {
    const loc = item.location ? ` · ${item.location}` : ''
    results.push({
      type: 'service',
      label: '本地服务',
      title: String(item.title ?? ''),
      subtitle: `${item.category ?? ''}${loc}`,
      excerpt: String(item.description ?? ''),
      href: `/services/${item.id}`,
      created_at: String(item.created_at ?? ''),
    })
  }

  // Sort combined results by created_at descending
  results.sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0
    return tb - ta
  })

  return NextResponse.json({ data: results.slice(0, 25) })
}
