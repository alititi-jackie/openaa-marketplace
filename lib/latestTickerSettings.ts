export type LatestTickerSectionKey = 'news' | 'jobs' | 'housing' | 'secondhand' | 'services'

export interface LatestTickerGlobalSettings {
  is_enabled: boolean
  interval_seconds: number
}

export interface LatestTickerSectionSettings {
  section_key: LatestTickerSectionKey
  section_name: string
  is_enabled: boolean
  sort_order: number
  display_count: number
}

export const MIN_TICKER_INTERVAL_SECONDS = 3
export const MAX_TICKER_INTERVAL_SECONDS = 10
export const DEFAULT_TICKER_INTERVAL_SECONDS = 4
export const MIN_TICKER_DISPLAY_COUNT = 1
export const MAX_TICKER_DISPLAY_COUNT = 20

export const DEFAULT_LATEST_TICKER_GLOBAL_SETTINGS: LatestTickerGlobalSettings = {
  is_enabled: true,
  interval_seconds: DEFAULT_TICKER_INTERVAL_SECONDS,
}

export const DEFAULT_LATEST_TICKER_SECTION_SETTINGS: LatestTickerSectionSettings[] = [
  { section_key: 'news', section_name: '新闻', is_enabled: true, sort_order: 10, display_count: 5 },
  { section_key: 'jobs', section_name: '招聘', is_enabled: true, sort_order: 20, display_count: 3 },
  { section_key: 'housing', section_name: '房屋', is_enabled: true, sort_order: 30, display_count: 3 },
  { section_key: 'secondhand', section_name: '二手', is_enabled: true, sort_order: 40, display_count: 3 },
  { section_key: 'services', section_name: '本地服务', is_enabled: true, sort_order: 50, display_count: 3 },
]

export const VALID_LATEST_TICKER_SECTION_KEYS = new Set(
  DEFAULT_LATEST_TICKER_SECTION_SETTINGS.map((section) => section.section_key),
)

export function normalizeLatestTickerGlobalSettings(input: unknown): LatestTickerGlobalSettings {
  if (!input || typeof input !== 'object') return { ...DEFAULT_LATEST_TICKER_GLOBAL_SETTINGS }
  const raw = input as Partial<LatestTickerGlobalSettings>
  return {
    is_enabled:
      typeof raw.is_enabled === 'boolean'
        ? raw.is_enabled
        : DEFAULT_LATEST_TICKER_GLOBAL_SETTINGS.is_enabled,
    interval_seconds: clampTickerIntervalSeconds(
      typeof raw.interval_seconds === 'number'
        ? raw.interval_seconds
        : DEFAULT_LATEST_TICKER_GLOBAL_SETTINGS.interval_seconds,
    ),
  }
}

export function clampTickerIntervalSeconds(value: number): number {
  const normalized = Number.isFinite(value) ? Math.trunc(value) : DEFAULT_TICKER_INTERVAL_SECONDS
  return Math.min(MAX_TICKER_INTERVAL_SECONDS, Math.max(MIN_TICKER_INTERVAL_SECONDS, normalized))
}

export function clampTickerDisplayCount(value: number): number {
  const normalized = Number.isFinite(value) ? Math.trunc(value) : MIN_TICKER_DISPLAY_COUNT
  return Math.min(MAX_TICKER_DISPLAY_COUNT, Math.max(MIN_TICKER_DISPLAY_COUNT, normalized))
}

export function normalizeLatestTickerSections(
  input: unknown,
): LatestTickerSectionSettings[] {
  if (!Array.isArray(input)) return [...DEFAULT_LATEST_TICKER_SECTION_SETTINGS]

  const map = new Map<string, LatestTickerSectionSettings>()
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue
    const item = raw as Partial<LatestTickerSectionSettings>
    if (!item.section_key || !VALID_LATEST_TICKER_SECTION_KEYS.has(item.section_key)) continue
    if (typeof item.is_enabled !== 'boolean') continue
    if (typeof item.sort_order !== 'number' || !Number.isInteger(item.sort_order)) continue
    if (typeof item.display_count !== 'number' || !Number.isInteger(item.display_count)) continue
    const fallback = DEFAULT_LATEST_TICKER_SECTION_SETTINGS.find((section) => section.section_key === item.section_key)
    map.set(item.section_key, {
      section_key: item.section_key,
      section_name: fallback?.section_name ?? item.section_key,
      is_enabled: item.is_enabled,
      sort_order: item.sort_order,
      display_count: clampTickerDisplayCount(item.display_count),
    })
  }

  return DEFAULT_LATEST_TICKER_SECTION_SETTINGS.map(
    (fallback) => map.get(fallback.section_key) ?? { ...fallback },
  ).sort((a, b) => a.sort_order - b.sort_order)
}
