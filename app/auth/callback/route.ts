import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && user) {
      const cookieStore = await cookies()
      
      // -- OAUTH ROLE HANDLING --
      const oauthRole = cookieStore.get('oauth_role')?.value
      
      if (oauthRole) {
        // Check if profile already exists to avoid overwriting existing roles on login
        const { data: existingProfile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()

        if (!existingProfile) {
          // Only insert profile with the selected role if it's a brand new user
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              first_name: user.user_metadata?.full_name?.split(' ')[0] || 'Usuario',
              last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || (oauthRole === 'coach' ? 'Entrenador' : 'Atleta'),
              role: oauthRole as any,
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
          const { error: linkError } = await supabase
            .from('coach_athletes')
            .insert({
              coach_id: inviteCoachId,
              athlete_id: user.id,
              status: 'active'
            })
            
          if (!linkError || linkError.code === '23505') {
            // Also update backwards compatibility
            await supabase
              .from('profiles')
              .update({ coach_id: inviteCoachId } as any)
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
      const { data: profile } = await supabase.from('profiles').select('role, active_plan_id').eq('id', user.id).maybeSingle()
      
      let finalNext = next;
      if (profile?.role === 'coach') {
        finalNext = '/coach/dashboard';
      } else if (profile?.role === 'athlete' && !profile?.active_plan_id && next === '/dashboard') {
        finalNext = '/onboarding';
      }
      
      return NextResponse.redirect(`${origin}${finalNext}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=AuthCallbackError`)
}
