'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface Ad {
  id: string
  image_url: string
  link_url: string
}

const fallbackSlides = [
  {
    id: 'f1',
    title: '纽约华人生活圈',
    subtitle: '招聘 · 房屋 · 二手 · 服务一站搞定',
    href: '/',
    badge: '精选推荐',
    gradient: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 60%, #60a5fa 100%)',
  },
  {
    id: 'f2',
    title: '最新招聘信息',
    subtitle: '数百个华人职位 · 每日更新',
    href: '/jobs',
    badge: '热门招聘',
    gradient: 'linear-gradient(135deg, #065f46 0%, #10b981 60%, #34d399 100%)',
  },
  {
    id: 'f3',
    title: '二手好物淘不停',
    subtitle: '闲置变现 · 低价好货等你来',
    href: '/secondhand',
    badge: '二手交易',
    gradient: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 60%, #a78bfa 100%)',
  },
  {
    id: 'f4',
    title: 'DMV 驾照一站通',
    subtitle: '预约 · 笔试 · 路考 · 换驾照',
    href: '/dmv',
    badge: 'DMV 服务',
    gradient: 'linear-gradient(135deg, #92400e 0%, #f59e0b 60%, #fcd34d 100%)',
  },
  {
    id: 'f5',
    title: '新手移民指南',
    subtitle: '开户 · 租房 · 驾照 · 社区资源',
    href: '/guide',
    badge: '新手必读',
    gradient: 'linear-gradient(135deg, #9f1239 0%, #e11d48 60%, #fb7185 100%)',
  },
  {
    id: 'f6',
    title: '本地房屋出租',
    subtitle: '整租 · 合租 · 短租 · 筛选便捷',
    href: '/housing',
    badge: '房屋信息',
    gradient: 'linear-gradient(135deg, #134e4a 0%, #0d9488 60%, #5eead4 100%)',
  },
]

export default function BannerCarousel() {
  const [ads, setAds] = useState<Ad[] | null>(null)
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch('/api/ads?position=home')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setAds(data)
        else setAds([])
      })
      .catch(() => setAds([]))
  }, [])

  const slideCount = ads && ads.length > 0 ? ads.length : fallbackSlides.length

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slideCount)
  }, [slideCount])

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slideCount) % slideCount)
  }, [slideCount])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(next, 4000)
  }, [next])

  useEffect(() => {
    resetTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [resetTimer])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX
    const dy = touchStartY.current - e.changedTouches[0].clientY
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx > 0) {
        next()
      } else {
        prev()
      }
      resetTimer()
    }
  }

  const usingAds = ads && ads.length > 0

  return (
    <div className="px-4 pt-4">
      <div
        className="relative overflow-hidden rounded-2xl shadow-md"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slide track */}
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {usingAds
            ? ads.map((ad) => (
                <a
                  key={ad.id}
                  href={ad.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex-shrink-0 w-full h-[200px] select-none block"
                  draggable={false}
                >
                  <Image
                    src={ad.image_url}
                    alt="广告"
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority
                  />
                </a>
              ))
            : fallbackSlides.map((slide) => (
                <Link
                  key={slide.id}
                  href={slide.href}
                  className="relative flex-shrink-0 w-full h-[200px] select-none"
                  style={{ background: slide.gradient }}
                  draggable={false}
                >
                  {/* Decorative circles */}
                  <div
                    className="absolute -top-8 -right-8 w-44 h-44 rounded-full opacity-30"
                    style={{ background: 'rgba(255,255,255,0.25)' }}
                  />
                  <div
                    className="absolute top-4 -right-2 w-24 h-24 rounded-full opacity-20"
                    style={{ background: 'rgba(255,255,255,0.3)' }}
                  />
                  <div
                    className="absolute -bottom-8 -left-6 w-36 h-36 rounded-full opacity-20"
                    style={{ background: 'rgba(255,255,255,0.2)' }}
                  />

                  {/* Content */}
                  <div className="absolute inset-0 p-5 flex flex-col justify-between">
                    <span className="self-start bg-white/25 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1 rounded-full border border-white/20">
                      {slide.badge}
                    </span>
                    <div className="pb-2">
                      <h2 className="text-white font-bold text-[22px] leading-tight drop-shadow-sm">
                        {slide.title}
                      </h2>
                      <p className="text-white/80 text-[13px] mt-1 font-medium">
                        {slide.subtitle}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {Array.from({ length: slideCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Slide ${i + 1}`}
              onClick={() => {
                setCurrent(i)
                resetTimer()
              }}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'bg-white w-5 h-[6px]'
                  : 'bg-white/45 w-[6px] h-[6px]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
