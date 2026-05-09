import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const NEWS_COVERS_BUCKET = 'news-covers'
const NEWS_COVERS_PUBLIC_PREFIX = `/storage/v1/object/public/${NEWS_COVERS_BUCKET}/`

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

function isNewsCoversUrl(url: string): boolean {
  return url.includes(NEWS_COVERS_PUBLIC_PREFIX)
}

function parseNewsCoversPath(url: string): string | null {
  const markerIndex = url.indexOf(NEWS_COVERS_PUBLIC_PREFIX)
  if (markerIndex < 0) return null

  const rawPath = url.slice(markerIndex + NEWS_COVERS_PUBLIC_PREFIX.length).split('?')[0]
  const decoded = decodeURIComponent(rawPath).trim().replace(/^\/+/, '')
  if (!decoded) return null

  return decoded.startsWith(`${NEWS_COVERS_BUCKET}/`)
    ? decoded.slice(NEWS_COVERS_BUCKET.length + 1)
    : decoded
}

export async function DELETE(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '无权限访问' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '删除图片失败，请稍后再试' }, { status: 400 })
  }

  if (body === null || typeof body !== 'object') {
    return NextResponse.json({ error: '删除图片失败，请稍后再试' }, { status: 400 })
  }

  const payload = body as Record<string, unknown>
  const coverImageUrl = typeof payload.coverImageUrl === 'string' ? payload.coverImageUrl.trim() : ''
  const newsId = typeof payload.newsId === 'string' ? payload.newsId.trim() : ''
  if (!coverImageUrl) {
    return NextResponse.json({ error: '删除图片失败，请稍后再试' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const isStorageCover = isNewsCoversUrl(coverImageUrl)

  const referenceQuery = supabase
    .from('news_posts')
    .select('id', { count: 'exact', head: true })
    .eq('cover_image_url', coverImageUrl)
  const scopedReferenceQuery = newsId ? referenceQuery.neq('id', newsId) : referenceQuery
  const { count, error: referenceError } = await scopedReferenceQuery
  if (referenceError) {
    return NextResponse.json({ error: '删除图片失败，请稍后再试' }, { status: 400 })
  }

  if (isStorageCover && !count) {
    const storagePath = parseNewsCoversPath(coverImageUrl)
    if (!storagePath) {
      return NextResponse.json(
        { error: '无法识别图片路径，请到 Supabase Storage 手动检查' },
        { status: 400 }
      )
    }

    const { error: removeError } = await supabase.storage.from(NEWS_COVERS_BUCKET).remove([storagePath])
    if (removeError) {
      return NextResponse.json({ error: '删除图片失败，请稍后再试' }, { status: 500 })
    }
  }

  if (newsId) {
    const { error: updateError } = await supabase
      .from('news_posts')
      .update({ cover_image_url: null, updated_at: new Date().toISOString() })
      .eq('id', newsId)
    if (updateError) {
      return NextResponse.json({ error: '删除图片失败，请稍后再试' }, { status: 400 })
    }
  }

  if (!isStorageCover) {
    return NextResponse.json({ message: '外部图片链接已从当前文章移除' })
  }
  if (count) {
    return NextResponse.json({ message: '图片仍被其它文章使用，已仅删除当前文章引用' })
  }
  return NextResponse.json({ message: '图片已删除' })
}
