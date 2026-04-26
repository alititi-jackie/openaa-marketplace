'use client'

export const OPENAA_SHARE_URL = 'https://openaa.com'
export const OPENAA_SHARE_TITLE = 'OpenAA 美国华人生活平台'

export async function shareOpenAA(): Promise<'shared' | 'copied' | 'unsupported'> {
  const url = OPENAA_SHARE_URL
  const title = OPENAA_SHARE_TITLE

  const nav = typeof window !== 'undefined' ? window.navigator : undefined

  try {
    if (nav && 'share' in nav) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (nav as any).share({ title, url })
      return 'shared'
    }

    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(url)
      return 'copied'
    }

    // Last resort: try to copy via execCommand
    if (typeof document !== 'undefined') {
      const el = document.createElement('textarea')
      el.value = url
      el.setAttribute('readonly', '')
      el.style.position = 'absolute'
      el.style.left = '-9999px'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      return 'copied'
    }

    return 'unsupported'
  } catch {
    // If share failed (user canceled or error), try clipboard
    try {
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(url)
        return 'copied'
      }
    } catch {
      // ignore
    }
    return 'unsupported'
  }
}
