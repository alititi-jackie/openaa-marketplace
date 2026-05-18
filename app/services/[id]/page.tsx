import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import ServiceDetailClient from './ServiceDetailClient'
import { getPublicServiceById } from '@/lib/services/publicServices'
import type { ServicePost } from '@/types'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const supabase = getSupabaseClient()
  const { data } = await getPublicServiceById(supabase, id)

  if (!data) {
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
  const { data } = await getPublicServiceById(supabase, id)

  if (!data) {
    return <ServiceDetailClient post={null} />
  }

  return <ServiceDetailClient post={data as ServicePost} />
}
