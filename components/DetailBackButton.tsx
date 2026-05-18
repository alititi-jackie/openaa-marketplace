'use client'

import { useRouter } from 'next/navigation'

interface DetailBackButtonProps {
  fallbackHref: string
  label?: string
  inToolbar?: boolean
  forceHref?: boolean
}

export default function DetailBackButton({ fallbackHref, label = '← 返回', inToolbar = false, forceHref = false }: DetailBackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (forceHref) {
      router.push(fallbackHref)
      return
    }

    // Use document.referrer as a more reliable signal that there is a previous page to return to.
    // window.history.length > 2 ensures we're not on the first page of a new session.
    const hasPriorPage =
      typeof window !== 'undefined' &&
      (document.referrer !== '' || window.history.length > 2)

    if (hasPriorPage) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`z-30 inline-flex shrink-0 items-center gap-1 rounded-full border border-blue-100 bg-white/95 px-3 py-1.5 text-sm text-blue-600 shadow-sm backdrop-blur ${
        inToolbar ? '' : 'sticky top-14 mb-4'
      }`}
    >
      {label}
    </button>
  )
}
