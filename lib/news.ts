export const NEWS_CATEGORIES = [
  '新手指南',
  '平台公告',
  '本地新闻',
  'DMV教程',
  '生活指南',
] as const

export const NEWS_FILTER_CATEGORIES = ['全部', ...NEWS_CATEGORIES] as const

export const NEWS_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const NEWS_DEFAULT_SEO_DESCRIPTION =
  'OpenAA 美国华人生活资讯、平台公告、新手指南与实用教程。'

export type NewsCategory = (typeof NEWS_CATEGORIES)[number]
export type NewsFilterCategory = (typeof NEWS_FILTER_CATEGORIES)[number]

export function isNewsCategory(value: string): value is NewsCategory {
  return NEWS_CATEGORIES.includes(value as NewsCategory)
}

export function normalizeNewsFilterCategory(value: string | null): NewsFilterCategory {
  if (!value) return '全部'
  if (value === '全部') return value
  return isNewsCategory(value) ? value : '全部'
}
