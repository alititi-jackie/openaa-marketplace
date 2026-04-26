'use client'

export const OPENAA_SHARE_URL = 'https://openaa.com'
export const OPENAA_SHARE_TITLE = 'OpenAA 美国华人生活平台'

type ShareNav = {
  share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>
  clipboard?: { writeText?: (text: string) => Promise<void> }
}

export async function shareOpenAA(): Promise<'shared' | 'copied' | 'unsupported'> {
  const url = OPENAA_SHARE_URL
  const title = OPENAA_SHARE_TITLE

  const nav: ShareNav | undefined = typeof window !== 'undefined'
    ? (window.navigator as unknown as ShareNav)
    : undefined

  try {
    // native share first
    if (nav?.share) {
      await nav.share({ title, url })
      return 'shared'
    }

    // fallback clipboard
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
