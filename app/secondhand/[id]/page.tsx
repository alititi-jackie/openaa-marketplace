'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import { formatPrice, formatDate } from '@/lib/utils'
import type { SecondhandItem } from '@/types'

function parseBudget(description: string): string | null {
  const lines = (description || '').split('\n')
  for (const line of lines) {
    const m = line.match(/^预算范围[:：]\s*(.+)\s*$/)
    if (m && m[1]) return m[1].trim()
  }
  return null
}

const AUTO_INTERVAL_MS = 3500

export default function SecondhandDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [item, setItem] = useState<SecondhandItem | null>(null)
  const [loading, setLoading] = useState(true)

  // Carousel state
  const [activeIndex, setActiveIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartXRef = useRef<number | null>(null)

  useEffect(() => {
    const fetchItem = async () => {
      const { data } = await supabase
        .from('secondhand_items')
        .select('*, user:users(username, avatar_url)')
        .eq('id', id)
        .single()

      if (data) {
        setItem(data)
        await supabase
          .from('secondhand_items')
          .update({ views: (data.views || 0) + 1 })
          .eq('id', id)
      }
      setLoading(false)
    }
    fetchItem()
  }, [id])

  // Reset active index when item changes
  useEffect(() => {
    setActiveIndex(0)
  }, [item?.id])

  const images = (item?.images || []).filter(Boolean).slice(0, 3)
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
    startAuto()
    return () => stopAuto()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageCount])

  if (loading) return <div className="flex justify-center py-20 text-gray-500">加载中...</div>
  if (!item) return <div className="flex justify-center py-20 text-gray-500">商品不存在</div>

  const isBuying = item.type === 'buying'
  const budget = isBuying ? parseBudget(item.description) : null

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button onClick={() => router.back()} className="text-[#1976d2] mb-4 flex items-center gap-1">
        ← 返回
      </button>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
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
                // swipe threshold
                if (Math.abs(dx) > 35) {
                  if (dx > 0) goPrev()
                  else goNext()
                }
              }
              startAuto()
            }}
          >
            <a
              href={images[activeIndex]}
              target="_blank"
              rel="noopener noreferrer"
              className="block h-full w-full"
            >
              <Image
                key={images[activeIndex]}
                src={images[activeIndex]}
                alt={item.title}
                fill
                priority
                className="object-cover"
              />
            </a>

            {isBuying && (
              <div className="absolute top-3 left-3">
                <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded font-semibold">求购</span>
              </div>
            )}

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
        ) : (
          <div className="h-64 bg-gray-100 flex items-center justify-center text-6xl">🛍️</div>
        )}

        <div className="p-6">
          <p className="text-2xl font-bold text-[#1976d2]">
            {isBuying ? `预算：${budget || '面议'}` : formatPrice(item.price)}
          </p>
          <h1 className="text-xl font-semibold text-gray-900 mt-2">{item.title}</h1>

          <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
            <span className="bg-gray-100 px-2 py-1 rounded">{item.category}</span>
            <span>👁 {item.views || 0} 次浏览</span>
            <span>{formatDate(item.created_at)}</span>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-2">商品描述</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{item.description}</p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1976d2] flex items-center justify-center text-white font-bold">
              {item.user?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-medium text-gray-900">{item.user?.username ?? '匿名用户'}</p>
              <p className="text-xs text-gray-500">发布者</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
