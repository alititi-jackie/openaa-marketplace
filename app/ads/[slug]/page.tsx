import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { ShieldCheck, Sparkles, TrendingUp, MessageCircle, Phone, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface AdDetail {
  image_url: string
  slug: string
  content: string | null
  is_active: boolean
  start_date: string | null
  end_date: string | null
}

function formatContent(content: string) {
  // Minimal “rich text” formatting: split paragraphs + keep line breaks.
  const parts = content
    .split(/\n\s*\n/g)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <div className="space-y-3">
      {parts.map((p, i) => (
        <p key={i} className="text-[14px] leading-relaxed text-zinc-700 whitespace-pre-wrap">
          {p}
        </p>
      ))}
    </div>
  )
}

export default async function AdDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: ad, error } = await supabase
    .from('ads')
    .select('image_url, slug, content, is_active, start_date, end_date')
    .eq('slug', slug)
    .eq('link_type', 'internal')
    .single<AdDetail>()

  if (error || !ad) return notFound()

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto w-full max-w-[860px] px-4 py-6 md:py-10">
        {/* Top nav */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[12px] font-semibold text-zinc-600 hover:text-zinc-900"
          >
            <ArrowLeft size={14} />
            返回首页
          </Link>

          <span className="text-[11px] font-medium text-zinc-400">OpenAA 内部广告页</span>
        </div>

        {/* Hero card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-[0_10px_35px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
          <div className="relative bg-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ad.image_url}
              alt=""
              className="w-full h-[240px] md:h-[340px] object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
              <h1 className="text-white text-[20px] md:text-[28px] font-black tracking-tight">
                {ad.slug}
              </h1>
              <p className="mt-1 text-white/85 text-[12px] md:text-[13px]">
                面向北美华人用户的高曝光展示位
              </p>
            </div>
          </div>

          <div className="p-4 md:p-6">
            {/* Content */}
            <div className="max-w-none">
              <h2 className="text-[14px] md:text-[15px] font-bold text-zinc-900">广告详情</h2>
              <div className="mt-3 rounded-2xl bg-zinc-50 ring-1 ring-zinc-100 p-4">
                {ad.content ? (
                  formatContent(ad.content)
                ) : (
                  <p className="text-[14px] text-zinc-500">暂无详情内容</p>
                )}
              </div>
            </div>

            {/* Advantage cards */}
            <div className="mt-6">
              <h2 className="text-[14px] md:text-[15px] font-bold text-zinc-900">平台优势</h2>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-white ring-1 ring-zinc-100 p-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 ring-1 ring-blue-100 flex items-center justify-center">
                    <TrendingUp size={16} className="text-blue-600" />
                  </div>
                  <p className="mt-2 text-[12.5px] font-bold text-zinc-900">精准华人流量</p>
                  <p className="mt-1 text-[11px] text-zinc-500">更高匹配度，更低获客成本</p>
                </div>

                <div className="rounded-2xl bg-white ring-1 ring-zinc-100 p-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 ring-1 ring-amber-100 flex items-center justify-center">
                    <Sparkles size={16} className="text-amber-600" />
                  </div>
                  <p className="mt-2 text-[12.5px] font-bold text-zinc-900">首页黄金曝光</p>
                  <p className="mt-1 text-[11px] text-zinc-500">强占注意力，提升点击咨询</p>
                </div>

                <div className="rounded-2xl bg-white ring-1 ring-zinc-100 p-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 flex items-center justify-center">
                    <ShieldCheck size={16} className="text-emerald-600" />
                  </div>
                  <p className="mt-2 text-[12.5px] font-bold text-zinc-900">品牌信任提升</p>
                  <p className="mt-1 text-[11px] text-zinc-500">平台背书，降低用户决策成本</p>
                </div>

                <div className="rounded-2xl bg-white ring-1 ring-zinc-100 p-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 ring-1 ring-purple-100 flex items-center justify-center">
                    <MessageCircle size={16} className="text-purple-600" />
                  </div>
                  <p className="mt-2 text-[12.5px] font-bold text-zinc-900">高效咨询转化</p>
                  <p className="mt-1 text-[11px] text-zinc-500">按钮直达，缩短沟通路径</p>
                </div>
              </div>
            </div>

            {/* Contact CTA */}
            <div className="mt-6 rounded-3xl bg-zinc-900 text-white p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-black">立即咨询</p>
                  <p className="mt-1 text-[12px] text-white/80">
                    点击下方按钮，通过微信或电话快速联系。
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="weixin://"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white text-zinc-900 font-bold text-[13px] py-3 active:scale-[0.99] transition"
                >
                  <MessageCircle size={16} />
                  微信联系
                </a>

                <a
                  href="tel:"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 ring-1 ring-white/20 text-white font-bold text-[13px] py-3 active:scale-[0.99] transition"
                >
                  <Phone size={16} />
                  电话联系
                </a>
              </div>

              <div className="mt-3">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center w-full rounded-2xl py-3 text-[13px] font-semibold text-white/90 hover:text-white bg-white/0 ring-1 ring-white/15"
                >
                  返回首页
                </Link>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-zinc-400">
          提示：此页面为内部广告详情页展示样式（可按商家内容进行更新）。
        </p>
      </div>
    </div>
  )
}
