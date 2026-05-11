'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ChevronDown, ChevronUp, Share2 } from 'lucide-react'
import { shareOpenAA } from '@/lib/share'

const quickNavItems = [
  { label: '招聘', href: '/jobs' },
  { label: '房屋', href: '/housing' },
  { label: '二手', href: '/secondhand' },
  { label: '本地服务', href: '/services' },
  { label: '新闻', href: '/news' },
  { label: 'DMV', href: 'https://openaa.com/dmv' },
  { label: '导航', href: '/navigation' },
  { label: '反馈', href: '/feedback' },
] as const

export default function Header() {
  const [isQuickNavOpen, setIsQuickNavOpen] = useState(false)
  const touchStartRef = useRef<number | null>(null)
  const touchCurrentRef = useRef<number | null>(null)

  const ChevronIcon = useMemo(() => (isQuickNavOpen ? ChevronUp : ChevronDown), [isQuickNavOpen])

  const toggleQuickNav = () => {
    setIsQuickNavOpen((prev) => !prev)
  }

  const closeQuickNav = () => {
    setIsQuickNavOpen(false)
  }

  const handleQuickNavTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartRef.current = event.touches[0]?.clientY ?? null
    touchCurrentRef.current = touchStartRef.current
  }

  const handleQuickNavTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    touchCurrentRef.current = event.touches[0]?.clientY ?? null
  }

  const handleQuickNavTouchEnd = () => {
    if (touchStartRef.current !== null && touchCurrentRef.current !== null) {
      const deltaY = touchCurrentRef.current - touchStartRef.current
      if (deltaY <= -24) {
        closeQuickNav()
      }
    }

    touchStartRef.current = null
    touchCurrentRef.current = null
  }

  return (
    <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[560px] z-50 bg-white/96 backdrop-blur-md border-b border-zinc-100/80">
      <div className="relative">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left: location picker */}
          <button
            type="button"
            aria-expanded={isQuickNavOpen}
            aria-controls="header-quick-nav"
            className="flex items-center gap-1 text-sm font-semibold text-zinc-700 active:opacity-70 transition-opacity"
            onClick={toggleQuickNav}
          >
            <MapPin size={14} className="text-blue-500" />
            <span>纽约</span>
            <ChevronIcon size={16} strokeWidth={2.4} className="text-blue-500 mt-px" />
          </button>

          {/* Center: logo */}
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 flex items-center select-none"
            aria-label="OpenAA 首页"
          >
            <Image
              src="/openaa-logo.png"
              alt="OpenAA"
              width={36}
              height={36}
              className="rounded-xl object-contain"
              priority
            />
            <span className="ml-1.5 font-extrabold text-[20px] tracking-tight leading-none">
              <span className="text-blue-500">Open</span>
              <span className="text-zinc-800">AA</span>
            </span>
          </Link>

          {/* Right: share */}
          <button
            type="button"
            aria-label="分享"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-50 border border-zinc-100 active:bg-zinc-100 transition-colors"
            onClick={() => {
              void shareOpenAA()
            }}
          >
            <Share2 size={16} className="text-zinc-600" />
          </button>
        </div>

        {isQuickNavOpen ? (
          <div
            id="header-quick-nav"
            className="border-t border-zinc-100/80 bg-white/95 px-3 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"
            onTouchStart={handleQuickNavTouchStart}
            onTouchMove={handleQuickNavTouchMove}
            onTouchEnd={handleQuickNavTouchEnd}
          >
            <div className="flex gap-2 overflow-x-auto whitespace-nowrap pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {quickNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 active:bg-blue-100"
                  onClick={closeQuickNav}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}
