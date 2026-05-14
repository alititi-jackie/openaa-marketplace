import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import ServiceDetailClient from './ServiceDetailClient'
import { isPublicOwnerVisible } from '@/lib/publicVisibility'
import type { ServicePost } from '@/types'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = getSupabaseClient()
  const { data } = await supabase
    .from('service_posts')
    .select('title, location, category, user:users(status)')
    .eq('id', id)
    .single()

  if (!data || !isPublicOwnerVisible((data as { user?: unknown }).user)) {
    return {
      title: '本地服务详情 | OpenAA',
      description: 'OpenAA 华人本地服务信息',
    }
  }

  return {
    title: `${data.title} - ${data.location}华人本地服务 | OpenAA`,
    description: `查看 ${data.location} ${data.title}，服务分类：${data.category}。OpenAA 华人本地服务信息由用户发布，请自行核实信息。`,
  }
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = getSupabaseClient()
  const { data } = await supabase
    .from('service_posts')
    .select('*, user:users(status)')
    .eq('id', id)
    .single()

  if (!data || !isPublicOwnerVisible((data as { user?: unknown }).user)) {
    return <ServiceDetailClient post={null} />
  }

  const post = { ...(data as ServicePost & { user?: unknown }) }
  delete post.user
  return <ServiceDetailClient post={post} />
}
