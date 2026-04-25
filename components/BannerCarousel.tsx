'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

interface AdSlide {
  id: string
  image_url?: string | null
  link_url?: string | null
  link_type?: string | null
  external_url?: string | null
  slug?: string | null
  open_mode?: 'internal' | 'external_new' | 'external_same' | string | null
}

const FALLBACK_SLIDES: AdSlide[] = [
  { id: 'f1', image_url: '/banners/nyc-1.jpg' },
  { id: 'f2', image_url: '/banners/nyc-2.jpg' },
  { id: 'f3', image_url: '/banners/nyc-3.jpg' },
  { id: 'f4', image_url: '/banners/nyc-4.jpg' },
  { id: 'f5', image_url: '/banners/nyc-5.jpg' },
]

function normalizeImageUrl(v: unknown): string {
  if (typeof v === 'string' && v.trim()) return v.trim()
  return ''
}

export default function BannerCarousel() {
  const [slides, setSlides] = useState<AdSlide[]>(FALLBACK_SLIDES)

  useEffect(() => {
    fetch('/api/ads?position=home')
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json.data) && json.data.length > 0) {
          const filtered = json.data.filter((s: AdSlide) => normalizeImageUrl(s?.image_url))
          setSlides(filtered.length > 0 ? filtered : FALLBACK_SLIDES)
        }
      })
      .catch(() => {
        // keep fallback slides on error
      })
  }, [])

  const renderSlideContent = (slide: AdSlide) => {
    const imageUrl = normalizeImageUrl(slide.image_url)

    // If we somehow have no image url, render nothing (should not happen after filtering)
    if (!imageUrl) return null

    const image = (
      <div className="w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="w-full h-[240px] sm:h-[270px] md:h-[300px] lg:h-[340px] object-contain bg-zinc-100 select-none"
          draggable={false}
          loading="eager"
        />
      </div>
    )

    const href = (slide.external_url || slide.link_url || '').trim()
    const openMode = slide.open_mode || (slide.link_type === 'internal' ? 'internal' : 'external_new')

    // Keep fallback banners non-clickable
    const isFallback = slide.id.startsWith('f') && !slide.slug && !href
    if (isFallback) return image

    if (openMode === 'internal' && slide.slug) {
      return (
        <Link href={`/ads/${slide.slug}`} className="block w-full">
          {image}
        </Link>
      )
    }

    if (openMode === 'external_new' && href) {
      return (
        <button
          type="button"
          className="block w-full text-left"
          onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
        >
          {image}
        </button>
      )
    }

    if (openMode === 'external_same' && href) {
      return (
        <button
          type="button"
          className="block w-full text-left"
          onClick={() => {
            window.location.href = href
          }}
        >
          {image}
        </button>
      )
    }

    // Back-compat fallbacks
    if (slide.link_type === 'internal' && slide.slug) {
      return (
        <Link href={`/ads/${slide.slug}`} className="block w-full">
          {image}
        </Link>
      )
    }

    if (href) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="block w-full">
          {image}
        </a>
      )
    }

    return image
  }

  return (
    <div className="px-4 pt-4">
      <div className="rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] ring-1 ring-black/5 overflow-hidden bg-white">
        <Swiper
          modules={[Autoplay, Pagination]}
          loop={slides.length > 1}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          touchRatio={1}
          className="banner-swiper"
        >
          {slides.map((slide) => (
            <SwiperSlide key={slide.id}>{renderSlideContent(slide)}</SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  )
}
