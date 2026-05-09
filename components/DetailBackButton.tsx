'use client'

import { useRouter } from 'next/navigation'

interface DetailBackButtonProps {
  fallbackHref: string
  label?: string
}

export default function DetailBackButton({ fallbackHref, label = '← 返回' }: DetailBackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
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
      className="sticky top-14 z-30 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-sm text-blue-600 shadow-sm border border-blue-100 backdrop-blur mb-4"
    >
      {label}
    </button>
  )
}
