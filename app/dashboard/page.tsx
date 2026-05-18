import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DailyWorkoutCard } from '@/components/dashboard/daily-workout-card';
import { WeeklyNav } from '@/components/dashboard/weekly-nav';
import { BiometricsCard } from '@/components/dashboard/biometrics-card';
import { GlobalWatchStatusBar } from '@/components/dashboard/global-watch-status-bar';
import { getDailyBiometrics } from '@/app/dashboard/biometrics-actions';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Flame, Trophy, Calendar, User, Settings, LogOut, Activity, BarChart2, ShoppingBag } from 'lucide-react';
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
    .select('*, training_sessions(*), universal_telemetry(*)')
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
      
      {/* Upper Deck (Bento Header / Doble Nivel) */}
      <header className="sticky top-0 z-50 bg-[var(--color-background)]/90 backdrop-blur-md border-b border-[var(--color-border)] shadow-sm transition-all duration-300">
        {/* Nivel 1: Fila Superior (Identidad del Atleta y Salida) */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-900/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/80 flex items-center justify-center shadow-inner shrink-0 group hover:border-cyan-500/40 transition-colors">
              <Trophy className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-zinc-50 truncate tracking-tight">{activePlan?.name || 'Plan de Entrenamiento'}</h1>
              <p className="text-xs text-zinc-400 capitalize truncate flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shrink-0"></span>
                Atleta: {profile.first_name || 'Triatleta'} • Nivel {profile.level}
              </p>
            </div>
          </div>

          <form action="/auth/signout" method="post" className="shrink-0 ml-3">
            <AnimatedButton variant="ghost" size="icon" className="w-9 h-9 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 border border-transparent hover:border-red-500/20">
              <LogOut className="w-4 h-4" />
            </AnimatedButton>
          </form>
        </div>

        {/* Nivel 2: Fila Inferior (Barra de Píldoras de Acción / Quick Actions) */}
        <div className="px-6 py-2.5 bg-zinc-950/60 flex items-center gap-2 overflow-x-auto scrollbar-none border-t border-zinc-900/30">
          <Link href="/marketplace" className="shrink-0">
            <AnimatedButton variant="ghost" size="sm" className="rounded-full text-xs py-1.5 px-3.5 border border-cyan-500/30 bg-cyan-500/10 flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20 shadow-sm transition-all duration-200">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="font-medium">Material 2ª Mano</span>
            </AnimatedButton>
          </Link>
          <Link href="/analytics" className="shrink-0">
            <AnimatedButton variant="ghost" size="sm" className="rounded-full text-xs py-1.5 px-3.5 border border-zinc-800 bg-zinc-900/60 flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 hover:bg-zinc-800/60 transition-all duration-200">
              <BarChart2 className="w-3.5 h-3.5" />
              <span className="font-medium">Analíticas</span>
            </AnimatedButton>
          </Link>
          <Link href="/settings" className="shrink-0">
            <AnimatedButton variant="ghost" size="sm" className="rounded-full text-xs py-1.5 px-3.5 border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 transition-all duration-200 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5" />
              <span className="font-medium">Ajustes y Perfil</span>
            </AnimatedButton>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-8 space-y-8">
        
        {/* Sección Biometría y Readiness (Estilo Oura/Whoop) */}
        {biometrics && (
          <section className="space-y-3">
            <BiometricsCard initialBiometrics={biometrics} />
          </section>
        )}

        {/* Barra Global de Relojes (Garmin/Strava) */}
        <GlobalWatchStatusBar isConnected={isConnected} provider={devices?.[0]?.provider || (profile.garmin_connected ? 'garmin' : profile.strava_connected ? 'strava' : null)} />

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
              <DailyWorkoutCard key={w.id} workout={w as any} initialIsConnected={isConnected} virtualGarage={profile.virtual_garage || []} />
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
              <DailyWorkoutCard key={w.id} workout={w as any} initialIsConnected={isConnected} virtualGarage={profile.virtual_garage || []} />
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
