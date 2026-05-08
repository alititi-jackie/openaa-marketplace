import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isNewsCategory, NEWS_SLUG_REGEX } from '@/lib/news'
import type { NewsPost } from '@/types'

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '无权限访问' }, { status: 401 })
  }

  const { id } = await params
  const body: unknown = await request.json()
  if (body === null || typeof body !== 'object') {
    return NextResponse.json({ error: '无效请求体' }, { status: 400 })
  }

  const payload = body as Record<string, unknown>
  const supabase = getServiceClient()
  const { data: existing, error: existingError } = await supabase
    .from('news_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (existingError || !existing) {
    return NextResponse.json({ error: '新闻不存在' }, { status: 404 })
  }

  const current = existing as NewsPost
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if ('title' in payload) {
    const title = typeof payload.title === 'string' ? payload.title.trim() : ''
    if (!title) return NextResponse.json({ error: '标题不能为空' }, { status: 400 })
    updates.title = title
  }

  if ('slug' in payload) {
    const slug = typeof payload.slug === 'string' ? payload.slug.trim() : ''
    if (!slug) return NextResponse.json({ error: 'Slug 不能为空' }, { status: 400 })
    if (!NEWS_SLUG_REGEX.test(slug)) {
      return NextResponse.json(
        { error: 'Slug 只能使用英文小写、数字和短横线，例如 openaa-new-user-guide' },
        { status: 400 }
      )
    }
    updates.slug = slug
  }

  if ('category' in payload) {
    const category = typeof payload.category === 'string' ? payload.category.trim() : ''
    if (!isNewsCategory(category)) {
      return NextResponse.json({ error: '无效的新闻分类' }, { status: 400 })
    }
    updates.category = category
  }

  if ('content' in payload) {
    const content = typeof payload.content === 'string' ? payload.content.trim() : ''
    if (!content) return NextResponse.json({ error: '正文不能为空' }, { status: 400 })
    updates.content = content
  }

  if ('summary' in payload) updates.summary = toNullableString(payload.summary)
  if ('cover_image_url' in payload) updates.cover_image_url = toNullableString(payload.cover_image_url)
  if ('seo_title' in payload) updates.seo_title = toNullableString(payload.seo_title)
  if ('seo_description' in payload) updates.seo_description = toNullableString(payload.seo_description)

  if ('is_published' in payload) {
    const isPublished = payload.is_published === true
    updates.is_published = isPublished
    if (!current.is_published && isPublished && !current.published_at) {
      updates.published_at = new Date().toISOString()
    }
  }

  const { data, error } = await supabase
    .from('news_posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '无权限访问' }, { status: 401 })
  }

  const { id } = await params
  const supabase = getServiceClient()
  const { error } = await supabase.from('news_posts').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
