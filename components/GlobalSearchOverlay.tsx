'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronUp } from 'lucide-react'
import SearchContent from './SearchContent'

interface GlobalSearchOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export default function GlobalSearchOverlay({ isOpen, onClose }: GlobalSearchOverlayProps) {
  const [mounted, setMounted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !isOpen) return

    let rafId: number | null = null
    const handleScroll = () => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        setShowBackToTop(el.scrollTop > 500)
        rafId = null
      })
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', handleScroll)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setShowBackToTop(false)
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0
      }
    }
  }, [isOpen])

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!mounted || !isOpen) return null

  return createPortal(
    <div
      className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[560px] z-[100]"
      style={{ height: '100dvh' }}
    >
      <div className="flex flex-col h-full bg-white">
        {/* Top bar: back button + title */}
        <div className="flex items-center h-14 px-4 border-b border-zinc-100 shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭搜索"
            className="flex items-center justify-center w-9 h-9 rounded-full active:bg-zinc-100 transition-colors mr-2 shrink-0"
          >
            <ChevronLeft size={22} className="text-zinc-700" />
          </button>
          <h2 className="text-base font-bold text-zinc-900">OpenAA 站内搜索</h2>
        </div>

        {/* Scrollable content area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <SearchContent autoFocus onResultClick={onClose} />
          {/* Bottom padding so content clears the mobile nav bar */}
          <div className="h-20" />
        </div>
      </div>

      {/* Back to top — positioned inside the overlay panel */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="回到顶部"
          className="absolute right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-blue-100 bg-white shadow-md text-blue-600"
          style={{ bottom: '88px' }}
        >
          <ChevronUp size={22} />
        </button>
      )}
    </div>,
    document.body,
  )
}
