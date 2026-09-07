'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers, cookies } from 'next/headers'

async function resolveInviteCookie(_userId: string) {
  const cookieStore = await cookies();
  const invite = cookieStore.get('invite_coach_id')?.value;
  if (invite && /^[a-zA-Z0-9_-]{4,64}$/.test(invite)) redirect(`/invite/${encodeURIComponent(invite)}`);
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Comprobar si tiene perfil y plan activo
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    // Vincular al atleta con el coach si viene de una invitación


    let { data: profile } = await supabase
      .from('profiles')
      .select('active_plan_id, role')
      .eq('id', user.id)
      .maybeSingle()

    let isCoach = profile?.role === 'coach';

    // Si no tiene perfil (por ejemplo si falló por RLS al registrarse), lo creamos ahora que sí tiene sesión activa
    if (!profile) {
      const role = user.user_metadata?.role === 'coach' ? 'coach' : 'athlete';

      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        first_name: user.user_metadata?.first_name || 'Usuario',
        last_name: user.user_metadata?.last_name || (role === 'coach' ? 'Entrenador' : 'Atleta'),
        email: email,
        role: role,
        level: 'avanzado'
      });
      
      if (!insertError) {
        isCoach = role === 'coach';
        profile = { active_plan_id: null, role: role };
      }
    }

    await resolveInviteCookie(user.id);
    if (isCoach) {
      redirect('/coach/dashboard')
    }

    if (!profile?.active_plan_id) {
      redirect('/onboarding')
    }
  }

  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string
  const role = formData.get('role') === 'coach' ? 'coach' : 'athlete'

  const supabase = await createClient()

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: role,
        first_name: firstName,
        last_name: lastName
      }
    }
  })

  if (authError) {
    let errorMessage = authError.message;
    if (errorMessage.includes('Error sending confirmation email') || errorMessage.includes('rate limit')) {
      errorMessage = 'Límite de registros alcanzado por seguridad (Anti-Spam). Espera unos minutos antes de volver a intentarlo.';
    }
    return { error: errorMessage }
  }

  if (authData.user) {
      // Insertar perfil inicial usando admin client para saltar RLS ya que el usuario aún no tiene la cookie activa
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabaseAdmin = createAdminClient()
      
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          first_name: firstName || '',
          last_name: lastName || '',
          level: 'intermedio',
          email: email || '',
          role: role as 'coach' | 'athlete',
        })

      if (profileError) {
        console.error("Error creando perfil:", profileError)
      }

      // Vincular al atleta con el coach si viene de una invitación
      if (authData.session) await resolveInviteCookie(authData.user.id);
  }

  // Si requiere confirmación de email (la sesión no está activa tras el signup)
  if (!authData.session) {
    return { success: true, emailConfirmRequired: true }
  }

  if (role === 'coach') {
    redirect('/coach/dashboard')
  }

  redirect('/onboarding')
}

const getDynamicBaseUrl = async () => {
  const headerStore = await headers();
  const host = headerStore.get('host');
  const proto = headerStore.get('x-forwarded-proto') || 'https';
  
  if (host) {
    if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('192.168.')) {
      return `http://${host}`;
    }
    return `${proto}://${host}`;
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.trim();
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.trim()}`;
  return 'http://localhost:3000';
};

export async function getOAuthUrl(provider: 'apple' | 'google') {
  const supabase = await createClient()

  const baseUrl = await getDynamicBaseUrl()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${baseUrl}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { url: data.url }
}

export async function sendResetPasswordEmail(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createClient()
  const baseUrl = await getDynamicBaseUrl()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/callback?next=/auth/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
