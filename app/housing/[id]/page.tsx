'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import PostSafetyNotice from '@/components/PostSafetyNotice'
import type { HousingPost } from '@/types'

const AUTO_INTERVAL_MS = 3500

function typeLabel(t?: string) {
  return t === 'seeking' ? '求租' : '出租'
}

function typeBadgeClass(t?: string) {
  return t === 'seeking'
    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
    : 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
}

function displayPrice(p: number) {
  const price = Number(p || 0)
  if (!Number.isFinite(price) || price <= 0) return '租金面议'
  return `$${price} / 月`
}

export default function HousingDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [post, setPost] = useState<HousingPost | null>(null)
  const [loading, setLoading] = useState(true)

  // Carousel state
  const [activeIndex, setActiveIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartXRef = useRef<number | null>(null)

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    const fetchPost = async () => {
      const { data } = await supabase
        .from('housing_posts')
        .select('*')
        .eq('id', id)
        .single()

      if (data) setPost(data)
      setLoading(false)
    }
    fetchPost()
  }, [id])

  const images = Array.isArray(post?.images) ? (post.images as string[]).filter(Boolean) : []
  const imageCount = images.length
  const isAuto = imageCount >= 2

  const goTo = (idx: number) => {
    if (imageCount <= 0) return
    const next = ((idx % imageCount) + imageCount) % imageCount
    setActiveIndex(next)
  }

  const goPrev = () => goTo(activeIndex - 1)
  const goNext = () => goTo(activeIndex + 1)

  const stopAuto = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const startAuto = () => {
    stopAuto()
    if (!isAuto) return
    intervalRef.current = setInterval(() => {
      setActiveIndex((p) => {
        const next = p + 1
        return next >= imageCount ? 0 : next
      })
    }, AUTO_INTERVAL_MS)
  }

  useEffect(() => {
    if (imageCount === 0) {
      setActiveIndex(0)
      stopAuto()
      return
    }
    setActiveIndex((p) => (p >= imageCount ? 0 : p))
    startAuto()
    return () => stopAuto()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageCount])

  useEffect(() => {
    if (lightboxOpen) stopAuto()
    else startAuto()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen])

  useEffect(() => {
    if (!lightboxOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (imageCount >= 2) {
        if (e.key === 'ArrowLeft') goPrev()
        if (e.key === 'ArrowRight') goNext()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, imageCount, activeIndex])

  if (loading) return <div className="flex justify-center py-20 text-gray-500">加载中...</div>
  if (!post) return <div className="flex justify-center py-20 text-gray-500">房屋信息不存在</div>

  const currentImage = imageCount > 0 ? images[activeIndex] : ''

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
      <button onClick={() => router.back()} className="text-[#1976d2] mb-4 flex items-center gap-1">
        ← 返回
      </button>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Only render image area when there is at least one valid image */}
        {imageCount > 0 ? (
          <div
            className="relative h-64 md:h-96 overflow-hidden"
            onMouseEnter={stopAuto}
            onMouseLeave={startAuto}
            onTouchStart={(e) => {
              touchStartXRef.current = e.touches?.[0]?.clientX ?? null
              stopAuto()
            }}
            onTouchEnd={(e) => {
              const startX = touchStartXRef.current
              const endX = e.changedTouches?.[0]?.clientX ?? null
              touchStartXRef.current = null
              if (startX != null && endX != null) {
                const dx = endX - startX
                if (Math.abs(dx) > 35) {
                  if (dx > 0) goPrev()
                  else goNext()
                } else {
                  setLightboxOpen(true)
                }
              } else {
                setLightboxOpen(true)
              }
              startAuto()
            }}
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="block h-full w-full"
              aria-label="查看大图"
            >
              <Image
                key={currentImage}
                src={currentImage}
                alt={post.title}
                fill
                priority
                className="object-cover"
              />
            </button>

            {/* Prev/Next */}
            {imageCount >= 2 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    stopAuto()
                    goPrev()
                    startAuto()
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/55"
                  aria-label="上一张"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopAuto()
                    goNext()
                    startAuto()
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/55"
                  aria-label="下一张"
                >
                  ›
                </button>
              </>
            )}

            {/* Dots */}
            {imageCount >= 2 && (
              <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      stopAuto()
                      goTo(idx)
                      startAuto()
                    }}
                    className={
                      'h-2 w-2 rounded-full transition ' +
                      (idx === activeIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/70')
                    }
                    aria-label={`切换到第 ${idx + 1} 张`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}

        <div className="p-6">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${typeBadgeClass(post.type)}`}>
              {typeLabel(post.type)}
            </span>
            {post.room_type ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-50 text-zinc-600 ring-1 ring-zinc-100">
                {post.room_type}
              </span>
            ) : null}
          </div>

          <h1 className="text-xl font-semibold text-gray-900">{post.title}</h1>

          <p className="text-2xl font-bold text-[#1976d2] mt-2">{displayPrice(post.price)}</p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-gray-500">
            {post.location ? <span>📍 {post.location}</span> : null}
            <span>🕒 {formatDate(post.created_at)}</span>
          </div>

          {post.contact ? (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-1">联系方式</h2>
              <p className="text-gray-600">{post.contact}</p>
            </div>
          ) : null}

          {post.description ? (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h2 className="font-semibold text-gray-900 mb-2">房屋描述</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{post.description}</p>
            </div>
          ) : null}

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1976d2] flex items-center justify-center text-white font-bold">
              O
            </div>
            <div>
              <p className="font-medium text-gray-900">OpenAA / 发布者</p>
            </div>
          </div>

          <PostSafetyNotice />
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && imageCount > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative w-full max-w-5xl h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute top-2 left-2 z-10 px-3 py-2 rounded-full bg-black/60 text-white text-sm"
              aria-label="返回"
            >
              ← 返回
            </button>

            {imageCount >= 2 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/55 text-white flex items-center justify-center"
                  aria-label="上一张"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/55 text-white flex items-center justify-center"
                  aria-label="下一张"
                >
                  ›
                </button>
              </>
            )}

            <Image src={currentImage} alt={post.title} fill className="object-contain" />

            {imageCount >= 2 && (
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2 z-10">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goTo(idx)}
                    className={
                      'h-2.5 w-2.5 rounded-full transition ' +
                      (idx === activeIndex ? 'bg-white' : 'bg-white/50 hover:bg-white/70')
                    }
                    aria-label={`切换到第 ${idx + 1} 张`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
