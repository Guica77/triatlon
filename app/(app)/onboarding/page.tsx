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
    <div className="min-h-screen bg-[var(--color-background)] p-6 pt-16 flex flex-col items-center pb-24">
      <div className="w-full max-w-5xl space-y-12">

        {/* Header */}
        <header className="text-center space-y-3 max-w-xl mx-auto">
          <p className="text-xs text-swim uppercase tracking-widest font-bold">Onboarding Express · 2 pasos</p>
          <h1 className="text-4xl font-black tracking-tight text-text-primary">Configura tu Objetivo</h1>
          <p className="text-sm text-text-secondary font-medium leading-relaxed">
            Define tu meta, tu nivel y tu disponibilidad. La IA generará tu primer plan de entrenamiento en menos de 5 minutos.
          </p>
        </header>

        {/* Skip banner when user already has a plan or coach */}
        {canSkip && (
          <div className="w-full max-w-3xl mx-auto flex items-center justify-between gap-4 p-4 rounded-2xl bg-surface-card border border-border-default shadow-card">
            <div className="min-w-0">
              <p className="text-sm font-bold text-text-primary">
                {profile?.first_name || '¡Ya casi!'} · Ya tienes un plan o entrenador asignado
              </p>
              <p className="text-xs text-text-secondary mt-0.5">No necesitas repetir el onboarding. Puedes ir directo a tu dashboard.</p>
            </div>
            <Link
              href="/dashboard"
              className="shrink-0 flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-swim text-white text-sm font-bold hover:bg-swim/90 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              Ir al dashboard
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* 2-Step Wizard */}
        <div className="flex justify-center w-full">
          <HybridWizard />
        </div>

      </div>
    </div>
  );
}
