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

function checkAdminToken(request: NextRequest): boolean {
  const token = request.headers.get('x-admin-token')
  return token === process.env.ADMIN_TOKEN && !!process.env.ADMIN_TOKEN
}

function isAdsStorageUrl(url: string): boolean {
  return url.includes(`/storage/v1/object/public/${ADS_BUCKET}/`)
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

  const tokenValid = checkAdminToken(request)
  if (!tokenValid) {
    console.error('[admin ads image delete] invalid admin token', {
      tokenValid,
    })
    return NextResponse.json({ error: 'Invalid admin token' }, { status: 401 })
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

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase service role missing' }, { status: 500 })
  }

  const isStorageImage = isAdsStorageUrl(imageUrl)
  const isExternalLink = !isStorageImage
  const supabase = getServiceClient()

  const { data: adExists, error: adCheckError } = await supabase
    .from('ads')
    .select('id')
    .eq('id', adId)
    .maybeSingle()

  if (adCheckError) {
    console.error('[admin ads image delete] ad lookup failed', {
      adId,
      imageUrl,
      isExternalLink,
      checkError: adCheckError,
    })
    return NextResponse.json(
      { error: 'Ad lookup failed', details: adCheckError.message || 'Failed to query ad row' },
      { status: 400 }
    )
  }

  if (!adExists) {
    return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
  }

  if (isExternalLink) {
    const { data: updatedRow, error: updateError } = await supabase
      .from('ads')
      .update({ image_url: null })
      .eq('id', adId)
      .select('id')
      .maybeSingle()

    if (updateError) {
      console.error('[admin ads image delete] clear external image_url failed', {
        adId,
        imageUrl,
        isExternalLink,
        updateError,
      })
      return NextResponse.json(
        { error: 'Failed to clear ad image_url', details: updateError.message || 'Supabase update returned error' },
        { status: 400 }
      )
    }

    if (!updatedRow) {
      return NextResponse.json(
        { error: 'Failed to clear ad image_url', details: 'Supabase returned no updated rows' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: '图片已删除，可以重新上传或填写外部链接',
      imageUrlCleared: true,
      isExternalLink: true,
      storageDeleteAttempted: false,
      storageFileDeleted: false,
    })
  }

  const parsedStorage = parseSupabaseStorageUrl(imageUrl)
  if (!parsedStorage) {
    return NextResponse.json(
      { error: 'Invalid storage image URL', details: 'Supabase Storage URL parsing failed' },
      { status: 400 }
    )
  }

  let isReusedByOtherAds = false
  const referenceQuery = supabase
    .from('ads')
    .select('id', { count: 'exact', head: true })
    .eq('image_url', imageUrl)
  const scopedReferenceQuery = adId ? referenceQuery.neq('id', adId) : referenceQuery
  const { count, error: referenceError } = await scopedReferenceQuery
  if (referenceError) {
    return NextResponse.json(
      { error: 'Failed to check image references', details: referenceError.message || 'Reference query failed' },
      { status: 400 }
    )
  }
  isReusedByOtherAds = Boolean(count && count > 0)

  const { data: updatedRow, error: updateError } = await supabase
    .from('ads')
    .update({ image_url: null })
    .eq('id', adId)
    .select('id')
    .maybeSingle()

  if (updateError) {
    console.error('[admin ads image delete] update ad image_url failed', {
      adId,
      imageUrl,
      isExternalLink,
      updateError,
    })
    return NextResponse.json(
      { error: 'Failed to clear ad image_url', details: updateError.message || 'Supabase update returned error' },
      { status: 400 }
    )
  }

  if (!updatedRow) {
    return NextResponse.json(
      { error: 'Failed to clear ad image_url', details: 'Supabase returned no updated rows' },
      { status: 400 }
    )
  }

  let storageDeleteAttempted = false
  let storageFileDeleted = false

  if (!isReusedByOtherAds) {
    storageDeleteAttempted = true
    const { error: removeError } = await supabase.storage
      .from(parsedStorage.bucket)
      .remove([parsedStorage.objectPath])
    if (removeError) {
      console.error('[admin ads image delete] storage remove failed', {
        adId,
        imageUrl,
        isExternalLink,
        removeError,
      })
    } else {
      storageFileDeleted = true
    }
  }

  const message = storageDeleteAttempted && !storageFileDeleted
    ? '图片已从广告中移除，Storage 文件清理稍后可再处理'
    : '图片已删除，可以重新上传或填写外部链接'

  return NextResponse.json({
    message,
    imageUrlCleared: true,
    storageDeleteAttempted,
    storageFileDeleted,
    isExternalLink,
    isReusedByOtherAds,
  })
}
