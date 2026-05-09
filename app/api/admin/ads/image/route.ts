import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ADS_BUCKET = 'ads'
const ADS_PUBLIC_PREFIX = `/storage/v1/object/public/${ADS_BUCKET}/`

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

function isAdsStorageUrl(url: string): boolean {
  return url.includes(ADS_PUBLIC_PREFIX)
}

function parseAdsStoragePath(url: string): string | null {
  const markerIndex = url.indexOf(ADS_PUBLIC_PREFIX)
  if (markerIndex < 0) return null

  const rawPath = url.slice(markerIndex + ADS_PUBLIC_PREFIX.length).split('?')[0]
  const decoded = decodeURIComponent(rawPath).trim().replace(/^\/+/, '')
  if (!decoded) return null

  return decoded
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
  const imageUrl = typeof payload.imageUrl === 'string' ? payload.imageUrl.trim() : ''
  const adId = typeof payload.adId === 'string' ? payload.adId.trim() : ''

  if (!imageUrl) {
    return NextResponse.json({ error: '删除图片失败，请稍后再试' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const isStorageImage = isAdsStorageUrl(imageUrl)

  const referenceQuery = supabase
    .from('ads')
    .select('id', { count: 'exact', head: true })
    .eq('image_url', imageUrl)
  const scopedReferenceQuery = adId ? referenceQuery.neq('id', adId) : referenceQuery
  const { count, error: referenceError } = await scopedReferenceQuery
  if (referenceError) {
    return NextResponse.json({ error: '删除图片失败，请稍后再试' }, { status: 400 })
  }

  if (isStorageImage && !count) {
    const storagePath = parseAdsStoragePath(imageUrl)
    if (!storagePath) {
      return NextResponse.json(
        { error: '无法识别图片路径，请到 Supabase Storage 手动检查' },
        { status: 400 }
      )
    }

    const { error: removeError } = await supabase.storage.from(ADS_BUCKET).remove([storagePath])
    if (removeError) {
      return NextResponse.json({ error: '删除图片失败，请稍后再试' }, { status: 500 })
    }
  }

  if (adId) {
    const { error: updateError } = await supabase
      .from('ads')
      .update({ image_url: null })
      .eq('id', adId)

    if (updateError) {
      return NextResponse.json({ error: '删除图片失败，请稍后再试' }, { status: 400 })
    }
  }

  if (!isStorageImage) {
    return NextResponse.json({ message: '外部图片链接已从当前广告移除' })
  }
  if (count) {
    return NextResponse.json({ message: '图片仍被其它广告使用，已仅删除当前广告引用' })
  }
  return NextResponse.json({ message: '图片已删除' })
}
