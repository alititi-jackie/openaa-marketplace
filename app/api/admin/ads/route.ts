import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

export async function GET(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const position = searchParams.get('position')

  const supabase = getServiceClient()
  let query = supabase
    .from('ads')
    .select('*')
    .order('created_at', { ascending: false })

  if (position) query = query.eq('position', position)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  if (!checkAdminToken(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const formData = await request.formData()

  const file = formData.get('image') as File | null
  const link_url = formData.get('link_url') as string | null
  const link_type = (formData.get('link_type') as string) || 'external'
  const external_url = (formData.get('external_url') as string) || null
  const slug = (formData.get('slug') as string) || null
  const content = (formData.get('content') as string) || null
  const position = formData.get('position') as string
  const is_active = formData.get('is_active') !== 'false'
  const start_date = (formData.get('start_date') as string) || null
  const end_date = (formData.get('end_date') as string) || null

  if (link_type !== 'external' && link_type !== 'internal') {
    return NextResponse.json({ error: 'link_type must be external or internal' }, { status: 400 })
  }

  if (link_type === 'external' && !external_url && !link_url) {
    return NextResponse.json({ error: 'external_url is required for external ads' }, { status: 400 })
  }

  if (link_type === 'internal' && !slug) {
    return NextResponse.json({ error: 'slug is required for internal ads' }, { status: 400 })
  }

  if (!position) {
    return NextResponse.json({ error: 'position is required' }, { status: 400 })
  }

  let image_url = formData.get('image_url') as string | null

  if (file && file.size > 0) {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    const fileExt = (file.name.split('.').pop() || '').toLowerCase()
    if (!ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXTS.includes(fileExt)) {
      return NextResponse.json({ error: '只允许上传图片文件 (jpeg/png/gif/webp)' }, { status: 400 })
    }

    const fileName = `ads/${Date.now()}.${fileExt}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('ads')
      .upload(fileName, buffer, { contentType: file.type, upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 })
    }

    const { data: urlData } = supabase.storage.from('ads').getPublicUrl(fileName)
    image_url = urlData.publicUrl
  }

  if (!image_url) {
    return NextResponse.json({ error: 'image is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ads')
    .insert({
      image_url,
      // link_url mirrors external_url for backward compatibility with existing queries
      link_url: link_type === 'external' ? (external_url || link_url) : null,
      link_type,
      external_url: link_type === 'external' ? (external_url || link_url) : null,
      slug: link_type === 'internal' ? slug : null,
      content: link_type === 'internal' ? content : null,
      position,
      is_active,
      start_date,
      end_date,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data }, { status: 201 })
}
