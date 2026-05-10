import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const SCANNED_BUCKETS = ['news-covers', 'ads', 'post-images'] as const
const SUPABASE_PUBLIC_STORAGE_MARKER = '/storage/v1/object/public/'
const IMG_OPENAA_HOST = 'img.openaa.com'

type ScannedBucket = (typeof SCANNED_BUCKETS)[number]
type ReferenceSource =
  | 'news_posts.cover_image_url'
  | 'ads.image_url'
  | 'housing_posts.images'
  | 'secondhand_items.images'
  | 'service_posts.images'

type ImageCleanupItem = {
  bucket: ScannedBucket
  path: string
  publicUrl: string
  isUsed: boolean
  references: ReferenceSource[]
}

type StorageListItem = {
  name: string
  id: string | null
  metadata: Record<string, unknown> | null
}

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

function normalizeValue(value: string): string {
  return value.trim()
}

function tryDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function parseSupabaseStorageUrl(value: string): { bucket: string, path: string } | null {
  try {
    const parsed = new URL(value)
    const markerIndex = parsed.pathname.indexOf(SUPABASE_PUBLIC_STORAGE_MARKER)
    if (markerIndex < 0) return null

    const bucketAndPath = parsed.pathname
      .slice(markerIndex + SUPABASE_PUBLIC_STORAGE_MARKER.length)
      .replace(/^\/+/, '')
    const slashIndex = bucketAndPath.indexOf('/')
    if (slashIndex <= 0) return null

    const bucket = bucketAndPath.slice(0, slashIndex).trim()
    const path = tryDecodeURIComponent(bucketAndPath.slice(slashIndex + 1)).trim().replace(/^\/+/, '')
    if (!bucket || !path) return null

    return { bucket, path }
  } catch {
    return null
  }
}

function collectReferenceCandidates(value: string): Set<string> {
  const normalized = normalizeValue(value)
  const candidates = new Set<string>()
  if (!normalized) return candidates

  candidates.add(normalized)
  candidates.add(tryDecodeURIComponent(normalized))

  const storageUrl = parseSupabaseStorageUrl(normalized)
  if (storageUrl) {
    candidates.add(`${storageUrl.bucket}/${storageUrl.path}`)
    candidates.add(storageUrl.path)
  }

  if (normalized.startsWith('/')) {
    candidates.add(normalized.slice(1))
  }

  return candidates
}

function collectFileMatchKeys(bucket: ScannedBucket, path: string, publicUrl: string): Set<string> {
  const keys = new Set<string>()
  const normalizedPath = path.trim().replace(/^\/+/, '')
  if (!normalizedPath) return keys

  keys.add(normalizedPath)
  keys.add(tryDecodeURIComponent(normalizedPath))
  keys.add(`${bucket}/${normalizedPath}`)
  keys.add(publicUrl)
  keys.add(tryDecodeURIComponent(publicUrl))

  const parsedPublicUrl = parseSupabaseStorageUrl(publicUrl)
  if (parsedPublicUrl) {
    keys.add(parsedPublicUrl.path)
    keys.add(`${parsedPublicUrl.bucket}/${parsedPublicUrl.path}`)
  }

  if (normalizedPath.startsWith(`${bucket}/`)) {
    keys.add(normalizedPath.slice(bucket.length + 1))
  }

  return keys
}

async function listBucketFilesRecursively(
  supabase: ReturnType<typeof getServiceClient>,
  bucket: ScannedBucket,
  folder = ''
): Promise<string[]> {
  const collectedPaths: string[] = []
  let offset = 0

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit: 100,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })

    if (error) {
      throw new Error(`[${bucket}] list failed: ${error.message}`)
    }

    if (!data || data.length === 0) break

    for (const entry of data as StorageListItem[]) {
      const name = typeof entry.name === 'string' ? entry.name.trim() : ''
      if (!name) continue

      const fullPath = folder ? `${folder}/${name}` : name
      if (!entry.id && !entry.metadata) {
        const nested = await listBucketFilesRecursively(supabase, bucket, fullPath)
        collectedPaths.push(...nested)
      } else {
        collectedPaths.push(fullPath)
      }
    }

    if (data.length < 100) break
    offset += 100
  }

  return collectedPaths
}

function addReference(
  referenceMap: Map<string, Set<ReferenceSource>>,
  source: ReferenceSource,
  rawValue: unknown
) {
  if (typeof rawValue !== 'string') return
  const value = rawValue.trim()
  if (!value) return

  const keys = collectReferenceCandidates(value)
  for (const key of keys) {
    const existing = referenceMap.get(key)
    if (existing) {
      existing.add(source)
    } else {
      referenceMap.set(key, new Set([source]))
    }
  }
}

