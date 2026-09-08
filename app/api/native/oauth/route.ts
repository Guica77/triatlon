import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const nativeLogin = new URL('/login?error=AuthCallbackError', 'https://invalid.local')

export async function GET(request: Request) {
  const provider = new URL(request.url).searchParams.get('provider')
  if (provider !== 'apple' && provider !== 'google') return NextResponse.redirect(new URL('/login', request.url))

  const origin = new URL(request.url).origin
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin}/auth/callback` },
  })
  if (error || !data.url) {
    const destination = new URL(nativeLogin.pathname + nativeLogin.search, origin)
    return NextResponse.redirect(destination)
  }

  const response = NextResponse.redirect(data.url)
  const secure = process.env.NODE_ENV === 'production'
  response.cookies.set('oauth_provider', provider, { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 600 })
  response.cookies.set('oauth_role', 'athlete', { httpOnly: true, secure, sameSite: 'lax', path: '/', maxAge: 300 })
  // The response deliberately contains no access token; Supabase exchanges the OAuth code server-side.
  return response
}
