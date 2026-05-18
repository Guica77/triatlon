import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DailyWorkoutCard } from '@/components/dashboard/daily-workout-card';
import { WeeklyNav } from '@/components/dashboard/weekly-nav';
import { BiometricsCard } from '@/components/dashboard/biometrics-card';
import { getDailyBiometrics } from '@/app/dashboard/biometrics-actions';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Flame, Trophy, Calendar, User, Settings, LogOut, Activity, BarChart2 } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Obtener perfil y plan activo
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, training_plans(*)')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.active_plan_id) {
    redirect('/onboarding');
  }

  const activePlan = profile.training_plans;

  // 1.5 Obtener Biometría del Día (con auto-simulación inicial)
  const { data: biometrics } = await getDailyBiometrics();

  // 1.8 Verificar conexiones de dispositivos OAuth activas (Garmin / Strava)
  const { data: devices } = await supabase
    .from('user_connected_devices')
    .select('provider')
    .eq('user_id', user.id);
  const isConnected = Boolean(profile.garmin_connected || profile.strava_connected || (devices && devices.length > 0));

  // 2. Obtener entrenamientos de la semana actual
  const now = new Date();
  const currentDay = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(monday.getDate() - currentDay + 1);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const { data: workouts } = await supabase
    .from('user_workouts')
    .select('*, training_sessions(*)')
    .eq('user_id', user.id)
    .gte('scheduled_date', monday.toISOString().split('T')[0])
    .lte('scheduled_date', sunday.toISOString().split('T')[0])
    .order('scheduled_date', { ascending: true });

  // 3. Identificar workout de Hoy y Mañana
  const todayStr = now.toISOString().split('T')[0];
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const todayWorkouts = workouts?.filter(w => w.scheduled_date === todayStr) || [];
  const tomorrowWorkouts = workouts?.filter(w => w.scheduled_date === tomorrowStr) || [];

  // Calcular estadísticas rápidas
  const completedCount = workouts?.filter(w => w.status === 'completed').length || 0;
  const totalCount = workouts?.filter(w => w.training_sessions?.sport_type !== 'descanso').length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24">
      
      {/* Top Navbar */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-inner">
            <Trophy className="w-4 h-4 text-zinc-300" />
          </div>
          <div>
            <h1 className="text-base font-medium text-zinc-50">{activePlan?.name}</h1>
            <p className="text-xs text-zinc-400 capitalize">Atleta: {profile.first_name || 'Triatleta'} • Nivel {profile.level}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/analytics">
            <AnimatedButton variant="ghost" size="sm" className="border border-zinc-800 flex items-center gap-2 text-cyan-400 hover:text-cyan-300">
              <BarChart2 className="w-4 h-4" />
              <span>Analíticas</span>
            </AnimatedButton>
          </Link>
          <Link href="/onboarding">
            <AnimatedButton variant="ghost" size="sm" className="border border-zinc-800">
              Cambiar Plan
            </AnimatedButton>
          </Link>
          <form action="/auth/signout" method="post">
            <AnimatedButton variant="ghost" size="icon" className="w-9 h-9 text-zinc-500 hover:text-red-400">
              <LogOut className="w-4 h-4" />
            </AnimatedButton>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-8 space-y-8">
        
        {/* Sección Biometría y Readiness (Estilo Oura/Whoop) */}
        {biometrics && (
          <section className="space-y-3">
            <BiometricsCard initialBiometrics={biometrics} />
          </section>
        )}

        {/* Barra de Navegación Semanal */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Semana Actual</h2>
            <span className="text-xs text-zinc-400">{completedCount} de {totalCount} completados ({progressPercent}%)</span>
          </div>
          <WeeklyNav workouts={(workouts as any) || []} />
        </section>

        {/* Sección Principal: Hoy */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-500" /> Entrenamientos de Hoy
            </h2>
            <span className="text-xs text-zinc-400">{todayStr}</span>
          </div>

          {todayWorkouts.length > 0 ? (
            todayWorkouts.map(w => (
              <DailyWorkoutCard key={w.id} workout={w as any} initialIsConnected={isConnected} />
            ))
          ) : (
            <ProCard className="text-center py-12 space-y-3 bg-zinc-900/30">
              <Activity className="w-8 h-8 text-zinc-600 mx-auto" />
              <p className="text-sm font-medium text-zinc-300">No hay sesiones programadas para hoy</p>
              <p className="text-xs text-zinc-500">Aprovecha para estirar o enfocar en tu nutrición y descanso.</p>
            </ProCard>
          )}
        </section>

        {/* Sección Secundaria: Mañana */}
        <section className="space-y-4 pt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Próxima Sesión (Mañana)</h2>
            <span className="text-xs text-zinc-400">{tomorrowStr}</span>
          </div>

          {tomorrowWorkouts.length > 0 ? (
            tomorrowWorkouts.map(w => (
              <DailyWorkoutCard key={w.id} workout={w as any} initialIsConnected={isConnected} />
            ))
          ) : (
            <ProCard className="text-center py-8 bg-zinc-900/20 border-zinc-800/60">
              <p className="text-xs text-zinc-500">Día de descanso programado para mañana</p>
            </ProCard>
          )}
        </section>

      </main>
    </div>
  );
}
