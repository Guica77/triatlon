import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HybridWizard } from '@/components/onboarding/hybrid-wizard';

export const dynamic = 'force-dynamic'

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    console.error("OnboardingPage: No user found! Redirecting to /login", authError);
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  // Determine if the user is a coach either from their existing profile or their auth metadata
  const isCoach = profile?.role === 'coach' || user.user_metadata?.role === 'coach' || user.email === 'coach-demo@triatlonpro.com';

  if (isCoach) {
    // If they are a coach but don't have a profile yet, or the role is wrong in DB, fix it
    if (!profile || profile.role !== 'coach') {
      const payload = {
        id: user.id,
        role: 'coach',
        first_name: user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.first_name || 'Entrenador',
        last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || user.user_metadata?.last_name || '',
      };
      
      if (profile) {
        await supabase.from('profiles').update({ role: 'coach' }).eq('id', user.id);
      } else {
        await supabase.from('profiles').insert(payload);
      }
    }
    redirect('/coach/dashboard');
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 pt-16 flex flex-col items-center pb-24">
      <div className="w-full max-w-5xl space-y-12">
        
        {/* Header */}
        <header className="text-center space-y-3 max-w-xl mx-auto">
          <p className="text-xs text-cyan-500 uppercase tracking-widest font-bold">Onboarding Pro</p>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900">Configura tu Objetivo</h1>
          <p className="text-sm text-zinc-600 font-medium leading-relaxed">
            Define tu meta, calibra tu fisiología y configura tu Garaje Virtual. La Inteligencia Artificial generará tu periodización de rendimiento al instante.
          </p>
        </header>

        {/* 3-Step Wizard */}
        <div className="flex justify-center w-full">
          <HybridWizard />
        </div>

      </div>
    </div>
  );
}
