'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const slides = [
  { id: 1, href: '/jobs',       img: '/banners/nyc-1.jpg' },
  { id: 2, href: '/housing',    img: '/banners/nyc-2.jpg' },
  { id: 3, href: '/secondhand', img: '/banners/nyc-3.jpg' },
  { id: 4, href: '/dmv',        img: '/banners/nyc-4.jpg' },
  { id: 5, href: '/guide',      img: '/banners/nyc-5.jpg' },
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
          {slides.map((slide) => (
            <Link
              key={slide.id}
              href={slide.href}
              className="relative flex-shrink-0 w-full h-[220px] select-none block"
              draggable={false}
            >
              {/* Photo background */}
              <Image
                src={slide.img}
                alt="纽约华人生活入口"
                fill
                className="object-cover"
                priority={slide.id === 1}
                sizes="(max-width: 560px) 100vw, 560px"
              />

              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />

              {/* Fixed overlay text */}
              <div className="absolute inset-0 flex flex-col justify-end p-5 pb-6">
                <h2 className="text-white font-bold text-[24px] leading-tight drop-shadow-md">
                  纽约华人生活入口
                </h2>
                <p className="text-white/85 text-[13px] mt-1.5 font-medium tracking-wide drop-shadow-sm">
                  招聘 · 房屋 · 二手 · DMV · 导航
                </p>
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
