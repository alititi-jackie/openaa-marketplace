import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_HOME_LATEST_SECTIONS } from '@/lib/homeSections'
import {
  clampTickerDisplayCount,
  clampTickerIntervalSeconds,
  DEFAULT_LATEST_TICKER_GLOBAL_SETTINGS,
  normalizeLatestTickerSections,
  type LatestTickerGlobalSettings,
  type LatestTickerSectionSettings,
  VALID_LATEST_TICKER_SECTION_KEYS,
} from '@/lib/latestTickerSettings'

export const dynamic = 'force-dynamic'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function checkAdminToken(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token')
  return token === process.env.ADMIN_TOKEN && !!process.env.ADMIN_TOKEN
}

type PatchPayload = {
  sections?: Array<{
    section_key: string
    is_visible: boolean
    display_order: number
    limit_count: number
  }>
  latest_ticker?: {
    global: LatestTickerGlobalSettings
    sections: Array<{
      section_key: string
      is_enabled: boolean
      sort_order: number
      display_count: number
    }>
  }
}

const VALID_SECTION_KEYS = new Set(DEFAULT_HOME_LATEST_SECTIONS.map((section) => section.section_key))

async function fetchLatestTickerSettings(supabase: ReturnType<typeof getServiceClient>) {
  const [globalResult, sectionsResult] = await Promise.all([
    supabase.from('latest_ticker_global_settings').select('is_enabled, interval_seconds').eq('id', 1).maybeSingle(),
    supabase
      .from('latest_ticker_sections')
      .select('section_key, section_name, is_enabled, sort_order, display_count')
      .order('sort_order', { ascending: true })
      .order('section_key', { ascending: true }),
  ])

  const global = globalResult.error
    ? { ...DEFAULT_LATEST_TICKER_GLOBAL_SETTINGS }
    : {
        is_enabled:
          typeof globalResult.data?.is_enabled === 'boolean'
            ? globalResult.data.is_enabled
            : DEFAULT_LATEST_TICKER_GLOBAL_SETTINGS.is_enabled,
        interval_seconds: clampTickerIntervalSeconds(
          Number(globalResult.data?.interval_seconds ?? DEFAULT_LATEST_TICKER_GLOBAL_SETTINGS.interval_seconds),
        ),
      }

  const sections = sectionsResult.error
    ? normalizeLatestTickerSections([])
    : normalizeLatestTickerSections(sectionsResult.data ?? [])

  return {
    global,
    sections,
  }
}

