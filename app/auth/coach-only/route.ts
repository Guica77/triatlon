import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Ends a non-coach session on the coach host and explains why at the login.
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (profile?.role === 'coach') return NextResponse.redirect(new URL('/coach/dashboard', request.url))
    await supabase.auth.signOut()
  }

  return NextResponse.redirect(new URL('/login?role=coach&error=CoachOnly', request.url))
}
