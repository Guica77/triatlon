import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DailyWorkoutCard } from '@/components/dashboard/daily-workout-card';
import { WeeklyNav } from '@/components/dashboard/weekly-nav';
import { BiometricsCard } from '@/components/dashboard/biometrics-card';
import { getDailyBiometrics } from '@/app/(app)/dashboard/biometrics-actions';
import { getAnalyticsDashboardData } from '@/app/(app)/analytics/analytics-actions';
import { FormStatusWidget } from '@/components/dashboard/form-status-widget';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Flame, Trophy, Calendar, User, Settings, LogOut, Activity, BarChart2, ShoppingBag, BookOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ActivitiesFeed } from '@/components/dashboard/activities-feed';
import { AppFeedbackModal } from '@/components/dashboard/app-feedback-modal';
import { DashboardViewTabs } from '@/components/dashboard/dashboard-view-tabs';
import { ObjectiveConfigCard } from '@/components/dashboard/objective-config-card';

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    console.error("DashboardPage: No user found! Redirecting to /login", authError);
    redirect('/login');
  }

  // 1. Obtener perfil y plan activo
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*, training_plans(*)')
    .eq('id', user.id)
    .single();

  if (!profileData) {
    redirect('/onboarding');
  }

  const profile = profileData as any;

  if (profile.role === 'coach') {
    redirect('/coach/dashboard');
  }

  if (!profile.active_plan_id) {
    redirect('/onboarding');
  }
  const activePlan = profile.training_plans;

  // 1.5 Obtener Biometría del Día (con auto-simulación inicial)
  const { data: biometrics } = await getDailyBiometrics();

  // 1.6 Obtener Datos PMC para el FormStatusWidget
  const analyticsData = await getAnalyticsDashboardData();

  // 1.8 Verificar conexiones de dispositivos OAuth activas (Garmin / Strava)
  const { data: devices } = await supabase
    .from('user_connected_devices')
    .select('provider')
    .eq('user_id', user.id);
  const isConnected = Boolean(profile.garmin_connected || profile.strava_connected || (devices && devices.length > 0));

  // 2. Obtener entrenamientos del mes en curso (rango completo de calendario)
  const now = new Date();
  
  // Calcular primer día del mes actual, y luego retroceder al Lunes de esa semana
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startDayIdx = startOfMonth.getDay() || 7;
  const calendarStart = new Date(startOfMonth);
  calendarStart.setDate(calendarStart.getDate() - startDayIdx + 1);
  calendarStart.setHours(0, 0, 0, 0);

  // Calcular último día del mes actual, y luego avanzar al Domingo de esa semana
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const endDayIdx = endOfMonth.getDay() || 7;
  const calendarEnd = new Date(endOfMonth);
  calendarEnd.setDate(calendarEnd.getDate() + (7 - endDayIdx));
  calendarEnd.setHours(23, 59, 59, 999);

  const { data: workouts } = await supabase
    .from('user_workouts')
    .select('*, training_sessions(*), universal_telemetry(*)')
    .eq('user_id', user.id)
    .gte('scheduled_date', calendarStart.toISOString().split('T')[0])
    .lte('scheduled_date', calendarEnd.toISOString().split('T')[0])
    .order('scheduled_date', { ascending: true });

  // 3. Identificar estadísticas rápidas de la semana actual
  const currentDay = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(monday.getDate() - currentDay + 1);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const monStr = monday.toISOString().split('T')[0];
  const sunStr = sunday.toISOString().split('T')[0];

  const weeklyWorkouts = workouts?.filter(w => w.scheduled_date >= monStr && w.scheduled_date <= sunStr) || [];
  const completedCount = weeklyWorkouts.filter(w => w.status === 'completed').length || 0;
  const totalCount = weeklyWorkouts.filter(w => w.training_sessions?.sport_type !== 'descanso').length || 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 4. Calcular días transcurridos desde registro para disparar feedback modal (NPS)
  const createdDate = new Date(profile.created_at || new Date());
  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const feedbackHistory = Array.isArray(profile.feedback_history)
    ? profile.feedback_history
    : [];

  let activeFeedbackDays: number | null = null;
  if (diffDays >= 7 && diffDays < 21 && !feedbackHistory.includes(7)) {
    activeFeedbackDays = 7;
  } else if (diffDays >= 21 && !feedbackHistory.includes(21)) {
    activeFeedbackDays = 21;
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24">
      {activeFeedbackDays !== null && (
        <AppFeedbackModal daysUsed={activeFeedbackDays} />
      )}
      
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
          <Link href="/principiantes" className="shrink-0">
            <AnimatedButton variant="ghost" size="sm" className="rounded-full text-xs py-1.5 px-3.5 border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 shadow-sm transition-all duration-200">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="font-medium">Zona Principiantes</span>
            </AnimatedButton>
          </Link>
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
        
        {/* Objective Configuration Card (If pending or to edit) */}
        <ObjectiveConfigCard targetRaceName={profile.target_race_name} />
        
        {/* Banner de Bienvenida a Principiantes */}
        {profile.level === 'principiante' && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/25 relative overflow-hidden group shadow-md shadow-emerald-950/20">
            {/* Ambient Background Light Glow */}
            <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-emerald-500/10 blur-3xl group-hover:bg-emerald-500/15 transition-all duration-500" />
            
            <div className="flex gap-4 items-start relative z-10">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5 shadow-inner">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                  ¡Bienvenido a tu viaje de triatlón, {profile.first_name || 'Triatleta'}! 🏁
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
                  Estás siguiendo un plan estructurado para principiantes. Recuerda que no necesitas relojes caros, potenciómetros ni bicicletas de miles de euros para empezar. Tu constancia y disfrutar del camino es lo único que importa.
                </p>
                <div className="pt-1.5 flex gap-3">
                  <Link href="/principiantes">
                    <AnimatedButton size="sm" className="!bg-emerald-500 hover:!bg-emerald-400 !text-black text-[11px] font-semibold py-1.5 px-3 rounded-lg shadow-sm shadow-emerald-950/25 flex items-center gap-1">
                      <span>Explorar Zona Principiantes</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </AnimatedButton>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Telemetría Activa (Sólo si está conectado, sin botón manual de forzado) */}
        {isConnected && (
          <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/15 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-100">Telemetría Activa (Auto 24/7)</span>
                  <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[9px] font-bold border border-green-500/20">Sincronización Pasiva</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">Tus actividades se marcan como hechas y se sincronizan al instante en cuanto se detectan en Strava.</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 bg-black/30 px-3 py-1.5 rounded-lg border border-zinc-800 text-[10px] text-zinc-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Conexión Activa
            </div>
          </div>
        )}

        {/* Sección Biometría y Readiness (Estilo Oura/Whoop) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {biometrics && (
            <div className="h-full">
              <BiometricsCard initialBiometrics={biometrics} />
            </div>
          )}
          <div className="h-full">
            <FormStatusWidget 
              tsb={analyticsData.currentTsb} 
              athleteLevel={profile.level}
              progressPercent={progressPercent}
            />
          </div>
        </section>

        <DashboardViewTabs 
          initialWorkouts={workouts || []} 
          isConnected={isConnected} 
          profile={profile} 
        />

        {/* Historial de Actividades Recientes de Strava (Sólo si está conectado) */}
        {isConnected && (
          <section className="space-y-4 pt-6 border-t border-zinc-900/50">
            <ActivitiesFeed />
          </section>
        )}

      </main>
    </div>
  );
}
