import { NextRequest, NextResponse } from 'next/server'
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase-types'

type AuthResult =
  | {
      supabase: SupabaseClient<Database>
      user: User
    }
  | {
      errorResponse: NextResponse
    }

export async function authenticateUserRequest(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization')
  const token = authHeader?.replace('Bearer ', '').trim()

  if (!token) {
    return { errorResponse: NextResponse.json({ error: '未授权' }, { status: 401 }) }
  }

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser(token)

  if (!user) {
    return { errorResponse: NextResponse.json({ error: '未授权' }, { status: 401 }) }
  }

  return { supabase, user }
}
