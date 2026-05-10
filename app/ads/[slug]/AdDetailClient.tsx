'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, Sparkles, TrendingUp, MessageCircle, ZoomIn, X } from 'lucide-react'
import DetailBackButton from '@/components/DetailBackButton'
import ContactInfoCard from '@/components/ContactInfoCard'

interface AdDetailClientProps {
  ad: {
    image_url: string
    slug: string
    content: string | null
    contact_name: string | null
    phone: string | null
    wechat: string | null
  }
}

function formatContent(content: string) {
  const parts = content
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <div className="space-y-3">
      {parts.map((p, i) => (
        <p key={i} className="text-base leading-7 text-gray-800 whitespace-pre-wrap">
          {p}
        </p>
      ))}
    </div>
  )
}

export default function AdDetailClient({ ad }: AdDetailClientProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    if (!lightboxOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [lightboxOpen])

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto w-full max-w-[860px] px-4 py-6 md:py-10">
        {/* Top nav */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <DetailBackButton fallbackHref="/" />

          <span className="text-[11px] font-medium text-zinc-400">OpenAA 内部广告页</span>
        </div>

        {/* Hero card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-[0_10px_35px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
          {/* Image area — no overlay, click to open lightbox */}
          <div className="relative bg-zinc-100">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="block w-full group"
              aria-label="点击查看大图"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ad.image_url}
                alt={ad.slug}
                className="w-full h-[240px] md:h-[340px] object-contain object-center"
              />
              {/* Subtle zoom hint on hover */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/30 px-2 py-1 text-white opacity-0 group-hover:opacity-100 transition-opacity text-[11px] pointer-events-none">
                <ZoomIn size={12} />
                <span>查看大图</span>
              </div>
            </button>
          </div>

          {/* Ad title below the image */}
          <div className="px-4 md:px-6 pt-4">
            <h1 className="text-gray-900 text-[20px] md:text-[24px] font-black tracking-tight">
              {ad.slug}
            </h1>
            <p className="mt-1 text-gray-500 text-[12px] md:text-[13px]">
              面向北美华人用户的高曝光展示位
            </p>
          </div>

          <div className="p-4 md:p-6">
            {/* Content */}
            <div className="max-w-none">
              <h2 className="text-xl font-bold text-gray-900">广告详情</h2>
              <div className="mt-3 rounded-2xl bg-gray-50 border border-gray-100 p-5">
                {ad.content ? (
                  formatContent(ad.content)
                ) : (
                  <p className="text-base text-gray-500">暂无详情内容</p>
                )}
              </div>
            </div>

            {/* Advantage cards */}
            <div className="mt-6">
              <h2 className="text-xl font-bold text-gray-900">平台优势</h2>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-white ring-1 ring-zinc-100 p-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center">
                    <TrendingUp size={16} className="text-blue-600" />
                  </div>
                  <p className="mt-2 text-[12.5px] font-bold text-zinc-900">精准华人流量</p>
                  <p className="mt-1 text-[11px] text-zinc-600">更高匹配度，更低获客成本</p>
                </div>

                <div className="rounded-2xl bg-white ring-1 ring-zinc-100 p-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 ring-1 ring-amber-100 flex items-center justify-center">
                    <Sparkles size={16} className="text-amber-600" />
                  </div>
                  <p className="mt-2 text-[12.5px] font-bold text-zinc-900">首页黄金曝光</p>
                  <p className="mt-1 text-[11px] text-zinc-600">强占注意力，提升点击咨询</p>
                </div>

                <div className="rounded-2xl bg-white ring-1 ring-zinc-100 p-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center">
                    <ShieldCheck size={16} className="text-emerald-600" />
                  </div>
                  <p className="mt-2 text-[12.5px] font-bold text-zinc-900">品牌信任提升</p>
                  <p className="mt-1 text-[11px] text-zinc-600">平台背书，降低用户决策成本</p>
                </div>

                <div className="rounded-2xl bg-white ring-1 ring-zinc-100 p-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 ring-1 ring-purple-100 flex items-center justify-center">
                    <MessageCircle size={16} className="text-purple-600" />
                  </div>
                  <p className="mt-2 text-[12.5px] font-bold text-zinc-900">高效咨询转化</p>
                  <p className="mt-1 text-[11px] text-zinc-600">按钮直达，缩短沟通路径</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <ContactInfoCard
                title="联系广告方"
                contactName={ad.contact_name}
                phone={ad.phone}
                wechat={ad.wechat}
                emptyText="暂无单独联系方式，请查看广告详情内容。"
              />
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-zinc-400">
          提示：此页面为内部广告详情页展示样式（可按商家内容进行更新）。
        </p>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute top-2 right-2 z-10 flex items-center gap-1 px-3 py-2 rounded-full bg-black/60 text-white text-sm"
              aria-label="关闭"
            >
              <X size={14} />
              关闭
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ad.image_url}
              alt={ad.slug}
              className="w-full h-full object-contain object-center"
            />
          </div>
        </div>
      )}
    </div>
  )
}
