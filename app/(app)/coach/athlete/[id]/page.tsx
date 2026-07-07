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
import { AthleteNutritionCard } from '@/components/coach/athlete-nutrition-card';
import { getDailyNutrition } from '@/app/(app)/dashboard/nutrition-actions';
import { getCoachLibrary } from './actions';
import { CoachAthleteZonesEditor } from '@/components/coach/coach-athlete-zones-editor';

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

  const today = now.toISOString().split('T')[0];

  // 1. Fetch coach role, security check, profiles, biometrics, analytics, devices, and workouts in parallel
  const [
    coachProfileRes,
    rosterCheckRes,
    athleteProfileRes,
    realBiometricsRes,
    biometricsHistoryRes,
    analyticsData,
    devicesRes,
    workoutsRes,
    nutritionRes,
    libraryRes
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('role, first_name')
      .eq('id', user.id)
      .single(),
    supabase
      .from('coach_athletes')
      .select('id')
      .eq('coach_id', user.id)
      .eq('athlete_id', athleteId)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('*, training_plans(*)')
      .eq('id', athleteId)
      .single(),
    supabase
      .from('user_biometrics')
      .select('*')
      .eq('user_id', athleteId)
      .eq('date', today)
      .maybeSingle(),
    supabase
      .from('user_biometrics')
      .select('date, hrv, rhr, sleep_hours, readiness_score')
      .eq('user_id', athleteId)
      .order('date', { ascending: false })
      .limit(7),
    fetchAndCalculateAnalytics(athleteId),
    supabase
      .from('user_connected_devices')
      .select('provider')
      .eq('user_id', athleteId),
    supabase
      .from('user_workouts')
      .select('*, training_sessions(*), universal_telemetry(*)')
      .eq('user_id', athleteId)
      .gte('scheduled_date', calendarStart.toISOString().split('T')[0])
      .lte('scheduled_date', calendarEnd.toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true }),
    getDailyNutrition(today, athleteId),
    getCoachLibrary()
  ]);

  const coachProfile = coachProfileRes.data;
  if (!coachProfile || coachProfile.role !== 'coach') {
    redirect('/dashboard');
  }

  if (!rosterCheckRes.data) {
    redirect('/coach/dashboard');
  }

  const athleteProfileData = athleteProfileRes.data;
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
    allergies?: string[];
    preferred_ingredients?: string[];
    disliked_ingredients?: string[];
    previous_injuries?: string;
    current_ftp?: number;
    current_swim_pace?: string;
    current_run_pace?: string;
  };
  const activePlan = athleteProfile.training_plans;

  const biometrics = realBiometricsRes.data || {
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

  const biometricsHistory = biometricsHistoryRes.data ? [...biometricsHistoryRes.data].reverse() : [];
  const devices = devicesRes.data;
  const isConnected = Boolean(athleteProfile.garmin_connected || athleteProfile.strava_connected || (devices && devices.length > 0));
  const workouts = workoutsRes.data;
  const dailyNutritionData = nutritionRes.data;

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
    <div className="min-h-screen bg-[var(--color-background)] pb-24 text-zinc-900 animate-fade-in">
      
      {/* Upper Deck Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-sm transition-all duration-300">
        <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-100">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/coach/dashboard" className="shrink-0 mr-1">
              <AnimatedButton variant="ghost" size="icon" className="w-9 h-9 border border-zinc-200 rounded-xl text-zinc-450 hover:text-zinc-850 hover:bg-zinc-50">
                <ChevronLeft className="w-4 h-4" />
              </AnimatedButton>
            </Link>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-zinc-850 truncate tracking-tight">
                Vista de Atleta: {athleteProfile.first_name || 'Triatleta'} {athleteProfile.last_name || ''}
              </h1>
              <p className="text-xs text-zinc-500 font-semibold capitalize truncate flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shrink-0"></span>
                Plan: {activePlan?.name || 'Sin plan activo'} • Nivel {athleteProfile.level}
              </p>
              
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className="flex items-center gap-2 text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200" title="Carga Crónica (Fitness)">
                    CTL: {Math.round(analyticsData.currentCtl)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200" title="Carga Aguda (Fatiga)">
                    ATL: {Math.round(analyticsData.currentAtl)}
                  </span>
                  <span className={`px-2 py-0.5 rounded border ${analyticsData.currentTsb > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`} title="Balance de Estrés (Estado de Forma)">
                    TSB: {Math.round(analyticsData.currentTsb)}
                  </span>
                </div>
                
                {athleteProfile.previous_injuries && (
                  <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold flex items-center gap-1" title={athleteProfile.previous_injuries}>
                    <Activity className="w-3 h-3" /> Lesiones previas documentadas
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/settings">
              <AnimatedButton variant="ghost" size="icon" className="w-9 h-9 text-zinc-455 hover:text-zinc-850 hover:bg-zinc-50 border border-zinc-200 rounded-xl">
                <Settings className="w-4 h-4" />
              </AnimatedButton>
            </Link>
            <form action="/auth/signout" method="post">
              <AnimatedButton variant="ghost" size="icon" className="w-9 h-9 text-zinc-450 hover:text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100">
                <LogOut className="w-4 h-4" />
              </AnimatedButton>
            </form>
          </div>
        </div>

        {/* Level 2 Navigation Bar */}
        <div className="px-6 py-2.5 bg-zinc-50/50 flex items-center justify-between border-t border-zinc-100">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            <Link href="/coach/dashboard" className="shrink-0">
              <AnimatedButton variant="ghost" size="sm" className="rounded-full text-xs py-1.5 px-3.5 border border-zinc-200 bg-white text-zinc-650 hover:text-zinc-850 hover:bg-zinc-50 transition-all flex items-center gap-1.5">
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Volver al Roster</span>
              </AnimatedButton>
            </Link>
            <Link href={`/coach/chat?athlete=${athleteId}`} className="shrink-0">
              <AnimatedButton variant="ghost" size="sm" className="rounded-full text-xs py-1.5 px-3.5 border border-cyan-500/20 bg-cyan-500/10 text-cyan-650 hover:text-cyan-700 hover:bg-cyan-500/20 transition-all flex items-center gap-1.5">
                <span>Chat con {athleteProfile.first_name || 'Atleta'}</span>
              </AnimatedButton>
            </Link>
            <SessionPlanner athleteId={athleteId} />
          </div>
          <span className="px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-[10px] text-cyan-650 font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Modo Entrenador Activo
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 pt-8 space-y-8">
        
        {/* Connection status header */}
        {isConnected && (
          <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-between gap-4 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-600 shrink-0">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-850">Dispositivo Sincronizado</span>
                  <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-[9px] font-bold border border-green-150">Strava/Garmin Activo</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">El atleta tiene sincronización automática de actividades activada.</p>
              </div>
            </div>
          </div>
        )}

        {/* Section Biometrics and Readiness */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-full">
            <BiometricsCard initialBiometrics={biometrics} initialBiometricsHistory={biometricsHistory} readOnly={true} />
          </div>
          <div className="h-full">
            <FormStatusWidget 
              tsb={analyticsData.currentTsb} 
              athleteLevel={athleteProfile.level}
              progressPercent={progressPercent}
            />
          </div>
        </section>

        {/* Section Nutrition & Zones */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-full">
            <AthleteNutritionCard 
              athleteId={athleteId}
              allergies={athleteProfile.allergies}
              preferredIngredients={athleteProfile.preferred_ingredients}
              dislikedIngredients={athleteProfile.disliked_ingredients}
              dailyNutrition={dailyNutritionData}
            />
          </div>
          <div className="h-full">
            <CoachAthleteZonesEditor 
              athleteId={athleteId}
              initialFtp={athleteProfile.current_ftp || null}
              initialSwimPace={athleteProfile.current_swim_pace || null}
              initialRunPace={athleteProfile.current_run_pace || null}
            />
          </div>
        </section>

        {/* Advanced Builder */}
        <section className="space-y-4 pt-4 border-t border-zinc-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-600" /> 
              Constructor Semanal Inteligente
            </h2>
            <span className="text-xs text-zinc-500 font-semibold bg-white px-2.5 py-1 rounded-md border border-zinc-200 shadow-sm">
              Arrastra y suelta para reprogramar
            </span>
          </div>
          <AdvancedCalendarWrapper 
            athleteId={athleteId} 
            initialWorkouts={workouts || []} 
            initialLibraryTemplates={libraryRes?.data || []}
          />
        </section>

        {/* Tabs of Calendar / List View */}
        <DashboardViewTabs 
          initialWorkouts={workouts || []} 
          isConnected={isConnected} 
          profile={athleteProfile} 
          readOnly={true}
          initialBiometrics={biometrics}
          initialBiometricsHistory={biometricsHistory}
        />

      </main>
    </div>
  );
}
