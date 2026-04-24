import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Ad {
  id: string
  image_url: string
  slug: string
  content: string | null
  external_url: string | null
  link_url: string | null
}

async function getAdBySlug(slug: string): Promise<Ad | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('ads')
    .select('id, image_url, slug, content, external_url, link_url')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !data) return null
  return data as Ad
}

export default async function AdDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const ad = await getAdBySlug(slug)

  if (!ad) notFound()

  const title = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  const contactUrl = ad.external_url || ad.link_url

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ad.image_url}
        alt={title}
        className="w-full rounded-2xl object-cover max-h-[320px] bg-gray-100"
      />

      {/* Title */}
      <h1 className="mt-6 text-2xl font-bold text-gray-900">{title}</h1>

      {/* Content */}
      {ad.content && (
        <div className="mt-4 text-gray-700 leading-relaxed whitespace-pre-wrap">
          {ad.content}
        </div>
      )}

      {/* Contact CTA */}
      <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between gap-4">
        <p className="text-sm text-blue-800 font-medium">联系商家</p>
        {contactUrl ? (
          <a
            href={contactUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg"
          >
            立即联系
          </a>
        ) : (
          <span className="text-sm text-blue-400">暂无联系方式</span>
        )}
      </div>
    </div>
  )
}
