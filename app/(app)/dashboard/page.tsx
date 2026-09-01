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
import { Activity, BookOpen, ChevronRight, Megaphone, Award } from 'lucide-react';
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
import { StartLine, type StartLane } from '@/components/dashboard/start-line';

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

  // Load the profile once: it is needed both for routing decisions and the dashboard.
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*, training_plans(*)')
    .eq('id', user.id)
    .single();

  if (!profileData) {
    redirect('/onboarding');
  }

  if (profileData.role === 'coach') {
    redirect('/coach/dashboard');
  }

  if (!profileData.active_plan_id && !profileData.coach_id) {
    redirect('/onboarding');
  }

  const profile = profileData as any;

  // 2. Fetch all other data in parallel
  const [
    biometricsRes,
    nutritionRes,
    analyticsData,
    devicesRes,
    workoutsRes
  ] = await Promise.all([
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

  let groupAnnouncement = null;
  if (profile.coach_id) {
    const { data: athleteGroup } = await supabase
      .from('coach_athletes')
      .select('coach_groups(announcement)')
      .eq('athlete_id', user.id)
      .eq('coach_id', profile.coach_id)
      .single();
    
    if (athleteGroup && athleteGroup.coach_groups) {
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

  // Per-discipline stats for the Start Line. Brick sessions count on the bike lane.
  const emptyLane = { minutes: 0, completedMinutes: 0, sessions: 0, completedSessions: 0 };
  const startLaneInit: Record<StartLane['sport'], typeof emptyLane> = {
    natacion: { ...emptyLane },
    ciclismo: { ...emptyLane },
    carrera: { ...emptyLane },
  };
  for (const w of weeklyWorkouts) {
    const st = w.training_sessions?.sport_type;
    const lane = st === 'brick' ? 'ciclismo' : st;
    if (!(lane in startLaneInit)) continue;
    const dur = w.training_sessions?.duration_min || 0;
    const acc = startLaneInit[lane as StartLane['sport']];
    acc.minutes += dur;
    acc.sessions += 1;
    if (w.status === 'completed') {
      acc.completedMinutes += dur;
      acc.completedSessions += 1;
    }
  }
  const startLanes: StartLane[] = (['natacion', 'ciclismo', 'carrera'] as const).map((sport) => ({
    sport,
    ...startLaneInit[sport],
  }));
  const weekLabel = `Semana del ${monday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;

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

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pb-8 lg:px-8">

        <div className="mb-6">
          <p className="text-xs font-semibold capitalize text-accent">
            {now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold leading-tight tracking-tight text-text-primary">
            {now.getHours() < 12 ? 'Buenos días' : now.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches'}, {profile.first_name || 'triatleta'}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">Tu estado y la prioridad de hoy, en un solo vistazo.</p>
        </div>

        <div className="mb-8 grid items-start gap-4 lg:grid-cols-[.9fr_1.1fr]">
          <section>
            <h2 className="mb-3 px-0.5 text-xs font-semibold text-text-muted">Tu recuperación</h2>
            <RecoverySummary readinessScore={biometrics?.readiness_score} hrv={biometrics?.hrv} sleepHours={biometrics?.sleep_hours} fatigue={biometrics?.fatigue_rating} />
          </section>
          <section>
            <h2 className="mb-3 px-0.5 text-xs font-semibold text-text-muted">Entrenamiento de hoy</h2>
            <TodayWorkoutHero workout={todayWorkout ?? null} />
          </section>
        </div>

        {/* LA SEMANA — volumen por disciplina + calendario de planificación */}
        <section className="mb-8">
          <div className="flex items-center justify-between gap-3 px-0.5 mb-3">
            <h2 className="text-xs font-semibold text-text-muted">Tu semana</h2>
            <Link
              href="/resumen"
              className="group flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors"
            >
              <Award className="w-3.5 h-3.5 text-accent" />
              <span>Resumen semanal</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="space-y-3">
            <StartLine lanes={startLanes} weekLabel={weekLabel} />
            <DashboardViewTabs
              initialWorkouts={workouts || []}
              isConnected={isConnected}
              profile={profile}
              initialBiometrics={biometrics}
              initialBiometricsHistory={biometricsHistory}
              initialNutrition={nutritionData}
              initialAnalytics={analyticsData}
            />
          </div>
        </section>

        {/* Secciones secundarias detrás del menú desplegable */}
        <ExpandableSection title="Nutrición, actividad, logros y ajustes">

          {/* ── Tu entrenador ── */}
          <div className="space-y-3">
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.25em] text-text-muted px-0.5">Tu entrenador</p>

            {/* Pizarra del Entrenador */}
            {groupAnnouncement && (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400" />
                <div className="flex items-start gap-3 pl-2">
                  <Megaphone className="w-5 h-5 text-amber-300 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1">Nota de tu Entrenador</h3>
                    <p className="text-sm text-amber-100/90 whitespace-pre-wrap leading-relaxed">{groupAnnouncement}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Objective Configuration Card (If pending or to edit) */}
            <ObjectiveConfigCard targetRaceName={profile.target_race_name} />

            {/* Banner de Bienvenida a Principiantes */}
            {profile.level === 'principiante' && (
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0 mt-0.5">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                      ¡Bienvenido a tu viaje de triatlón, {profile.first_name || 'Triatleta'}!
                    </h3>
                    <p className="text-xs text-text-secondary leading-relaxed max-w-2xl">
                      Estás siguiendo un plan estructurado para principiantes. Recuerda que no necesitas relojes caros, potenciómetros ni bicicletas de miles de euros para empezar. Tu constancia y disfrutar del camino es lo único que importa.
                    </p>
                    <div className="pt-1.5 flex gap-3">
                      <Link href="/principiantes">
                        <AnimatedButton size="sm" className="!bg-emerald-500 hover:!bg-emerald-400 !text-black text-[11px] font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1">
                          <span>Explorar Zona Principiantes</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </AnimatedButton>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Conexión y análisis ── */}
          <div className="space-y-3">
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.25em] text-text-muted px-0.5">Conexión y análisis</p>

            {/* Barra de Telemetría Activa (Sólo si está conectado) */}
            {isConnected && (
              <div className="p-4 rounded-2xl bg-swim/10 border border-swim/20 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-swim/15 flex items-center justify-center text-swim shrink-0">
                    <Activity className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-text-primary">Telemetría Activa (Auto 24/7)</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">Sincronización Pasiva</span>
                    </div>
                    <p className="text-[10px] text-text-muted mt-0.5">Tus actividades se marcan como hechas y se sincronizan al instante en cuanto se detectan en Strava.</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30 text-[10px] text-emerald-300 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Conexión Activa
                </div>
              </div>
            )}

            {/* Coach IA */}
            <WorkoutAIFeedback
              todayWorkout={todayWorkout ?? null}
              hrv={biometrics?.hrv}
              readiness={biometrics?.readiness_score}
              fatigue={biometrics?.fatigue_rating}
            />
          </div>

          {/* ── Logros y progreso ── */}
          <div className="space-y-3">
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.25em] text-text-muted px-0.5">Logros y progreso</p>
            <BadgesGrid badges={badgeChecks} />
            <ProfileCompletion profile={profile} />
          </div>

          {/* ── Actividad reciente ── */}
          {isConnected && (
            <div className="space-y-3">
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.25em] text-text-muted px-0.5">Actividad reciente</p>
              <ActivitiesFeed />
            </div>
          )}

        </ExpandableSection>

        <PushNotificationManager />
      </main>
    </div>
  );
}
