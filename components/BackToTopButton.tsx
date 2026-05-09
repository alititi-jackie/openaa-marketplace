'use client'

import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'

export default function BackToTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let rafId: number | null = null
    const handleScroll = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        setVisible(window.scrollY > 500)
        rafId = null
      })
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [])

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="回到顶部"
      className="fixed right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-blue-100 bg-white shadow-md text-blue-600"
      style={{ bottom: '88px' }}
    >
      <ChevronUp size={22} />
    </button>
  )
}
