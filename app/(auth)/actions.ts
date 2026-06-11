'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
};

// =======================
// OAUTH ACTIONS
// =======================
export async function getOAuthUrl(provider: 'apple' | 'google', role?: 'athlete' | 'coach') {
  const supabase = await createClient();

  if (role) {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    cookieStore.set('oauth_role', role, { 
      path: '/', 
      maxAge: 60 * 5, 
      sameSite: 'lax', 
      secure: process.env.NODE_ENV === 'production' 
    });
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${getBaseUrl()}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { url: data.url };
}

// =======================
// ATHLETE ACTIONS
// =======================
export async function loginAthlete(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Credenciales inválidas o correo no confirmado.' };
  }

  // We rely on middleware or callback to handle redirection
  // We can return success to let the client component redirect to dashboard
  return { success: true };
}

export async function registerAthlete(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  
  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `${firstName} ${lastName}`.trim(),
        role: 'athlete',
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (authData.user) {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabaseAdmin = createAdminClient();
    
    await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        first_name: firstName || '',
        last_name: lastName || '',
        level: 'intermedio',
        email: email || '',
        role: 'athlete',
      });
  }

  return { emailConfirmRequired: true };
}

// =======================
// COACH ACTIONS
// =======================
export async function loginCoach(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'Credenciales inválidas o correo no confirmado.' };
  }

  return { success: true };
}

export async function registerCoach(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  
  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `${firstName} ${lastName}`.trim(),
        role: 'coach',
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (authData.user) {
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const supabaseAdmin = createAdminClient();
    
    await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        first_name: firstName || '',
        last_name: lastName || '',
        level: 'intermedio',
        email: email || '',
        role: 'coach',
      });
  }

  return { emailConfirmRequired: true };
}

// =======================
// COMMON ACTIONS
// =======================
export async function sendResetPasswordEmail(formData: FormData) {
  const email = formData.get('email') as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getBaseUrl()}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
