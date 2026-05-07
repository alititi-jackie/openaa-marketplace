'use client'

import { useRouter } from 'next/navigation'

interface DetailBackButtonProps {
  fallbackHref: string
}

export default function DetailBackButton({ fallbackHref }: DetailBackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
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
      ← 返回
    </button>
  )
}
