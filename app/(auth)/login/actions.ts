'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
    // Seeding on login for demo users
    if (email === 'coach-demo@triatlonpro.com' || email === 'demo@triatlonpro.com') {
      const { seedDemoData } = await import('@/lib/demo-seeder')
      await seedDemoData(email, user.id)
    }

    let { data: profile } = await supabase
      .from('profiles')
      .select('active_plan_id, role')
      .eq('id', user.id)
      .maybeSingle()

    let isCoach = profile?.role === 'coach' || user.user_metadata?.role === 'coach' || email === 'coach-demo@triatlonpro.com';

    if (email === 'coach-demo@triatlonpro.com') {
      // Force update the profile role in DB just in case it was created as athlete
      if (profile && profile.role !== 'coach') {
        await supabase.from('profiles').update({ role: 'coach' }).eq('id', user.id);
        profile.role = 'coach';
      }
    }

    // Si no tiene perfil (por ejemplo si falló por RLS al registrarse), lo creamos ahora que sí tiene sesión activa
    if (!profile) {
      const role = email === 'coach-demo@triatlonpro.com' ? 'coach' 
                 : email === 'demo@triatlonpro.com' ? 'athlete' 
                 : (user.user_metadata?.role || 'athlete');
                 
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
  const role = (formData.get('role') as string) || 'athlete'

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
      errorMessage = 'Límite de registros alcanzado por seguridad (Anti-Spam). Usa "coach-demo@triatlonpro.com" iniciando sesión para probar la demo.';
    }
    return { error: errorMessage }
  }

  if (authData.user) {
    if (email === 'coach-demo@triatlonpro.com' || email === 'demo@triatlonpro.com') {
      const { seedDemoData } = await import('@/lib/demo-seeder')
      await seedDemoData(email, authData.user.id)
    } else {
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
    }
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

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.trim();
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.trim()}`;
  return 'http://localhost:3000';
};

export async function signInWithOAuth(provider: 'apple' | 'google', role?: string) {
  const supabase = await createClient()
  
  if (role) {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    cookieStore.set('oauth_role', role, { path: '/', maxAge: 60 * 5 }) // Expires in 5 mins
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${getBaseUrl()}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function sendResetPasswordEmail(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getBaseUrl()}/auth/callback?next=/auth/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
