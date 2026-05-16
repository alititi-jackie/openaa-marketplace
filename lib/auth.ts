import { supabase } from './supabase'
import { getSiteUrl } from './site'

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) return null
  return user
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) return null
  return session
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signUpWithEmail(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      emailRedirectTo: getSiteUrl('/auth/confirmed'),
    },
  })
  return { data, error }
}

export async function signInWithGoogle(redirectPath?: string) {
  const redirectUrl = new URL(getSiteUrl('/auth/callback'))

  if (redirectPath) {
    redirectUrl.searchParams.set('redirect', redirectPath)
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl.toString(),
    },
  })
  return { data, error }
}
