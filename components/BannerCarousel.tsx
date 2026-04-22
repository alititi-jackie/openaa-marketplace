'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const slides = [
  {
    id: 1,
    title: '纽约华人生活入口',
    subtitle: '招聘 · 房屋 · 二手 · DMV · 导航',
    href: '/',
    badge: '精选推荐',
    photo: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    title: '纽约华人生活入口',
    subtitle: '招聘 · 房屋 · 二手 · DMV · 导航',
    href: '/jobs',
    badge: '热门招聘',
    photo: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    title: '纽约华人生活入口',
    subtitle: '招聘 · 房屋 · 二手 · DMV · 导航',
    href: '/secondhand',
    badge: '二手交易',
    photo: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 4,
    title: '纽约华人生活入口',
    subtitle: '招聘 · 房屋 · 二手 · DMV · 导航',
    href: '/dmv',
    badge: 'DMV 服务',
    photo: 'https://images.unsplash.com/photo-1549637642-90187f64f420?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 5,
    title: '纽约华人生活入口',
    subtitle: '招聘 · 房屋 · 二手 · DMV · 导航',
    href: '/guide',
    badge: '新手必读',
    photo: 'https://images.unsplash.com/photo-1522083165195-3424ed129620?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 6,
    title: '纽约华人生活入口',
    subtitle: '招聘 · 房屋 · 二手 · DMV · 导航',
    href: '/housing',
    badge: '房屋信息',
    photo: 'https://images.unsplash.com/photo-1551879400-111a9087cd86?auto=format&fit=crop&w=800&q=80',
  },
]

export default function BannerCarousel() {
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length)
  }, [])

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length)
  }, [])

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

  return (
    <div className="px-4 pt-4">
      <div
        className="relative overflow-hidden rounded-3xl shadow-lg"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slide track */}
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((slide, idx) => (
            <Link
              key={slide.id}
              href={slide.href}
              className="relative flex-shrink-0 w-full h-[220px] select-none overflow-hidden"
              draggable={false}
            >
              {/* Photo background */}
              <Image
                src={slide.photo}
                alt={slide.title}
                fill
                className="object-cover"
                priority={idx === 0}
                sizes="(max-width: 560px) 100vw, 560px"
              />

              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

              {/* Content */}
              <div className="absolute inset-0 p-5 flex flex-col justify-between">
                <span className="self-start bg-white/20 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1 rounded-full border border-white/30">
                  {slide.badge}
                </span>
                <div className="pb-2">
                  <h2 className="text-white font-bold text-[22px] leading-tight drop-shadow">
                    {slide.title}
                  </h2>
                  <p className="text-white/85 text-[13px] mt-1.5 font-medium tracking-wide drop-shadow">
                    {slide.subtitle}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Dot indicators */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {slides.map((_, i) => (
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
