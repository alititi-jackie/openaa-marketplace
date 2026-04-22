'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const slides = [
  { id: 1, imageSrc: '/banners/nyc-1.jpg', href: '/' },
  { id: 2, imageSrc: '/banners/nyc-2.jpg', href: '/jobs' },
  { id: 3, imageSrc: '/banners/nyc-3.jpg', href: '/secondhand' },
  { id: 4, imageSrc: '/banners/nyc-4.jpg', href: '/dmv' },
  { id: 5, imageSrc: '/banners/nyc-5.jpg', href: '/guide' },
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
              className="relative flex-shrink-0 w-full h-[200px] select-none"
              draggable={false}
            >
              {/* Photo image */}
              <Image
                src={slide.imageSrc}
                alt="OpenAA Banner"
                fill
                priority={slide.id === 1}
                className="object-cover"
              />

              {/* Dark gradient overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />

              {/* Fixed overlay text */}
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <h2 className="text-white font-bold text-[22px] leading-tight drop-shadow-md">
                  纽约华人生活入口
                </h2>
                <p className="text-white/90 text-[13px] mt-1 font-medium drop-shadow-sm">
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
