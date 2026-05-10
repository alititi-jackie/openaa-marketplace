import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { ServicePost } from '@/types'

export const dynamic = 'force-dynamic'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function checkAdminToken(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token')
  return token === process.env.ADMIN_TOKEN && !!process.env.ADMIN_TOKEN
}

function toSortableTime(value: string | null | undefined): number {
  if (!value) return 0
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? 0 : time
}

function isEffectivePinned(post: ServicePost, nowTime: number): boolean {
  if (!post.is_pinned) return false
  if (!post.pinned_until) return true
  return toSortableTime(post.pinned_until) > nowTime
}

export async function GET(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('service_posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  const nowTime = Date.now()
  const sorted = (data as ServicePost[] | null)?.slice().sort((a, b) => {
    const aPinned = isEffectivePinned(a, nowTime)
    const bPinned = isEffectivePinned(b, nowTime)
    if (aPinned !== bPinned) return aPinned ? -1 : 1

    if (aPinned && bPinned) {
      const pinnedOrderDiff = (a.pinned_order ?? 0) - (b.pinned_order ?? 0)
      if (pinnedOrderDiff !== 0) return pinnedOrderDiff
      const createdAtDiff = toSortableTime(b.created_at) - toSortableTime(a.created_at)
      if (createdAtDiff !== 0) return createdAtDiff
    }

    return toSortableTime(b.created_at) - toSortableTime(a.created_at)
  }) ?? []

  return NextResponse.json({ data: sorted })
}
