'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

interface AdSlide {
  id: number | string
  image_url: string
  link_url: string
}

const FALLBACK_SLIDES: AdSlide[] = [
  { id: 'f1', image_url: '/banners/nyc-1.jpg', link_url: '/' },
  { id: 'f2', image_url: '/banners/nyc-2.jpg', link_url: '/' },
  { id: 'f3', image_url: '/banners/nyc-3.jpg', link_url: '/' },
  { id: 'f4', image_url: '/banners/nyc-4.jpg', link_url: '/' },
  { id: 'f5', image_url: '/banners/nyc-5.jpg', link_url: '/' },
]

export default function BannerCarousel() {
  const [slides, setSlides] = useState<AdSlide[]>(FALLBACK_SLIDES)
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch('/api/ads?position=home')
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json.data) && json.data.length > 0) {
          setSlides(json.data)
          setCurrent(0)
        }
      })
      .catch(() => {/* keep fallback */})
  }, [])

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % slides.length)
  }, [slides.length])

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + slides.length) % slides.length)
  }, [slides.length])

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
        className="relative overflow-hidden rounded-2xl shadow-md"
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
              href={slide.link_url}
              className="relative flex-shrink-0 w-full h-[200px] select-none overflow-hidden"
              draggable={false}
            >
              {/* Background image */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${slide.image_url})` }}
              />
              {/* Gradient overlay for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              {/* Overlay text */}
              <div className="absolute inset-0 p-5 flex flex-col justify-end pb-7">
                <h2 className="text-white font-bold text-[22px] leading-tight drop-shadow-sm">
                  纽约华人生活入口
                </h2>
                <p className="text-white/85 text-[13px] mt-1 font-medium drop-shadow-sm">
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