export async function GET(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('home_latest_sections')
    .select('section_key, section_name, section_type, parent_key, is_visible, display_order, limit_count')
    .order('display_order', { ascending: true })
    .order('section_key', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const latestTicker = await fetchLatestTickerSettings(supabase)

  return NextResponse.json({ data: data ?? [], latest_ticker: latestTicker })
}

export async function PATCH(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const body = (await request.json()) as Partial<PatchPayload>
  const hasSections = Array.isArray(body.sections)
  const hasLatestTicker = Boolean(body.latest_ticker)
  if (!hasSections && !hasLatestTicker) {
    return NextResponse.json({ error: '至少需要传 sections 或 latest_ticker' }, { status: 400 })
  }

  if (hasSections && (!body.sections || body.sections.length === 0)) {
    return NextResponse.json({ error: 'sections 不能为空' }, { status: 400 })
  }

  if (hasSections && body.sections) {
    for (const item of body.sections) {
      if (typeof item.section_key !== 'string' || !item.section_key.trim()) {
        return NextResponse.json({ error: 'section_key 无效' }, { status: 400 })
      }
      if (!VALID_SECTION_KEYS.has(item.section_key.trim())) {
        return NextResponse.json({ error: `不支持的 section_key: ${item.section_key}` }, { status: 400 })
      }
      if (typeof item.is_visible !== 'boolean') {
        return NextResponse.json({ error: 'is_visible 必须为 boolean' }, { status: 400 })
      }
      if (
        typeof item.display_order !== 'number' ||
        !Number.isInteger(item.display_order) ||
        item.display_order < 0
      ) {
        return NextResponse.json({ error: 'display_order 必须是 >= 0 的整数' }, { status: 400 })
      }
      if (
        typeof item.limit_count !== 'number' ||
        !Number.isInteger(item.limit_count) ||
        item.limit_count < 1 ||
        item.limit_count > 30
      ) {
        return NextResponse.json({ error: 'limit_count 必须是 1~30 的整数' }, { status: 400 })
      }
    }
  }

  const supabase = getServiceClient()
  const updatedAt = new Date().toISOString()

  if (hasSections && body.sections) {
    for (const item of body.sections) {
      const { error } = await supabase
        .from('home_latest_sections')
        .update({
          is_visible: item.is_visible,
          display_order: item.display_order,
          limit_count: item.limit_count,
          updated_at: updatedAt,
        })
        .eq('section_key', item.section_key.trim())

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }
  }

  if (hasLatestTicker && body.latest_ticker) {
    const globalPayload = body.latest_ticker.global
    if (!globalPayload || typeof globalPayload !== 'object') {
      return NextResponse.json({ error: 'latest_ticker.global 无效' }, { status: 400 })
    }
    if (typeof globalPayload.is_enabled !== 'boolean') {
      return NextResponse.json({ error: 'latest_ticker.global.is_enabled 必须为 boolean' }, { status: 400 })
    }
    if (
      typeof globalPayload.interval_seconds !== 'number' ||
      !Number.isInteger(globalPayload.interval_seconds) ||
      globalPayload.interval_seconds < 3 ||
      globalPayload.interval_seconds > 10
    ) {
      return NextResponse.json({ error: 'latest_ticker.global.interval_seconds 必须是 3~10 的整数' }, { status: 400 })
    }

    if (!Array.isArray(body.latest_ticker.sections) || body.latest_ticker.sections.length === 0) {
      return NextResponse.json({ error: 'latest_ticker.sections 不能为空' }, { status: 400 })
    }
    for (const section of body.latest_ticker.sections) {
      if (
        typeof section.section_key !== 'string' ||
        !VALID_LATEST_TICKER_SECTION_KEYS.has(section.section_key as LatestTickerSectionSettings['section_key'])
      ) {
        return NextResponse.json({ error: `不支持的 latest_ticker section_key: ${section.section_key}` }, { status: 400 })
      }
      if (typeof section.is_enabled !== 'boolean') {
        return NextResponse.json({ error: 'latest_ticker.sections[].is_enabled 必须为 boolean' }, { status: 400 })
      }
      if (typeof section.sort_order !== 'number' || !Number.isInteger(section.sort_order)) {
        return NextResponse.json({ error: 'latest_ticker.sections[].sort_order 必须为整数' }, { status: 400 })
      }
      if (
        typeof section.display_count !== 'number' ||
        !Number.isInteger(section.display_count) ||
        section.display_count < 1 ||
        section.display_count > 20
      ) {
        return NextResponse.json({ error: 'latest_ticker.sections[].display_count 必须是 1~20 的整数' }, { status: 400 })
      }
    }

    const { error: globalError } = await supabase.from('latest_ticker_global_settings').upsert(
      {
        id: 1,
        is_enabled: globalPayload.is_enabled,
        interval_seconds: clampTickerIntervalSeconds(globalPayload.interval_seconds),
        updated_at: updatedAt,
      },
      {
        onConflict: 'id',
      },
    )
    if (globalError) {
      return NextResponse.json({ error: globalError.message }, { status: 500 })
    }

    const sectionNameMap = new Map(
      normalizeLatestTickerSections([]).map((section) => [section.section_key, section.section_name]),
    )
    const upsertRows: LatestTickerSectionSettings[] = body.latest_ticker.sections.map((section) => ({
      section_key: section.section_key as LatestTickerSectionSettings['section_key'],
      section_name:
        sectionNameMap.get(section.section_key as LatestTickerSectionSettings['section_key']) ?? section.section_key,
      is_enabled: section.is_enabled,
      sort_order: section.sort_order,
      display_count: clampTickerDisplayCount(section.display_count),
    }))

    const { error: sectionError } = await supabase.from('latest_ticker_sections').upsert(
      upsertRows.map((row) => ({ ...row, updated_at: updatedAt })),
      {
        onConflict: 'section_key',
      },
    )
    if (sectionError) {
      return NextResponse.json({ error: sectionError.message }, { status: 500 })
    }
  }

  const { data, error: fetchError } = await supabase
    .from('home_latest_sections')
    .select('section_key, section_name, section_type, parent_key, is_visible, display_order, limit_count')
    .order('display_order', { ascending: true })
    .order('section_key', { ascending: true })

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  const latestTicker = await fetchLatestTickerSettings(supabase)

  return NextResponse.json({
    data: data ?? [],
    latest_ticker: latestTicker,
  })
}
