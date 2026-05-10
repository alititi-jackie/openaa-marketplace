import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isNewsCategory, NEWS_SLUG_REGEX } from '@/lib/news'

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

function toNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim()
  return v ? v : null
}

function toPinnedOrder(value: unknown): number | null {
  if (value === undefined) return 0
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) return null
  return value
}

function toPinnedUntil(value: unknown): string | null | undefined {
  if (value === undefined) return null
  if (value === null) return null
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed.toISOString()
}

export async function GET(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '无权限访问' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('news_posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '无权限访问' }, { status: 401 })
  }

  const body: unknown = await request.json()
  if (body === null || typeof body !== 'object') {
    return NextResponse.json({ error: '无效请求体' }, { status: 400 })
  }

  const payload = body as Record<string, unknown>
  const title = typeof payload.title === 'string' ? payload.title.trim() : ''
  const slug = typeof payload.slug === 'string' ? payload.slug.trim() : ''
  const content = typeof payload.content === 'string' ? payload.content.trim() : ''
  const category = typeof payload.category === 'string' ? payload.category.trim() : ''
  const isPublished = payload.is_published === true
  const pinnedOrder = toPinnedOrder(payload.pinned_order)
  const pinnedUntil = toPinnedUntil(payload.pinned_until)
  const isPinned = payload.is_pinned === true

  if (!title || !slug || !content || !category) {
    return NextResponse.json({ error: '请完整填写标题、slug、分类与正文' }, { status: 400 })
  }

  if (!NEWS_SLUG_REGEX.test(slug)) {
    return NextResponse.json(
      { error: 'Slug 只能使用英文小写、数字和短横线，例如 openaa-new-user-guide' },
      { status: 400 }
    )
  }

  if (!isNewsCategory(category)) {
    return NextResponse.json({ error: '无效的新闻分类' }, { status: 400 })
  }

  if (pinnedOrder === null) {
    return NextResponse.json({ error: '置顶排序必须是大于等于 0 的整数' }, { status: 400 })
  }

  if (pinnedUntil === undefined) {
    return NextResponse.json({ error: '置顶到期时间格式无效' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const now = new Date().toISOString()
  const publishedAt = isPublished ? now : null

  const { data, error } = await supabase
    .from('news_posts')
    .insert({
      title,
      slug,
      category,
      summary: toNullableString(payload.summary),
      cover_image_url: toNullableString(payload.cover_image_url),
      content,
      seo_title: toNullableString(payload.seo_title),
      seo_description: toNullableString(payload.seo_description),
      is_published: isPublished,
      published_at: publishedAt,
      is_pinned: isPinned,
      pinned_order: pinnedOrder,
      pinned_until: pinnedUntil,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
