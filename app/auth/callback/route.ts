import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sanitizeRedirectPath } from '@/lib/user-navigation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectPath =
    sanitizeRedirectPath(requestUrl.searchParams.get('redirect')) ??
    sanitizeRedirectPath(requestUrl.searchParams.get('redirectTo')) ??
    sanitizeRedirectPath(requestUrl.searchParams.get('next')) ??
    '/'

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (code && supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
}
