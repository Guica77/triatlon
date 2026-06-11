import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BiometricsCard } from '@/components/dashboard/biometrics-card';
import { FormStatusWidget } from '@/components/dashboard/form-status-widget';
import { DashboardViewTabs } from '@/components/dashboard/dashboard-view-tabs';
import { fetchAndCalculateAnalytics } from '@/app/(app)/analytics/analytics-actions';
import { LogOut, Settings, ChevronLeft, Calendar, Activity } from 'lucide-react';
import Link from 'next/link';
import { AnimatedButton } from '@/components/ui/animated-button';
import { SessionPlanner } from '@/components/coach/session-planner';
import { AdvancedCalendarWrapper } from '@/components/coach/advanced-calendar-wrapper';

interface AthletePageProps {
  params: Promise<{ id: string }>;
}

export default async function CoachAthleteDetailPage({ params }: AthletePageProps) {
  const { id: athleteId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 1. Verify user profile and coach role
  const { data: coachProfile } = await supabase
    .from('profiles')
    .select('role, first_name')
    .eq('id', user.id)
    .single();

  if (!coachProfile || coachProfile.role !== 'coach') {
    redirect('/dashboard');
  }

  // 2. Security Check: Verify athlete is in coach's roster
  const { data: rosterCheck } = await supabase
    .from('coach_athletes')
    .select('id')
    .eq('coach_id', user.id)
    .eq('athlete_id', athleteId)
    .maybeSingle();

  if (!rosterCheck) {
    // If not in roster, redirect back to coach dashboard
    redirect('/coach/dashboard');
  }

  // 3. Fetch athlete profile and active plan
  const { data: athleteProfileData } = await supabase
    .from('profiles')
    .select('*, training_plans(*)')
    .eq('id', athleteId)
    .single();

  if (!athleteProfileData) {
    redirect('/coach/dashboard');
  }

  const athleteProfile = athleteProfileData as {
    first_name?: string;
    last_name?: string;
    level?: string;
    garmin_connected?: boolean;
    strava_connected?: boolean;
    training_plans?: { name?: string };
  };
  const activePlan = athleteProfile.training_plans;

  // 4. Fetch daily biometrics for the athlete (simulated or real)
  const today = new Date().toISOString().split('T')[0];
  const { data: realBiometrics } = await supabase
    .from('user_biometrics')
    .select('*')
    .eq('user_id', athleteId)
    .eq('date', today)
    .maybeSingle();

  const biometrics = realBiometrics || {
    user_id: athleteId,
    date: today,
    hrv: null,
    rhr: null,
    sleep_hours: null,
    sleep_score: null,
    weight: null,
    fatigue_rating: null,
    stress_level: null,
    readiness_score: null,
  };

  // 5. Fetch PMC analytics for the athlete
  const analyticsData = await fetchAndCalculateAnalytics(athleteId);

  // 6. Fetch athlete connected devices (Strava / Garmin)
  const { data: devices } = await supabase
    .from('user_connected_devices')
    .select('provider')
    .eq('user_id', athleteId);
  const isConnected = Boolean(athleteProfile.garmin_connected || athleteProfile.strava_connected || (devices && devices.length > 0));

  // 7. Fetch calendar workouts for the current month range (standard calendar window)
  const now = new Date();
  
  // Calculate first day of current month, then go back to the Monday of that week
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startDayIdx = startOfMonth.getDay() || 7;
  const calendarStart = new Date(startOfMonth);
  calendarStart.setDate(calendarStart.getDate() - startDayIdx + 1);
  calendarStart.setHours(0, 0, 0, 0);

  // Calculate last day of current month, then go forward to the Sunday of that week
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const endDayIdx = endOfMonth.getDay() || 7;
  const calendarEnd = new Date(endOfMonth);
  calendarEnd.setDate(calendarEnd.getDate() + (7 - endDayIdx));
  calendarEnd.setHours(23, 59, 59, 999);

  const { data: workouts } = await supabase
    .from('user_workouts')
    .select('*, training_sessions(*), universal_telemetry(*)')
    .eq('user_id', athleteId)
    .gte('scheduled_date', calendarStart.toISOString().split('T')[0])
    .lte('scheduled_date', calendarEnd.toISOString().split('T')[0])
    .order('scheduled_date', { ascending: true });

  // 8. Weekly stats for progress percent
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

  return (
    <div className="min-h-screen bg-[var(--color-background)] pb-24 text-zinc-100 animate-fade-in">
      
      {/* Upper Deck Header */}
      <header className="sticky top-0 z-50 bg-[var(--color-background)]/90 backdrop-blur-md border-b border-[var(--color-border)] shadow-sm">
        <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-900/50">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/coach/dashboard" className="shrink-0 mr-1">
              <AnimatedButton variant="ghost" size="icon" className="w-9 h-9 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-100">
                <ChevronLeft className="w-4 h-4" />
              </AnimatedButton>
            </Link>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-zinc-50 truncate tracking-tight">
                Vista de Atleta: {athleteProfile.first_name || 'Triatleta'} {athleteProfile.last_name || ''}
              </h1>
              <p className="text-xs text-zinc-400 capitalize truncate flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
                Plan: {activePlan?.name || 'Sin plan activo'} • Nivel {athleteProfile.level}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/settings">
              <AnimatedButton variant="ghost" size="icon" className="w-9 h-9 text-zinc-400 hover:text-zinc-100 border border-zinc-800 rounded-xl">
                <Settings className="w-4 h-4" />
              </AnimatedButton>
            </Link>
            <form action="/auth/signout" method="post">
              <AnimatedButton variant="ghost" size="icon" className="w-9 h-9 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-transparent">
                <LogOut className="w-4 h-4" />
              </AnimatedButton>
            </form>
          </div>
        </div>

        {/* Level 2 Navigation Bar */}
        <div className="px-6 py-2.5 bg-zinc-950/60 flex items-center justify-between border-t border-zinc-900/30">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            <Link href="/coach/dashboard" className="shrink-0">
              <AnimatedButton variant="ghost" size="sm" className="rounded-full text-xs py-1.5 px-3.5 border border-zinc-800 bg-zinc-900/60 text-zinc-450 hover:text-zinc-200 transition-all flex items-center gap-1.5">
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Volver al Roster</span>
              </AnimatedButton>
            </Link>
            <Link href={`/coach/chat?athlete=${athleteId}`} className="shrink-0">
              <AnimatedButton variant="ghost" size="sm" className="rounded-full text-xs py-1.5 px-3.5 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:text-cyan-300 transition-all flex items-center gap-1.5">
                <span>Chat con {athleteProfile.first_name || 'Atleta'}</span>
              </AnimatedButton>
            </Link>
            <SessionPlanner athleteId={athleteId} />
          </div>
          <span className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800/80 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
            Modo Supervisor (Solo Lectura)
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 pt-8 space-y-8">
        
        {/* Connection status header */}
        {isConnected && (
          <div className="p-4 rounded-2xl bg-orange-500/5 border border-orange-500/15 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-100">Dispositivo Sincronizado</span>
                  <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[9px] font-bold border border-green-500/20">Strava/Garmin Activo</span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">El atleta tiene sincronización automática de actividades activada.</p>
              </div>
            </div>
          </div>
        )}

        {/* Section Biometrics and Readiness */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-full">
            <BiometricsCard initialBiometrics={biometrics} readOnly={true} />
          </div>
          <div className="h-full">
            <FormStatusWidget 
              tsb={analyticsData.currentTsb} 
              athleteLevel={athleteProfile.level}
              progressPercent={progressPercent}
            />
          </div>
        </section>

        {/* Advanced Builder */}
        <section className="space-y-4 pt-4 border-t border-zinc-800/60">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" /> 
              Constructor Semanal Inteligente
            </h2>
            <span className="text-xs text-zinc-500 font-medium bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800">
              Arrastra y suelta para reprogramar
            </span>
          </div>
          <AdvancedCalendarWrapper athleteId={athleteId} initialWorkouts={workouts || []} />
        </section>

        {/* Tabs of Calendar / List View */}
        <DashboardViewTabs 
          initialWorkouts={workouts || []} 
          isConnected={isConnected} 
          profile={athleteProfile} 
          readOnly={true}
        />

      </main>
    </div>
  );
}
