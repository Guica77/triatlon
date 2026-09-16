import { WelcomeReady } from '@/components/brand/authenticated-welcome'
import * as React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HybridWizard } from '@/components/onboarding/hybrid-wizard';
import { ChevronRight, LayoutDashboard } from 'lucide-react';

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
    .select('role, coach_id, active_plan_id, first_name')
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

  // If the user already has a coach or an active plan, allow skipping straight to the dashboard
  const canSkip = Boolean(profile?.coach_id || profile?.active_plan_id);

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.07),transparent_30rem)] bg-[var(--color-background)] px-4 pb-16 pt-10 sm:px-6 sm:pt-16">
      <WelcomeReady />
      <div className="mx-auto w-full max-w-5xl space-y-8 sm:space-y-10">

        {/* Header */}
        <header className="mx-auto max-w-2xl space-y-3 text-center">
          <p className="text-xs font-semibold tracking-wide text-swim">CONFIGURACIÓN INICIAL</p>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">Prepara tu plan</h1>
          <p className="text-[15px] leading-6 text-text-secondary">
            Define tu objetivo, tu nivel y el tiempo que tienes disponible. Solo pedimos lo necesario para empezar bien.
          </p>
        </header>

        {/* Skip banner when user already has a plan or coach */}
        {canSkip && (
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 rounded-[20px] border border-border-default bg-surface-card p-4 shadow-card">
            <div className="min-w-0">
              <p className="text-sm font-bold text-text-primary">
                {profile?.first_name || '¡Ya casi!'} · Ya tienes un plan o entrenador asignado
              </p>
              <p className="text-xs text-text-secondary mt-0.5">No necesitas repetir el onboarding. Puedes ir directo a tu dashboard.</p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-swim px-4 text-sm font-semibold text-white transition-colors hover:bg-swim/90"
            >
              <LayoutDashboard className="w-4 h-4" />
              Ir al dashboard
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* 2-Step Wizard */}
        <div className="flex w-full justify-center">
          <HybridWizard />
        </div>

      </div>
    </main>
  );
}
