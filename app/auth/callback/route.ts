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
      // -- MAGIC LINK RESOLUTION --
      const cookieStore = await cookies()
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
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=AuthCallbackError`)
}
