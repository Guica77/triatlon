import { welcomeDestination } from '@/lib/auth/welcome'
import { rememberAppleToken } from '@/lib/auth/apple-revocation'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { oauthDisplayName, parseOAuthRole, safeOAuthNext } from '@/lib/auth/oauth'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeOAuthNext(searchParams.get('next'))
  const cookieStore = await cookies()
  const selectedRole = parseOAuthRole(cookieStore.get('oauth_role')?.value)
  const profileFailure = () => {
    const destination = new URL('/login', origin)
    destination.searchParams.set('role', selectedRole || 'athlete')
    destination.searchParams.set('error', 'ProfileSetupError')
    return NextResponse.redirect(destination)
  }

  if (code) {
    const supabase = await createClient()
    const { data: { user, session }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && user) {
      const cookieStore = await cookies()
      const oauthProvider = cookieStore.get('oauth_provider')?.value
      cookieStore.delete('oauth_provider')
      if (oauthProvider === 'apple' && user.identities?.some(identity => identity.provider === 'apple')) {
        try { await rememberAppleToken(user.id, session) } catch { console.warn('Apple revocation token could not be stored') }
      }
      
      // -- OAUTH ROLE HANDLING --
      // Read the role from the cookie set securely by the client browser before the OAuth redirect
      const oauthRole = parseOAuthRole(cookieStore.get('oauth_role')?.value)
      
      if (oauthRole) {
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const supabaseAdmin = createAdminClient()
        
        // Check if profile already exists to avoid overwriting existing roles on login
        const { data: existingProfile, error: lookupError } = await supabaseAdmin.from('profiles').select('id').eq('id', user.id).maybeSingle()
        if (lookupError) return profileFailure()

        if (!existingProfile) {
          const displayName = oauthDisplayName(user.user_metadata)
          // Only insert profile with the selected role if it's a brand new user
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              first_name: displayName.firstName,
              last_name: displayName.lastName,
              role: oauthRole,
              level: 'intermedio'
            })
            
          if (profileError) return profileFailure()
        }
        
        cookieStore.delete('oauth_role')
      }

      // An invitation never creates a relationship during login: the athlete
      // reviews the coach and explicitly accepts on the invitation page.
      const pendingInvite = cookieStore.get('invite_coach_id')?.value;

      // -- REDIRECTION LOGIC --
      // Fetch profile to decide where to go
      const { data: profile, error: profileReadError } = await supabase.from('profiles').select('role, active_plan_id, coach_id').eq('id', user.id).maybeSingle()
      if (profileReadError || !profile) return profileFailure()
      
      let finalNext = next;
      if (!profile) {
        // Si no tiene perfil (usuario completamente nuevo por OAuth), redirigir directamente a onboarding
        finalNext = '/onboarding';
      } else if (profile.role === 'coach') {
        finalNext = '/coach/dashboard';
      } else if (profile.role === 'athlete' && !profile.active_plan_id && !profile.coach_id && next === '/dashboard') {
        finalNext = '/onboarding';
      }
      
      if (pendingInvite && /^[a-zA-Z0-9_-]{4,64}$/.test(pendingInvite)) finalNext = `/invite/${encodeURIComponent(pendingInvite)}`;
      const destination = new URL(welcomeDestination(finalNext) === finalNext ? `/welcome?next=${encodeURIComponent(finalNext)}` : finalNext, origin)
      destination.searchParams.set('_t', Date.now().toString())
      return NextResponse.redirect(destination)
    } else {
      console.error("OAuth Exchange Error:", error);
    }
  } else {
    console.error("No code provided in callback:", request.url);
  }

  // Determine fallback based on cookie
  const oauthRole = cookieStore.get('oauth_role')?.value;
  const fallback = oauthRole === 'coach' ? '/login?role=coach' : '/login?role=athlete';

  const fallbackUrl = new URL(fallback, origin)
  fallbackUrl.searchParams.set('error', 'AuthCallbackError')
  return NextResponse.redirect(fallbackUrl)
}
