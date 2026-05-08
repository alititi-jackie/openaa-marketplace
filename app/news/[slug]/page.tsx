import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import NewsCover from '@/components/NewsCover'
import OpenAAAttractCard from '@/components/OpenAAAttractCard'
import { NEWS_DEFAULT_SEO_DESCRIPTION } from '@/lib/news'
import type { NewsPost } from '@/types'

async function getNewsBySlug(slug: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('news_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error || !data) return null
  return data as NewsPost
}

function formatDate(value: string | null) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return value
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getNewsBySlug(slug)

  if (!post) {
    return {
      title: '新闻详情 - OpenAA',
      description: NEWS_DEFAULT_SEO_DESCRIPTION,
    }
  }

  const title = post.seo_title || `${post.title} - OpenAA`
  const description = post.seo_description || post.summary || NEWS_DEFAULT_SEO_DESCRIPTION
  const image = post.cover_image_url ? [post.cover_image_url] : undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image,
    },
  }
}

export default async function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getNewsBySlug(slug)

  if (!post) {
    notFound()
  }

  const paragraphs = post.content
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean)

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="px-4 pt-5">
        <Link href="/news" className="text-sm font-medium text-blue-600">
          ← 返回新闻列表
        </Link>

        <p className="mt-4 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
          {post.category}
        </p>
        <h1 className="mt-2 text-2xl font-black leading-tight text-zinc-900">{post.title}</h1>
        <p className="mt-2 text-sm text-zinc-400">{formatDate(post.published_at)}</p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-100">
          <NewsCover src={post.cover_image_url} alt={post.title} className="h-52 w-full" />
        </div>

        <article className="mt-5 space-y-4 text-[15px] leading-7 text-zinc-800">
          {paragraphs.map((paragraph, index) => (
            <p key={`${post.id}-${index}`}>{paragraph}</p>
          ))}
        </article>

        <div className="mt-6">
          <OpenAAAttractCard />
        </div>
      </div>
    </div>
  )
}
