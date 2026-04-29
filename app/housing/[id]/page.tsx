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

function hasPrice(p: unknown) {
  const price = Number(p)
  return Number.isFinite(price) && price > 0
}

function displayPrice(p: unknown) {
  if (!hasPrice(p)) return '租金请电话咨询'
  return `$${Number(p)} / 月`
}

function priceClass(p: unknown) {
  // 有价格：沿用醒目的蓝色；无价格：降级为不那么醒目的灰色
  return hasPrice(p)
    ? 'text-3xl font-black text-blue-600'
    : 'text-lg font-semibold text-zinc-700'
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
      const { data } = await supabase.from('housing_posts').select('*').eq('id', id).single()

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

  if (loading) return <div className="min-h-screen bg-zinc-50 flex items-center justify-center">加载中...</div>
  if (!post)
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-600">房屋信息不存在或已下架</p>
          <button
            onClick={() => router.push('/housing')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            返回列表
          </button>
        </div>
      </div>
    )

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-3xl mx-auto pb-20">
        {/* Image carousel */}
        <div className="relative w-full h-[260px] bg-black overflow-hidden">
          {imageCount > 0 ? (
            <Image
              src={images[activeIndex]}
              alt={post.title || '房屋图片'}
              fill
              className="object-cover"
              priority
              onClick={() => setLightboxOpen(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/70">暂无图片</div>
          )}

          {/* Dots */}
          {imageCount > 1 ? (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  className={`w-2 h-2 rounded-full ${idx === activeIndex ? 'bg-white' : 'bg-white/40'}`}
                  onClick={() => goTo(idx)}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          ) : null}
        </div>

        {/* Content */}
        <div className="px-4 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[20px] font-bold text-zinc-900 leading-snug break-words">
                {post.title || (post.type === 'seeking' ? '求租信息' : '房屋出租')}
              </h1>

              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full ${typeBadgeClass(post.type)}`}>
                  {typeLabel(post.type)}
                </span>
                {post.room_type ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white text-zinc-600 ring-1 ring-zinc-100">
                    {post.room_type}
                  </span>
                ) : null}
              </div>
            </div>

            <div className={`flex-shrink-0 text-right ${priceClass(post.price)}`}>{displayPrice(post.price)}</div>
          </div>

          <div className="mt-4 space-y-2 text-[13px] text-zinc-600">
            {post.location ? (
              <div>
                <span className="text-zinc-400">📍</span> {post.location}
              </div>
            ) : null}
            <div>
              <span className="text-zinc-400">🕒</span> {formatDate(post.created_at)}
            </div>
          </div>

          {post.description ? (
            <div className="mt-5 bg-white rounded-2xl p-4 shadow-sm border border-zinc-100">
              <h2 className="text-[14px] font-bold text-zinc-900">详情描述</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-zinc-700 whitespace-pre-wrap">
                {post.description}
              </p>
            </div>
          ) : null}

          {/* Safety */}
          <PostSafetyNotice variant="safety" />
        </div>

        {/* Lightbox */}
        {lightboxOpen ? (
          <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <div className="relative w-full max-w-4xl h-[70vh]">
              <Image src={images[activeIndex]} alt="" fill className="object-contain" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
