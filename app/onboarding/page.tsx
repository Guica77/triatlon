import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HybridWizard } from '@/components/onboarding/hybrid-wizard';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role === 'coach') {
    redirect('/coach/dashboard');
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6 pt-16 flex flex-col items-center pb-24">
      <div className="w-full max-w-5xl space-y-12">
        
        {/* Header */}
        <header className="text-center space-y-3 max-w-xl mx-auto">
          <p className="text-xs text-cyan-400 uppercase tracking-widest font-semibold">Onboarding Pro</p>
          <h1 className="text-4xl font-light tracking-tight text-zinc-50">Configura tu Objetivo</h1>
          <p className="text-sm text-zinc-400 font-normal leading-relaxed">
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
