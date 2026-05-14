import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  clampTickerIntervalSeconds,
  DEFAULT_LATEST_TICKER_GLOBAL_SETTINGS,
  DEFAULT_LATEST_TICKER_SECTION_SETTINGS,
  normalizeLatestTickerGlobalSettings,
  normalizeLatestTickerSections,
} from '@/lib/latestTickerSettings'
import { isPublicOwnerVisible } from '@/lib/publicVisibility'

export const dynamic = 'force-dynamic'

export interface TickerItem {
  type: 'news' | 'job' | 'housing' | 'secondhand' | 'service'
  label: string
  title: string
  subtitle: string
  href: string
  created_at: string
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET() {
  const supabase = getServiceClient()

  const [globalResult, sectionResult] = await Promise.all([
    supabase.from('latest_ticker_global_settings').select('is_enabled, interval_seconds').eq('id', 1).maybeSingle(),
    supabase
      .from('latest_ticker_sections')
      .select('section_key, section_name, is_enabled, sort_order, display_count')
      .order('sort_order', { ascending: true })
      .order('section_key', { ascending: true }),
  ])

  const globalConfig = globalResult.error
    ? { ...DEFAULT_LATEST_TICKER_GLOBAL_SETTINGS }
    : normalizeLatestTickerGlobalSettings(globalResult.data)
  const sectionsConfig = sectionResult.error
    ? [...DEFAULT_LATEST_TICKER_SECTION_SETTINGS]
    : normalizeLatestTickerSections(sectionResult.data)

  if (!globalConfig.is_enabled) {
    return NextResponse.json({
      data: [],
      is_enabled: false,
      interval_seconds: clampTickerIntervalSeconds(globalConfig.interval_seconds),
    })
  }

  const enabledSections = sectionsConfig.filter((section) => section.is_enabled).sort((a, b) => a.sort_order - b.sort_order)
  const items: TickerItem[] = []

  for (const section of enabledSections) {
    if (section.section_key === 'news') {
      const result = await supabase
        .from('news_posts')
        .select('id, slug, title, summary, category, created_at, published_at')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(section.display_count)
      for (const item of result.data ?? []) {
        items.push({
          type: 'news',
          label: '新闻',
          title: String(item.title ?? ''),
          subtitle: String(item.category ?? ''),
          href: `/news/${item.slug}`,
          created_at: String(item.published_at ?? item.created_at ?? ''),
        })
      }
      continue
    }

    if (section.section_key === 'jobs') {
      const result = await supabase
        .from('job_postings')
        .select('id, title, company, location, created_at, user:users(status)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(section.display_count)
      for (const item of (result.data ?? []).filter((row) => isPublicOwnerVisible((row as { user?: unknown }).user))) {
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
      continue
    }

    if (section.section_key === 'housing') {
      const result = await supabase
        .from('housing_posts')
        .select('id, title, location, created_at, user:users(status)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(section.display_count)
      for (const item of (result.data ?? []).filter((row) => isPublicOwnerVisible((row as { user?: unknown }).user))) {
        items.push({
          type: 'housing',
          label: '房屋',
          title: String(item.title ?? ''),
          subtitle: String(item.location ?? ''),
          href: `/housing/${item.id}`,
          created_at: String(item.created_at ?? ''),
        })
      }
      continue
    }

    if (section.section_key === 'secondhand') {
      const result = await supabase
        .from('secondhand_items')
        .select('id, title, category, created_at, user:users(status)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(section.display_count)
      for (const item of (result.data ?? []).filter((row) => isPublicOwnerVisible((row as { user?: unknown }).user))) {
        items.push({
          type: 'secondhand',
          label: '二手',
          title: String(item.title ?? ''),
          subtitle: String(item.category ?? ''),
          href: `/secondhand/${item.id}`,
          created_at: String(item.created_at ?? ''),
        })
      }
      continue
    }

    if (section.section_key === 'services') {
      const result = await supabase
        .from('service_posts')
        .select('id, title, category, location, created_at, user:users(status)')
        .eq('status', 'active')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(section.display_count)
      for (const item of (result.data ?? []).filter((row) => isPublicOwnerVisible((row as { user?: unknown }).user))) {
        const loc = item.location ? ` ${item.location}` : ''
        items.push({
          type: 'service',
          label: '本地服务',
          title: String(item.title ?? ''),
          subtitle: `${item.category ?? ''}${loc}`.trim(),
          href: `/services/${item.id}`,
          created_at: String(item.created_at ?? ''),
        })
      }
    }
  }

  return NextResponse.json({
    data: items,
    is_enabled: true,
    interval_seconds: clampTickerIntervalSeconds(globalConfig.interval_seconds),
  })
}
