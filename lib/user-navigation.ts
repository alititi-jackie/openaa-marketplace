export type OpenMode = 'auto' | 'same' | 'new'
export type NavigationDefault = 'public' | 'my'

function getConfiguredOpenAAHosts(): string[] {
  const hosts = ['openaa.com', 'app.openaa.com', 'www.openaa.com']

  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      hosts.push(new URL(process.env.NEXT_PUBLIC_APP_URL).hostname)
    } catch {
      // ignore invalid env config and fall back to known hosts
    }
  }

  return Array.from(new Set(hosts.map((item) => item.toLowerCase().replace(/^www\./, ''))))
}

const OPENAA_HOSTS = getConfiguredOpenAAHosts()

const FRIENDLY_SITE_NAMES: Record<string, string> = {
  'amazon.com': 'Amazon',
  'chat.openai.com': 'ChatGPT',
  'dmv.ny.gov': 'NY DMV',
  'facebook.com': 'Facebook',
  'gmail.com': 'Gmail',
  'google.com': 'Google',
  'instagram.com': 'Instagram',
  'irs.gov': 'IRS',
  'linkedin.com': 'LinkedIn',
  'mail.google.com': 'Gmail',
  'openai.com': 'OpenAI',
  'outlook.live.com': 'Outlook',
  'reddit.com': 'Reddit',
  'ssa.gov': 'SSA',
  'uscis.gov': 'USCIS',
  'walmart.com': 'Walmart',
  'x.com': 'X',
  'youtube.com': 'YouTube',
}

export function sanitizeRedirectPath(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return null
  return trimmed
}

export function normalizeNavigationUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('/')) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function isValidNavigationUrl(url: string): boolean {
  if (!url) return false
  if (url.startsWith('/')) return !url.startsWith('//')

  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function getNormalizedHostname(url: string): string | null {
  if (!isValidNavigationUrl(url) || url.startsWith('/')) return null

  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
}

export function getFriendlySiteName(url: string): string {
  const normalizedUrl = normalizeNavigationUrl(url)

  if (!isValidNavigationUrl(normalizedUrl)) return ''
  if (normalizedUrl.startsWith('/')) return 'OpenAA'

  const hostname = getNormalizedHostname(normalizedUrl)
  if (!hostname) return ''

  if (FRIENDLY_SITE_NAMES[hostname]) {
    return FRIENDLY_SITE_NAMES[hostname]
  }

  const primaryLabel = hostname.split('.')[0] ?? ''
  if (!primaryLabel) return ''

  return primaryLabel.charAt(0).toUpperCase() + primaryLabel.slice(1)
}

export function getNavigationDomain(url: string): string {
  const normalizedUrl = normalizeNavigationUrl(url)
  if (!isValidNavigationUrl(normalizedUrl)) return ''
  if (normalizedUrl.startsWith('/')) return 'openaa.com'
  return getNormalizedHostname(normalizedUrl) ?? ''
}

export function resolveNavigationOpenTarget(url: string, mode: OpenMode): 'same' | 'new' {
  if (mode === 'same') return 'same'
  if (mode === 'new') return 'new'

  const normalizedUrl = normalizeNavigationUrl(url)
  if (normalizedUrl.startsWith('/') || normalizedUrl.startsWith('#')) return 'same'

  try {
    const host = new URL(normalizedUrl).hostname.replace(/^www\./, '').toLowerCase()
    if (OPENAA_HOSTS.some((item) => host === item || host.endsWith(`.${item}`))) {
      return 'same'
    }
  } catch {
    return 'same'
  }

  return 'new'
}
