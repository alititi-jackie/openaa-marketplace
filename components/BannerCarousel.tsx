'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

interface AdSlide {
  id: string
  image_url: string
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

export default function BannerCarousel() {
  const [slides, setSlides] = useState<AdSlide[]>(FALLBACK_SLIDES)
  const router = useRouter()

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

  const renderSlideContent = (slide: AdSlide) => {
    const href = (slide.external_url || slide.link_url || '').trim()

    const image = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={slide.image_url}
        alt=""
        className="w-full h-[200px] object-cover select-none"
        draggable={false}
      />
    )

    const openMode = slide.open_mode || (slide.link_type === 'internal' ? 'internal' : 'external_new')

    // Keep fallback banners non-clickable (no mode + no url/slug)
    const isFallback = slide.id.startsWith('f') && !slide.slug && !href
    if (isFallback) return image

    if (openMode === 'internal' && slide.slug) {
      return (
        <Link href={`/ads/${slide.slug}`} className="block w-full">
          {image}
        </Link>
      )
    }

    if ((openMode === 'external_new' || openMode === 'external_same') && href) {
      return (
        <button
          type="button"
          className="block w-full text-left"
          onClick={() => {
            if (openMode === 'external_new') {
              window.open(href, '_blank', 'noopener,noreferrer')
            } else {
              window.location.href = href
            }
          }}
        >
          {image}
        </button>
      )
    }

    // Fallback to internal if link_type says internal
    if (slide.link_type === 'internal' && slide.slug) {
      return (
        <Link href={`/ads/${slide.slug}`} className="block w-full">
          {image}
        </Link>
      )
    }

    // Default external new
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
      <div className="rounded-2xl shadow-md overflow-hidden">
        <Swiper
          modules={[Autoplay, Pagination]}
          loop={true}
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
