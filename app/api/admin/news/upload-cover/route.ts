import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

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

function sanitizeSegment(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '无权限访问' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: '未收到文件' }, { status: 400 })
  }

  // Validate type
  const nameParts = file.name.split('.')
  const fileExt = nameParts.length > 1 ? (nameParts.pop() ?? '').toLowerCase() : ''
  if (!fileExt || !ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXTS.includes(fileExt)) {
    return NextResponse.json({ error: '图片格式仅支持 JPG、PNG、WEBP' }, { status: 400 })
  }

  // Validate size
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: '图片大小不能超过 5MB' }, { status: 400 })
  }

  const rawSlug = typeof formData.get('slug') === 'string' ? (formData.get('slug') as string).trim() : ''
  const slugDir = rawSlug ? sanitizeSegment(rawSlug) : 'temp'
  // Remove only the validated extension from the base name
  const baseName = file.name.slice(0, file.name.length - fileExt.length - 1)
  const safeBaseName = sanitizeSegment(baseName) || 'cover'
  const filePath = `news-covers/${slugDir}/${Date.now()}-${safeBaseName}.${fileExt}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = new Uint8Array(arrayBuffer)

  const supabase = getServiceClient()
  const { error: uploadError } = await supabase.storage
    .from('news-covers')
    .upload(filePath, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 })
  }

  const { data: urlData } = supabase.storage.from('news-covers').getPublicUrl(filePath)
  return NextResponse.json({ url: urlData.publicUrl })
}
