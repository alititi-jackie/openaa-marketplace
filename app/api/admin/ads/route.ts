import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function isAuthorized(request: NextRequest): boolean {
  const adminToken = process.env.ADMIN_TOKEN
  if (!adminToken) return false
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '')
  return token === adminToken
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const supabase = getAdminSupabase()
  const { data, error } = await supabase
    .from('ads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: '未授权' }, { status: 401 })
  }

  const body = await request.json()
  const { image_url, link_url, position, start_date, end_date, is_active } = body

  if (!image_url || !link_url || !position) {
    return NextResponse.json({ error: '缺少必要字段: image_url, link_url, position' }, { status: 400 })
  }

  const VALID_POSITIONS = ['home', 'jobs', 'housing', 'marketplace']
  if (!VALID_POSITIONS.includes(position)) {
    return NextResponse.json({ error: '无效的 position 值' }, { status: 400 })
  }

  const supabase = getAdminSupabase()
  const { data, error } = await supabase
    .from('ads')
    .insert({
      image_url,
      link_url,
      position,
      start_date: start_date || null,
      end_date: end_date || null,
      is_active: is_active ?? true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data }, { status: 201 })
}
