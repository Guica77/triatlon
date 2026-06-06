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

    const { data: profile } = await supabase
      .from('profiles')
      .select('active_plan_id, role')
      .eq('id', user.id)
      .single()

    if (profile) {
      if (profile.role === 'coach') {
        redirect('/coach/dashboard')
      }
      if (!profile.active_plan_id) {
        redirect('/onboarding')
      }
    } else {
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
  })

  if (authError) {
    return { error: authError.message }
  }

  if (authData.user) {
    if (email === 'coach-demo@triatlonpro.com' || email === 'demo@triatlonpro.com') {
      const { seedDemoData } = await import('@/lib/demo-seeder')
      await seedDemoData(email, authData.user.id)
    } else {
      // Insertar perfil inicial
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          first_name: firstName || '',
          last_name: lastName || '',
          level: 'intermedio',
          email: email || '',
          role: role as any,
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

export async function signInWithOAuth(provider: 'apple' | 'google') {
  const supabase = await createClient()
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
