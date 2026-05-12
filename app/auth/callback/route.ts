import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resolveRedirectPath } from '@/lib/user-navigation'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const redirectPath = resolveRedirectPath(
    requestUrl.searchParams.get('redirect'),
    requestUrl.searchParams.get('redirectTo'),
    requestUrl.searchParams.get('next'),
  )

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (code && supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    await supabase.auth.exchangeCodeForSession(code)
  }

  const finalRedirectPath = redirectPath === '/profile' ? '/' : redirectPath
  return NextResponse.redirect(new URL(finalRedirectPath, requestUrl.origin))
}
