export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://ny.openaa.com').replace(/\/+$/, '')

export function getSiteUrl(path = ''): string {
  if (/^https?:\/\//i.test(path)) return path
  const base = SITE_URL.replace(/\/+$/, '')
  if (!path) return base
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalizedPath}`
}

export function toAbsoluteUrl(path: string): string {
  return getSiteUrl(path)
}
