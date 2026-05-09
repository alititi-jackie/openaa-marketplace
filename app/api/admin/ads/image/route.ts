import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ADS_BUCKET = 'ads'
const SUPABASE_PUBLIC_STORAGE_MARKER = '/storage/v1/object/public/'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function checkAdminToken(token: string): boolean {
  return token === process.env.ADMIN_TOKEN && !!process.env.ADMIN_TOKEN
}

function isAdsStorageUrl(url: string): boolean {
  const parsed = parseSupabaseStorageUrl(url)
  return parsed?.bucket === ADS_BUCKET
}

function parseSupabaseStorageUrl(url: string): { bucket: string, objectPath: string } | null {
  try {
    const parsedUrl = new URL(url)
    const markerIndex = parsedUrl.pathname.indexOf(SUPABASE_PUBLIC_STORAGE_MARKER)
    if (markerIndex < 0) return null

    const bucketAndPath = parsedUrl.pathname
      .slice(markerIndex + SUPABASE_PUBLIC_STORAGE_MARKER.length)
      .replace(/^\/+/, '')
    if (!bucketAndPath) return null

    const firstSlashIndex = bucketAndPath.indexOf('/')
    if (firstSlashIndex <= 0) return null

    const bucket = bucketAndPath.slice(0, firstSlashIndex).trim()
    const objectPath = decodeURIComponent(bucketAndPath.slice(firstSlashIndex + 1))
      .trim()
      .replace(/^\/+/, '')
    if (!bucket || !objectPath) return null

    return { bucket, objectPath }
  } catch {
    return null
  }
}

export async function DELETE(request: NextRequest) {
  const adminToken = request.headers.get('x-admin-token')?.trim() ?? ''
  if (!adminToken) {
    return NextResponse.json({ error: 'Missing admin token' }, { status: 400 })
  }

  if (!checkAdminToken(adminToken)) {
    return NextResponse.json({ error: '无权限访问' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (body === null || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const payload = body as Record<string, unknown>
  const imageUrl = typeof payload.imageUrl === 'string' ? payload.imageUrl.trim() : ''
  const adId = typeof payload.adId === 'string' ? payload.adId.trim() : ''

  if (!adId) {
    return NextResponse.json({ error: 'Missing adId' }, { status: 400 })
  }

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 })
  }

  const supabase = getServiceClient()
  const parsedStorage = parseSupabaseStorageUrl(imageUrl)
  const isStorageImage = isAdsStorageUrl(imageUrl)
  const isExternalLink = !isStorageImage
  const parsedBucket = parsedStorage?.bucket ?? null
  const parsedObjectPath = parsedStorage?.objectPath ?? null

  let isReusedByOtherAds = false
  if (isStorageImage) {
    const referenceQuery = supabase
      .from('ads')
      .select('id', { count: 'exact', head: true })
      .eq('image_url', imageUrl)
    const scopedReferenceQuery = adId ? referenceQuery.neq('id', adId) : referenceQuery
    const { count, error: referenceError } = await scopedReferenceQuery
    if (referenceError) {
      return NextResponse.json({ error: '删除图片失败，请稍后再试' }, { status: 400 })
    }
    isReusedByOtherAds = Boolean(count && count > 0)
  }

  let imageUrlCleared = false
  const { error: updateError } = await supabase
    .from('ads')
    .update({ image_url: null })
    .eq('id', adId)

  if (updateError) {
    console.error('[admin ads image delete] update ad image_url failed', {
      adId,
      imageUrl,
      parsedBucket,
      parsedObjectPath,
      supabaseUpdateError: updateError,
    })
    return NextResponse.json({ error: '删除图片失败，请稍后再试' }, { status: 400 })
  }
  imageUrlCleared = true

  let storageDeleteAttempted = false
  let storageFileDeleted = false

  if (isStorageImage && !isReusedByOtherAds && parsedStorage) {
    storageDeleteAttempted = true
    const { error: removeError } = await supabase.storage
      .from(parsedStorage.bucket)
      .remove([parsedStorage.objectPath])
    if (removeError) {
      console.error('[admin ads image delete] storage remove failed', {
        adId,
        imageUrl,
        parsedBucket,
        parsedObjectPath,
        supabaseStorageRemoveError: removeError,
      })
    } else {
      storageFileDeleted = true
    }
  }

  const message = storageDeleteAttempted && !storageFileDeleted
    ? '图片已从广告中移除，Storage 文件清理稍后可再处理'
    : '图片已删除，可以重新上传或填写外部链接'

  return NextResponse.json({
    success: true,
    message,
    imageUrlCleared,
    storageDeleteAttempted,
    storageFileDeleted,
    isExternalLink,
    isReusedByOtherAds,
  })
}
