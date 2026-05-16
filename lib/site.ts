export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://ny.openaa.com').replace(/\/+$/, '')

export function toAbsoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${normalizedPath}`
}