async function buildReferenceMap(supabase: ReturnType<typeof getServiceClient>) {
  const referenceMap = new Map<string, Set<ReferenceSource>>()

  const [
    newsResult,
    adsResult,
    housingResult,
    secondhandResult,
    serviceResult,
  ] = await Promise.all([
    supabase.from('news_posts').select('cover_image_url'),
    supabase.from('ads').select('image_url'),
    supabase.from('housing_posts').select('images'),
    supabase.from('secondhand_items').select('images'),
    supabase.from('service_posts').select('images'),
  ])

  const queryResults = [newsResult, adsResult, housingResult, secondhandResult, serviceResult]
  const queryError = queryResults.find((item) => item.error)
  if (queryError?.error) {
    throw new Error(`Failed to load image references: ${queryError.error.message}`)
  }

  for (const row of newsResult.data ?? []) {
    addReference(referenceMap, 'news_posts.cover_image_url', (row as { cover_image_url?: unknown }).cover_image_url)
  }

  for (const row of adsResult.data ?? []) {
    addReference(referenceMap, 'ads.image_url', (row as { image_url?: unknown }).image_url)
  }

  for (const row of housingResult.data ?? []) {
    const images = (row as { images?: unknown }).images
    if (Array.isArray(images)) {
      for (const value of images) addReference(referenceMap, 'housing_posts.images', value)
    }
  }

  for (const row of secondhandResult.data ?? []) {
    const images = (row as { images?: unknown }).images
    if (Array.isArray(images)) {
      for (const value of images) addReference(referenceMap, 'secondhand_items.images', value)
    }
  }

  for (const row of serviceResult.data ?? []) {
    const images = (row as { images?: unknown }).images
    if (Array.isArray(images)) {
      for (const value of images) addReference(referenceMap, 'service_posts.images', value)
    }
  }

  return referenceMap
}

function getReferencesForFile(
  referenceMap: Map<string, Set<ReferenceSource>>,
  bucket: ScannedBucket,
  path: string,
  publicUrl: string
): ReferenceSource[] {
  const collected = new Set<ReferenceSource>()
  for (const key of collectFileMatchKeys(bucket, path, publicUrl)) {
    const matched = referenceMap.get(key)
    if (!matched) continue
    for (const source of matched) collected.add(source)
  }

  return Array.from(collected)
}

async function buildScanResult(supabase: ReturnType<typeof getServiceClient>): Promise<ImageCleanupItem[]> {
  const referenceMap = await buildReferenceMap(supabase)
  const output: ImageCleanupItem[] = []

  for (const bucket of SCANNED_BUCKETS) {
    const filePaths = await listBucketFilesRecursively(supabase, bucket)
    for (const path of filePaths) {
      const normalizedPath = path.trim().replace(/^\/+/, '')
      if (!normalizedPath) continue

      const { data } = supabase.storage.from(bucket).getPublicUrl(normalizedPath)
      const publicUrl = data.publicUrl
      const references = getReferencesForFile(referenceMap, bucket, normalizedPath, publicUrl)

      output.push({
        bucket,
        path: normalizedPath,
        publicUrl,
        isUsed: references.length > 0,
        references,
      })
    }
  }

  return output.sort((a, b) => {
    if (a.isUsed !== b.isUsed) return a.isUsed ? -1 : 1
    if (a.bucket !== b.bucket) return a.bucket.localeCompare(b.bucket)
    return a.path.localeCompare(b.path)
  })
}

function isAllowedBucket(bucket: string): bucket is ScannedBucket {
  return SCANNED_BUCKETS.includes(bucket as ScannedBucket)
}

function isForbiddenPublicUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed) return false

  try {
    const parsed = new URL(trimmed)
    return parsed.hostname === IMG_OPENAA_HOST
  } catch {
    return trimmed.includes(IMG_OPENAA_HOST)
  }
}

export async function GET(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '无权限访问' }, { status: 401 })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase service role missing' }, { status: 500 })
  }

  try {
    const supabase = getServiceClient()
    const data = await buildScanResult(supabase)
    return NextResponse.json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : '扫描失败，请稍后再试'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '无权限访问' }, { status: 401 })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase service role missing' }, { status: 500 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '请求参数错误' }, { status: 400 })
  }

  if (body === null || typeof body !== 'object') {
    return NextResponse.json({ error: '请求参数错误' }, { status: 400 })
  }

  const payload = body as Record<string, unknown>
  const bucket = typeof payload.bucket === 'string' ? payload.bucket.trim() : ''
  const path = typeof payload.path === 'string' ? payload.path.trim().replace(/^\/+/, '') : ''
  const publicUrl = typeof payload.publicUrl === 'string' ? payload.publicUrl.trim() : ''

  if (!isAllowedBucket(bucket)) {
    return NextResponse.json({ error: '仅允许删除指定 Storage bucket 的图片。' }, { status: 400 })
  }

  if (!path) {
    return NextResponse.json({ error: '图片 path 不能为空。' }, { status: 400 })
  }

  if (/^https?:\/\//i.test(path)) {
    return NextResponse.json({ error: '不允许删除外部图片链接。' }, { status: 400 })
  }

  if (isForbiddenPublicUrl(publicUrl)) {
    return NextResponse.json({ error: '不允许删除 img.openaa.com 图片。' }, { status: 400 })
  }

  try {
    const supabase = getServiceClient()
    const referenceMap = await buildReferenceMap(supabase)
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
    const references = getReferencesForFile(referenceMap, bucket, path, urlData.publicUrl)

    if (references.length > 0) {
      return NextResponse.json({ error: '这张图片仍在使用中，不能删除。', references }, { status: 400 })
    }

    const { error: removeError } = await supabase.storage.from(bucket).remove([path])
    if (removeError) {
      return NextResponse.json({ error: removeError.message || '删除失败，请稍后再试。' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : '删除失败，请稍后再试。'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
