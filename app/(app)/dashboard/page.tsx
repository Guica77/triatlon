import * as React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DailyWorkoutCard } from '@/components/dashboard/daily-workout-card';
import { WeeklyNav } from '@/components/dashboard/weekly-nav';
import { BiometricsCard } from '@/components/dashboard/biometrics-card';
import { DailyFuelCard } from '@/components/dashboard/daily-fuel-card';
import { getDailyBiometrics } from '@/app/(app)/dashboard/biometrics-actions';
import { getDailyNutrition } from '@/app/(app)/dashboard/nutrition-actions';
import { getAnalyticsDashboardData } from '@/app/(app)/analytics/analytics-actions';
import { FormStatusWidget } from '@/components/dashboard/form-status-widget';
import { Flame, Calendar, Trophy, Activity, BookOpen, ChevronRight, Megaphone, Sparkles, Dumbbell, Award } from 'lucide-react';
import { AppFeedbackModal } from '@/components/dashboard/app-feedback-modal';
import { DashboardViewTabs } from '@/components/dashboard/dashboard-view-tabs';
import { MorningCheckInModal } from '@/components/dashboard/morning-checkin-modal';
import { ObjectiveConfigCard } from '@/components/dashboard/objective-config-card';
import { PushNotificationManager } from '@/components/chat/push-notification-manager';
import { AnimatedButton } from '@/components/ui/animated-button';
import { ActivitiesFeed } from '@/components/dashboard/activities-feed';
import { WorkoutAIFeedback } from '@/components/dashboard/workout-ai-feedback';
import { BadgesGrid } from '@/components/dashboard/badges-grid';
import { ProfileCompletion } from '@/components/dashboard/profile-completion';
import { evaluateBadges, getEarnedCount } from '@/lib/badges';
import { TodayWorkoutHero } from '@/components/dashboard/today-workout-hero';
import { RecoverySummary } from '@/components/dashboard/recovery-summary';
import { ExpandableSection } from '@/components/dashboard/expandable-section';

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startDayIdx = startOfMonth.getDay() || 7;
  const calendarStart = new Date(startOfMonth);
  calendarStart.setDate(calendarStart.getDate() - startDayIdx + 1);
  calendarStart.setHours(0, 0, 0, 0);

  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const endDayIdx = endOfMonth.getDay() || 7;
  const calendarEnd = new Date(endOfMonth);
  calendarEnd.setDate(calendarEnd.getDate() + (7 - endDayIdx));
  calendarEnd.setHours(23, 59, 59, 999);

  const todayStr = now.toISOString().split('T')[0];

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    console.error("DashboardPage: No user found! Redirecting to /login", authError);
    redirect('/login');
  }

  // 1. Check profile early to avoid fetching all data if user needs onboarding
  const { data: earlyProfile } = await supabase
    .from('profiles')
    .select('role, active_plan_id, coach_id')
    .eq('id', user.id)
    .single();

  if (!earlyProfile) {
    redirect('/onboarding');
  }

  if (earlyProfile.role === 'coach') {
    redirect('/coach/dashboard');
  }

  if (!earlyProfile.active_plan_id && !earlyProfile.coach_id) {
    redirect('/onboarding');
  }

  // 2. Fetch all other data in parallel
  const [
    profileRes,
    biometricsRes,
    nutritionRes,
    analyticsData,
    devicesRes,
    workoutsRes
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('*, training_plans(*)')
      .eq('id', user.id)
      .single(),
    getDailyBiometrics(),
    getDailyNutrition(todayStr),
    getAnalyticsDashboardData(),
    supabase
      .from('user_connected_devices')
      .select('provider')
      .eq('user_id', user.id),
    supabase
      .from('user_workouts')
      .select('*, training_sessions(*), universal_telemetry(*), workout_feedback(*)')
      .eq('user_id', user.id)
      .gte('scheduled_date', calendarStart.toISOString().split('T')[0])
      .lte('scheduled_date', calendarEnd.toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true })
  ]);

  const profileData = profileRes.data;
  const profile = profileData as any;
  const activePlan = profile.training_plans;

  let coachProfile = null;
  let groupAnnouncement = null;
  let athleteGroupId = null;
  if (profile.coach_id) {
    const { data } = await supabase.from('profiles').select('first_name, last_name').eq('id', profile.coach_id).single();
    coachProfile = data;

    const { data: athleteGroup } = await supabase
      .from('coach_athletes')
      .select('group_id, coach_groups(announcement)')
      .eq('athlete_id', user.id)
      .eq('coach_id', profile.coach_id)
      .single();
    
    if (athleteGroup && athleteGroup.coach_groups) {
      athleteGroupId = athleteGroup.group_id;
      groupAnnouncement = (athleteGroup.coach_groups as any).announcement;
    }
  }

  const biometrics = biometricsRes.data || null;
  const biometricsHistory = biometricsRes.history || [];

  const nutritionData = nutritionRes.data || null;

  const devices = devicesRes.data;
  const isConnected = Boolean(profile.garmin_connected || profile.strava_connected || (devices && devices.length > 0));

  const workouts = workoutsRes.data;

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

  // 4. Calcular días desde primer login para disparar feedback modal (NPS)
  const loginDate = new Date(profile.first_login_at || profile.created_at || new Date());
  const diffTime = Math.abs(now.getTime() - loginDate.getTime());
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

  const hasCompletedCheckIn = biometrics?.fatigue_rating !== null && biometrics?.fatigue_rating !== undefined;

  // Find today's workout for AI coach feedback
  const todayWorkout = workouts?.find((w: any) => w.scheduled_date === todayStr && w.training_sessions?.sport_type !== 'descanso');

  // Evaluate badges
  const allWorkoutsCompleted = workouts?.filter((w: any) => w.status === 'completed').length || 0
  const totalTss = workouts?.reduce((sum: number, w: any) => sum + (w.actual_tss || 0), 0) || 0

  // Count consecutive compliant weeks
  const now2 = new Date()
  let consecutiveWeeks = 0
  for (let weekOffset = 0; weekOffset < 52; weekOffset++) {
    const weekStart = new Date(now2)
    weekStart.setDate(weekStart.getDate() - (weekOffset * 7 + 6))
    const weekEnd = new Date(now2)
    weekEnd.setDate(weekEnd.getDate() - weekOffset * 7)
    const weekStr = weekStart.toISOString().split('T')[0]
    const weekEndStr = weekEnd.toISOString().split('T')[0]
    const weekWorkouts = workouts?.filter((w: any) => w.scheduled_date >= weekStr && w.scheduled_date <= weekEndStr && w.training_sessions?.sport_type !== 'descanso') || []
    if (weekWorkouts.length === 0) break
    const completed = weekWorkouts.filter((w: any) => w.status === 'completed').length
    if (completed >= weekWorkouts.length * 0.7) consecutiveWeeks++
    else break
  }

  // Check for all three sports in any week
  const recentSports = new Set(workouts?.filter((w: any) => w.scheduled_date >= monStr && w.scheduled_date <= sunStr && w.status === 'completed').map((w: any) => w.training_sessions?.sport_type))
  const hasAllThree = recentSports.has('natacion') && recentSports.has('ciclismo') && recentSports.has('carrera')

  // Count brick sessions
  const brickCount = workouts?.filter((w: any) => w.training_sessions?.sport_type === 'brick' && w.status === 'completed').length || 0

  // Check recent HRV days (last 7 days)
  const recentHrvDays = biometricsHistory?.filter((b: any) => b.hrv && b.hrv > 70).slice(0, 7).length || 0

  const badgeChecks = evaluateBadges({
    totalWorkoutsCompleted: allWorkoutsCompleted,
    totalTss,
    consecutiveWeeksCompliant: consecutiveWeeks,
    currentCtl: analyticsData?.currentCtl || 0,
    currentHrv: biometrics?.hrv || 0,
    hasCoach: !!profile.coach_id,
    onboardingDone: !!profile.active_plan_id,
    hasAllThreeSports: hasAllThree,
    brickSessionsCount: brickCount,
    recentHrvDays,
  })

  return (
    <div className="min-h-screen bg-bg-app w-full overflow-x-hidden">
      {activeFeedbackDays !== null && (
        <AppFeedbackModal daysUsed={activeFeedbackDays} />
      )}
      <MorningCheckInModal hasCompletedCheckIn={hasCompletedCheckIn} hasGarminSync={isConnected} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:pb-8 space-y-6">

        {/* Header: Entrenamiento */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-coral-500/10 border border-coral-500/20 flex items-center justify-center shrink-0">
            <Dumbbell className="w-4 h-4 text-coral-500" />
          </div>
          <div>
            <h1 className="text-base font-bold text-text-primary tracking-tight">Tu Entrenamiento</h1>
            <p className="text-xs text-text-muted font-medium">Plan semanal, sesiones y seguimiento</p>
          </div>
        </div>

        {/* Resumen semanal: banner compacto hacia /resumen */}
        <Link
          href="/resumen"
          className="group flex items-center justify-between gap-3 rounded-2xl border border-coral-500/20 bg-coral-500/5 hover:bg-coral-500/10 px-4 py-3 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-coral-500/10 border border-coral-500/20 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4 text-coral-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-text-primary">Resumen de la semana</p>
              <p className="text-[11px] text-text-muted truncate">Todo lo que has logrado, en un vistazo</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-coral-500 text-xs font-bold shrink-0">
            <span>Ver mi resumen semanal</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* HERO: Sesión de hoy */}
        <TodayWorkoutHero workout={todayWorkout ?? null} />

        {/* MAIN: Vista de entrenamiento (semana/mes) */}
        <DashboardViewTabs
          initialWorkouts={workouts || []}
          isConnected={isConnected}
          profile={profile}
          initialBiometrics={biometrics}
          initialBiometricsHistory={biometricsHistory}
          initialNutrition={nutritionData}
          initialAnalytics={analyticsData}
        />

        {/* Resumen de recuperación */}
        <RecoverySummary
          readinessScore={biometrics?.readiness_score}
          hrv={biometrics?.hrv}
          sleepHours={biometrics?.sleep_hours}
          fatigue={biometrics?.fatigue_rating}
        />

        {/* Secciones secundarias detrás del menú desplegable */}
        <ExpandableSection title="Más secciones" icon={Sparkles}>

        {/* Pizarra del Entrenador */}
        {groupAnnouncement && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400" />
            <div className="flex items-start gap-3 pl-2">
              <Megaphone className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1">Nota de tu Entrenador</h3>
                <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">{groupAnnouncement}</p>
              </div>
            </div>
          </div>
        )}

        {/* Objective Configuration Card (If pending or to edit) */}
        <ObjectiveConfigCard targetRaceName={profile.target_race_name} />
        
        {/* Banner de Bienvenida a Principiantes */}
        {profile.level === 'principiante' && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/25 relative overflow-hidden group ">
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
          <div className="p-4 rounded-2xl bg-swim/10 border border-swim/20 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-swim/15 flex items-center justify-center text-swim shrink-0">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-zinc-850">Telemetría Activa (Auto 24/7)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-bold border border-emerald-150">Sincronización Pasiva</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-0.5">Tus actividades se marcan como hechas y se sincronizan al instante en cuanto se detectan en Strava.</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-150 text-[10px] text-emerald-700 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Conexión Activa
            </div>
          </div>
        )}

        {/* Coach IA */}
	<section className="space-y-4">
	  <WorkoutAIFeedback
	    todayWorkout={todayWorkout ?? null}
	    hrv={biometrics?.hrv}
	    readiness={biometrics?.readiness_score}
	    fatigue={biometrics?.fatigue_rating}
	  />
	</section>

	{/* Badges / Logros */}
	<BadgesGrid badges={badgeChecks} />

	{/* Profile Completion */}
	<ProfileCompletion profile={profile} />

        {/* Historial de Actividades Recientes de Strava (Sólo si está conectado) */}
        {isConnected && (
          <section className="space-y-4 pt-6 border-t border-zinc-900/50">
            <ActivitiesFeed />
          </section>
        )}

        </ExpandableSection>

        <PushNotificationManager />
      </main>
    </div>
  );
}
