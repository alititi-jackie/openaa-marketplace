'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

interface AdSlide {
  id: string
  image_url: string
  link_url?: string | null
  link_type?: string | null
  external_url?: string | null
  slug?: string | null
}

const FALLBACK_SLIDES: AdSlide[] = [
  { id: 'f1', image_url: '/banners/nyc-1.jpg' },
  { id: 'f2', image_url: '/banners/nyc-2.jpg' },
  { id: 'f3', image_url: '/banners/nyc-3.jpg' },
  { id: 'f4', image_url: '/banners/nyc-4.jpg' },
  { id: 'f5', image_url: '/banners/nyc-5.jpg' },
]

// Minimum horizontal movement (px) before a gesture is treated as a swipe
const SWIPE_START_THRESHOLD_PX = 12

export default function BannerCarousel() {
  const [slides, setSlides] = useState<AdSlide[]>(FALLBACK_SLIDES)
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isSwipingRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch('/api/ads?position=home')
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json.data) && json.data.length > 0) {
          setSlides(json.data)
        }
      })
      .catch(() => {
        // keep fallback slides on error
      })
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
    isSwipingRef.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.touches[0].clientX
    const dy = touchStartY.current - e.touches[0].clientY
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_START_THRESHOLD_PX) {
      isSwipingRef.current = true
    }
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

  const slideImage = (slide: AdSlide) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={slide.image_url}
      alt=""
      className="w-full h-full object-cover"
      draggable={false}
    />
  )

  const renderSlide = (slide: AdSlide) => {
    const imageEl = (
      <div className="relative flex-shrink-0 w-full h-[200px] select-none bg-gray-100">
        {slideImage(slide)}
      </div>
    )

    // Internal ad → route to /ads/[slug]
    if (slide.link_type === 'internal' && slide.slug) {
      return (
        <Link
          key={slide.id}
          href={`/ads/${slide.slug}`}
          className="block flex-shrink-0 w-full"
          draggable={false}
          onClick={(e) => {
            if (isSwipingRef.current) e.preventDefault()
          }}
        >
          {imageEl}
        </Link>
      )
    }

    // External ad → open new tab
    const href = slide.external_url || slide.link_url
    if (href) {
      return (
        <a
          key={slide.id}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block flex-shrink-0 w-full"
          draggable={false}
          onClick={(e) => {
            if (isSwipingRef.current) e.preventDefault()
          }}
        >
          {imageEl}
        </a>
      )
    }

    // Fallback (no link)
    return (
      <div key={slide.id} className="flex-shrink-0 w-full">
        {imageEl}
      </div>
    )
  }

  return (
    <div className="px-4 pt-4">
      <div
        className="relative overflow-hidden rounded-2xl shadow-md"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slide track */}
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {slides.map((slide) => renderSlide(slide))}
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
