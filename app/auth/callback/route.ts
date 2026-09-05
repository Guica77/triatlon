import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { oauthDisplayName, parseOAuthRole, safeOAuthNext } from '@/lib/auth/oauth'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeOAuthNext(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && user) {
      const cookieStore = await cookies()
      
      // -- OAUTH ROLE HANDLING --
      // Read the role from the cookie set securely by the client browser before the OAuth redirect
      const oauthRole = parseOAuthRole(cookieStore.get('oauth_role')?.value)
      
      if (oauthRole) {
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const supabaseAdmin = createAdminClient()
        
        // Check if profile already exists to avoid overwriting existing roles on login
        const { data: existingProfile } = await supabaseAdmin.from('profiles').select('id').eq('id', user.id).maybeSingle()

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
            
          if (profileError) console.error("Error inserting profile for OAuth:", profileError)
        }
        
        cookieStore.delete('oauth_role')
      }

      // -- MAGIC LINK RESOLUTION --
      const inviteCoachId = cookieStore.get('invite_coach_id')?.value

      if (inviteCoachId) {
        // Attempt to link athlete to coach
        try {
          const { createAdminClient } = await import('@/lib/supabase/admin')
          const supabaseAdmin = createAdminClient()
          
          const { error: linkError } = await supabaseAdmin
            .from('coach_athletes')
            .insert({
              coach_id: inviteCoachId,
              athlete_id: user.id,
              status: 'active'
            })
            
          if (!linkError || linkError.code === '23505') {
            // Also update backwards compatibility
            await supabaseAdmin
              .from('profiles')
              .update({ coach_id: inviteCoachId })
              .eq('id', user.id)
          }
        } catch (e) {
          console.error("Error resolving magic link:", e)
        }

        // Clean up cookie
        cookieStore.delete('invite_coach_id')
      }

      // -- REDIRECTION LOGIC --
      // Fetch profile to decide where to go
      const { data: profile } = await supabase.from('profiles').select('role, active_plan_id, coach_id').eq('id', user.id).maybeSingle()
      
      let finalNext = next;
      if (!profile) {
        // Si no tiene perfil (usuario completamente nuevo por OAuth), redirigir directamente a onboarding
        finalNext = '/onboarding';
      } else if (profile.role === 'coach') {
        finalNext = '/coach/dashboard';
      } else if (profile.role === 'athlete' && !profile.active_plan_id && !profile.coach_id && next === '/dashboard') {
        finalNext = '/onboarding';
      }
      
      const destination = new URL(finalNext, origin)
      destination.searchParams.set('_t', Date.now().toString())
      return NextResponse.redirect(destination)
    } else {
      console.error("OAuth Exchange Error:", error);
    }
  } else {
    console.error("No code provided in callback:", request.url);
  }

  // Determine fallback based on cookie
  const cookieStore = await cookies();
  const oauthRole = cookieStore.get('oauth_role')?.value;
  const fallback = oauthRole === 'coach' ? '/login?role=coach' : '/login?role=athlete';

  const fallbackUrl = new URL(fallback, origin)
  fallbackUrl.searchParams.set('error', 'AuthCallbackError')
  return NextResponse.redirect(fallbackUrl)
}
