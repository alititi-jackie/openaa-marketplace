import { NextRequest, NextResponse } from 'next/server'
import { authenticateUserRequest } from '@/lib/request-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const auth = await authenticateUserRequest(request)
  if ('errorResponse' in auth) return auth.errorResponse

  const { data, error } = await auth.supabase
    .from('user_settings')
    .select('navigation_default')
    .eq('user_id', auth.user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({
    data: { navigation_default: data?.navigation_default === 'my' ? 'my' : 'public' },
  })
}

export async function PATCH(request: NextRequest) {
  const auth = await authenticateUserRequest(request)
  if ('errorResponse' in auth) return auth.errorResponse

  const body: unknown = await request.json()
  if (body === null || typeof body !== 'object') {
    return NextResponse.json({ error: '无效请求体' }, { status: 400 })
  }

  const navigationDefault = (body as Record<string, unknown>).navigation_default
  if (navigationDefault !== 'public' && navigationDefault !== 'my') {
    return NextResponse.json({ error: 'navigation_default 只能是 public 或 my' }, { status: 400 })
  }

  const { data, error } = await auth.supabase
    .from('user_settings')
    .upsert(
      {
        user_id: auth.user.id,
        navigation_default: navigationDefault,
      },
      { onConflict: 'user_id' }
    )
    .select('navigation_default')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data })
}
