import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

interface AdDetail {
  image_url: string
  slug: string
  content: string | null
  is_active: boolean
  start_date: string | null
  end_date: string | null
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
    <div className="min-h-screen bg-zinc-100">
      <div className="mx-auto max-w-[560px] bg-white shadow-sm ring-1 ring-black/5 pt-14 pb-24">
        <div className="px-4 pt-4">
          <div className="overflow-hidden rounded-2xl bg-zinc-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ad.image_url}
              alt=""
              className="w-full h-[220px] object-cover"
            />
          </div>

          <h1 className="mt-5 text-[18px] font-bold text-zinc-900 tracking-tight">
            {ad.slug}
          </h1>

          {ad.content ? (
            <div className="mt-3 text-[14px] leading-relaxed text-zinc-700 whitespace-pre-wrap">
              {ad.content}
            </div>
          ) : (
            <p className="mt-3 text-[14px] text-zinc-500">暂无详情内容</p>
          )}

          <div className="mt-6 rounded-2xl bg-zinc-50 ring-1 ring-zinc-100 p-4">
            <p className="text-[13px] font-semibold text-zinc-900">联系信息</p>
            <p className="mt-1 text-[12.5px] text-zinc-600">
              如需联系商家，请通过广告页面提供的联系方式与我们取得联系。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
