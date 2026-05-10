import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import AdDetailClient from './AdDetailClient'

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

  return <AdDetailClient ad={{ image_url: ad.image_url, slug: ad.slug, content: ad.content }} />
}
