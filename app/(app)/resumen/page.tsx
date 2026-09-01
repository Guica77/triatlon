import * as React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import {
  Award,
  Flame,
  Waves,
  Bike,
  Footprints,
  CalendarDays,
  Clock,
  Activity,
  Gauge,
  Trophy,
  Dumbbell,
  ChevronLeft,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/* ─────────────────────────────────────────────
   Tipos y helpers
────────────────────────────────────────────── */

type ResumenWorkout = {
  id: string;
  scheduled_date: string;
  completed_at: string | null;
  actual_tss: number | null;
  status: string | null;
  training_sessions?: {
    sport_type: string;
    duration_min: number | null;
    description: string | null;
  } | null;
  universal_telemetry?: Array<{
    actual_distance_km: number;
    actual_duration_min: number;
    actual_tss: number;
  }> | null;
};

const SPORT_CONFIG: Record<
  string,
  { icon: LucideIcon; color: string; bg: string; border: string; label: string }
> = {
  natacion: { icon: Waves, color: 'text-swim', bg: 'bg-swim/15', border: 'border-swim/25', label: 'Natación' },
  ciclismo: { icon: Bike, color: 'text-bike', bg: 'bg-bike/15', border: 'border-bike/25', label: 'Ciclismo' },
  carrera: { icon: Footprints, color: 'text-run', bg: 'bg-run/15', border: 'border-run/25', label: 'Carrera' },
};

function estimateTss(durationMin: number | null | undefined): number {
  if (!durationMin || durationMin <= 0) return 0;
  // Estimación conservadora: intensidad base Z2 (IF 0.75)
  return Math.round((durationMin / 60) * Math.pow(0.75, 2) * 100);
}

function workoutTss(w: ResumenWorkout): number {
  if (w.actual_tss && w.actual_tss > 0) return w.actual_tss;
  const telemetryTss = w.universal_telemetry?.[0]?.actual_tss;
  if (telemetryTss && telemetryTss > 0) return telemetryTss;
  return estimateTss(w.training_sessions?.duration_min);
}

function workoutMinutes(w: ResumenWorkout): number {
  const telemetry = w.universal_telemetry?.[0];
  if (telemetry && telemetry.actual_duration_min > 0) return telemetry.actual_duration_min;
  return w.training_sessions?.duration_min || 0;
}

function distanceKmForSport(sport: string, w: ResumenWorkout): number {
  const telemetry = w.universal_telemetry?.[0];
  if (telemetry && telemetry.actual_distance_km > 0) return telemetry.actual_distance_km;
  const durationMin = w.training_sessions?.duration_min || 0;
  if (sport === 'natacion') return (durationMin * 40) / 1000;
  if (sport === 'ciclismo') return durationMin * 0.4;
  if (sport === 'carrera') return durationMin * 0.2;
  return 0;
}

function formatKm(km: number): string {
  if (km >= 100) return String(Math.round(km));
  return km.toFixed(1);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatLongDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return capitalize(d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }));
}

function motivation(progress: number, firstName: string): { title: string; body: string } {
  if (progress >= 100) {
    return { title: '¡Semana perfecta!', body: `Impecable, ${firstName}. Lo completaste todo y eso se nota.` };
  }
  if (progress >= 70) {
    return { title: '¡Gran constancia!', body: `Vas muy bien, ${firstName}. Con esta regularidad, los resultados llegan solos.` };
  }
  if (progress >= 40) {
    return { title: 'Buen ritmo', body: `Sigue así, ${firstName}. Cada sesión cuenta para tu progreso.` };
  }
  return { title: 'Vamos a por ello', body: `Tu semana va tomando forma, ${firstName}. ¡Tú puedes!` };
}

/* ─────────────────────────────────────────────
   Pequeños componentes visuales
────────────────────────────────────────────── */

function StatTile({
  icon: Icon,
  value,
  label,
  sub,
  accent,
}: {
  icon: LucideIcon;
  value: React.ReactNode;
  label: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-border-default bg-surface-card shadow-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={cn('w-4 h-4', accent)} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{label}</span>
      </div>
      <p className="text-3xl font-black text-text-primary tracking-tight leading-none">{value}</p>
      <p className="text-[11px] text-text-muted font-medium mt-1.5">{sub}</p>
    </div>
  );
}

function DisciplineBar({
  icon: Icon,
  iconClass,
  fillClass,
  label,
  tss,
  percentage,
  distanceLabel,
}: {
  icon: LucideIcon;
  iconClass: string;
  fillClass: string;
  label: string;
  tss: number;
  percentage: number;
  distanceLabel: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className={cn('w-4 h-4 shrink-0', iconClass)} />
          <span className="text-sm font-semibold text-text-primary">{label}</span>
        </div>
        <div className="flex items-baseline gap-2 shrink-0">
          <span className="text-sm font-bold text-text-primary tabular-nums">{tss} TSS</span>
          <span className="text-[10px] font-bold text-text-muted tabular-nums w-9 text-right">{percentage}%</span>
        </div>
      </div>
      <div className="h-2.5 rounded-full bg-surface-hover border border-border-subtle overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', fillClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-[11px] text-text-muted mt-1.5">{distanceLabel}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Página
────────────────────────────────────────────── */

export default async function ResumenPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Guard rails de rol y onboarding, igual que el dashboard
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, active_plan_id, coach_id, first_name')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/onboarding');
  if (profile.role === 'coach') redirect('/coach/dashboard');
  if (!profile.active_plan_id && !profile.coach_id) redirect('/onboarding');

  const now = new Date();

  // Lunes de la semana actual -> domingo
  const currentDay = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(monday.getDate() - currentDay + 1);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const monStr = monday.toISOString().split('T')[0];
  const sunStr = sunday.toISOString().split('T')[0];

  // Historial suficiente para la racha de semanas consecutivas
  const historyStart = new Date(now);
  historyStart.setDate(historyStart.getDate() - 400);
  historyStart.setHours(0, 0, 0, 0);

  const { data: workouts }: { data: ResumenWorkout[] | null } = await supabase
    .from('user_workouts')
    .select(`
      id,
      scheduled_date,
      completed_at,
      actual_tss,
      status,
      training_sessions(sport_type, duration_min, description),
      universal_telemetry(actual_distance_km, actual_duration_min, actual_tss)
    `)
    .eq('user_id', user.id)
    .gte('scheduled_date', historyStart.toISOString().split('T')[0])
    .lte('scheduled_date', sunStr)
    .order('scheduled_date', { ascending: true });

  const allWorkouts = workouts || [];

  /* ── Estadísticas de la semana ── */
  const weeklyWorkouts = allWorkouts.filter(
    (w) => w.scheduled_date >= monStr && w.scheduled_date <= sunStr
  );

  const totalCount = weeklyWorkouts.filter(
    (w) => w.training_sessions?.sport_type !== 'descanso'
  ).length;

  const completedWorkouts = weeklyWorkouts.filter((w) => w.status === 'completed');
  const completedCount = completedWorkouts.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const totalTss = completedWorkouts.reduce((sum, w) => sum + workoutTss(w), 0);
  const totalMinutes = completedWorkouts.reduce((sum, w) => sum + workoutMinutes(w), 0);

  const disciplineStats = {
    natacion: { tss: 0, distanceKm: 0, sessions: 0 },
    ciclismo: { tss: 0, distanceKm: 0, sessions: 0 },
    carrera: { tss: 0, distanceKm: 0, sessions: 0 },
  };

  completedWorkouts.forEach((w) => {
    const sport = (w.training_sessions?.sport_type || '').toLowerCase();
    if (sport === 'natacion' || sport === 'ciclismo' || sport === 'carrera') {
      disciplineStats[sport].tss += workoutTss(w);
      disciplineStats[sport].distanceKm += distanceKmForSport(sport, w);
      disciplineStats[sport].sessions += 1;
    }
  });

  const totalDistanceKm =
    disciplineStats.natacion.distanceKm +
    disciplineStats.ciclismo.distanceKm +
    disciplineStats.carrera.distanceKm;

  const threeSportTss =
    disciplineStats.natacion.tss +
    disciplineStats.ciclismo.tss +
    disciplineStats.carrera.tss || 1;

  const disciplinePct = {
    natacion: Math.round((disciplineStats.natacion.tss / threeSportTss) * 100),
    ciclismo: Math.round((disciplineStats.ciclismo.tss / threeSportTss) * 100),
    carrera: Math.round((disciplineStats.carrera.tss / threeSportTss) * 100),
  };

  /* ── Mejor sesión de la semana ── */
  let bestSession: ResumenWorkout | null = null;
  let bestSessionTss = 0;
  for (const w of completedWorkouts) {
    const tss = workoutTss(w);
    if (tss > bestSessionTss) {
      bestSessionTss = tss;
      bestSession = w;
    }
  }

  /* ── Racha de semanas consecutivas (>=70% completado) ──
     Replica la lógica del dashboard. */
  let consecutiveWeeks = 0;
  for (let weekOffset = 0; weekOffset < 52; weekOffset++) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - (weekOffset * 7 + 6));
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - weekOffset * 7);

    const weekStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    const weekWorkouts = allWorkouts.filter(
      (w) =>
        w.scheduled_date >= weekStr &&
        w.scheduled_date <= weekEndStr &&
        w.training_sessions?.sport_type !== 'descanso'
    );
    if (weekWorkouts.length === 0) break;

    const done = weekWorkouts.filter((w) => w.status === 'completed').length;
    if (done >= weekWorkouts.length * 0.7) consecutiveWeeks++;
    else break;
  }

  const firstName = profile.first_name || 'Triatleta';
  const weekStartLabel = capitalize(monday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }));
  const weekEndLabel = capitalize(sunday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }));
  const weekLabel = `${weekStartLabel} – ${weekEndLabel}`;

  const ringRadius = 56;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - progressPercent / 100);

  const isEmpty = completedCount === 0;
  const mot = motivation(progressPercent, firstName);

  const bestSport = bestSession ? (bestSession.training_sessions?.sport_type || '').toLowerCase() : '';
  const bestCfg = SPORT_CONFIG[bestSport] || {
    icon: Activity,
    color: 'text-coral-500',
    bg: 'bg-coral-500/15',
    border: 'border-coral-500/25',
    label: 'Entrenamiento',
  };
  const BestSessionIcon = bestCfg.icon;

  return (
    <div className="min-h-screen bg-surface-app w-full overflow-x-hidden">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:pb-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-coral-500/10 border border-coral-500/20 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-coral-500" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-text-primary tracking-tight truncate">Resumen de tu semana</h1>
              <p className="text-xs text-text-muted font-medium truncate">Semana del {weekLabel}</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="hidden sm:flex items-center gap-1 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Plan semanal
          </Link>
        </div>

        {isEmpty ? (
          /* ── Estado vacío ── */
          <div className="rounded-2xl border border-border-default bg-surface-card shadow-card p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface-hover border border-border-subtle flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-6 h-6 text-text-muted" />
            </div>
            <h2 className="text-lg font-bold text-text-primary tracking-tight">
              Aún no has completado entrenamientos esta semana
            </h2>
            <p className="text-sm text-text-secondary mt-1.5 max-w-sm mx-auto leading-relaxed">
              {totalCount > 0
                ? `Tienes ${totalCount} sesiones programadas. Tu resumen aparecerá aquí a medida que las completes.`
                : 'Cuando completes tus sesiones, aquí verás todo lo que has logrado. ¡Cada entreno cuenta!'}
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 mt-6 px-5 h-10 rounded-xl bg-coral-500 text-white text-sm font-semibold hover:bg-coral-400 transition-colors shadow-card"
            >
              <Dumbbell className="w-4 h-4" />
              Ir a mi entrenamiento
            </Link>
          </div>
        ) : (
          <>
            {/* ── Anillo de progreso de la semana ── */}
            <section className="relative overflow-hidden rounded-2xl border border-border-default bg-surface-card shadow-card p-6 sm:p-8">
              <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-coral-500/10 blur-3xl" />
              <div className="absolute -left-20 -bottom-20 w-40 h-40 rounded-full bg-swim/10 blur-3xl" />

              <div className="relative flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
                {/* Anillo SVG */}
                <div className="relative w-40 h-40 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                    <circle
                      cx="70"
                      cy="70"
                      r={ringRadius}
                      fill="none"
                      stroke="var(--color-border-default)"
                      strokeWidth="12"
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r={ringRadius}
                      fill="none"
                      stroke="var(--color-coral-500)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-text-primary tracking-tight tabular-nums">
                      {progressPercent}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted mt-0.5">
                      % completo
                    </span>
                  </div>
                </div>

                {/* Texto motivacional + resumen */}
                <div className="flex-1 text-center sm:text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-coral-500">
                    Tu semana en cifras
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight mt-1.5">
                    {mot.title}
                  </h2>
                  <p className="text-sm text-text-secondary mt-1 max-w-md leading-relaxed">{mot.body}</p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-4">
                    <span className="text-2xl font-black text-bike tabular-nums leading-none">{completedCount}</span>
                    <span className="text-sm text-text-muted">
                      de {totalCount} entrenamientos completados
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Métricas grandes ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatTile
                icon={Activity}
                value={totalTss}
                label="TSS total"
                sub="carga de la semana"
                accent="text-coral-500"
              />
              <StatTile
                icon={Clock}
                value={totalMinutes}
                label="Tiempo total"
                sub="minutos entrenados"
                accent="text-swim"
              />
              <StatTile
                icon={Gauge}
                value={formatKm(totalDistanceKm)}
                label="Distancia"
                sub="kilómetros totales"
                accent="text-bike"
              />
              <StatTile
                icon={Flame}
                value={consecutiveWeeks}
                label="Racha"
                sub={consecutiveWeeks === 1 ? 'semana cumpliendo el plan' : 'semanas cumpliendo el plan'}
                accent="text-run"
              />
            </div>

            {/* ── Desglose por disciplina ── */}
            <section className="rounded-2xl border border-border-default bg-surface-card shadow-card p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Desglose por disciplina</h3>
                  <p className="text-[11px] text-text-muted mt-0.5">Esfuerzo (TSS) de los tres deportes</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted shrink-0">
                  Esta semana
                </span>
              </div>
              <div className="space-y-5">
                <DisciplineBar
                  icon={Waves}
                  iconClass="text-swim"
                  fillClass="bg-swim"
                  label="Natación"
                  tss={disciplineStats.natacion.tss}
                  percentage={disciplinePct.natacion}
                  distanceLabel={`${Math.round(disciplineStats.natacion.distanceKm * 1000)} m · ${disciplineStats.natacion.sessions} ${disciplineStats.natacion.sessions === 1 ? 'sesión' : 'sesiones'}`}
                />
                <DisciplineBar
                  icon={Bike}
                  iconClass="text-bike"
                  fillClass="bg-bike"
                  label="Ciclismo"
                  tss={disciplineStats.ciclismo.tss}
                  percentage={disciplinePct.ciclismo}
                  distanceLabel={`${formatKm(disciplineStats.ciclismo.distanceKm)} km · ${disciplineStats.ciclismo.sessions} ${disciplineStats.ciclismo.sessions === 1 ? 'sesión' : 'sesiones'}`}
                />
                <DisciplineBar
                  icon={Footprints}
                  iconClass="text-run"
                  fillClass="bg-run"
                  label="Carrera"
                  tss={disciplineStats.carrera.tss}
                  percentage={disciplinePct.carrera}
                  distanceLabel={`${formatKm(disciplineStats.carrera.distanceKm)} km · ${disciplineStats.carrera.sessions} ${disciplineStats.carrera.sessions === 1 ? 'sesión' : 'sesiones'}`}
                />
              </div>
            </section>

            {/* ── Mejor sesión de la semana ── */}
            {bestSession && bestSessionTss > 0 && (
              <section className="relative overflow-hidden rounded-2xl border border-border-default bg-surface-card shadow-card p-5 sm:p-6">
                <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-coral-500/10 blur-3xl" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-coral-500 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" />
                      Mejor sesión de la semana
                    </span>
                    <div className="flex items-center gap-3 mt-3">
                      <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border', bestCfg.bg, bestCfg.border)}>
                        <BestSessionIcon className={cn('w-5 h-5', bestCfg.color)} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-extrabold text-text-primary tracking-tight truncate">
                          {bestCfg.label}
                        </p>
                        <p className="text-[11px] text-text-muted">{formatLongDate(bestSession.scheduled_date)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-4xl font-black text-text-primary tracking-tight tabular-nums leading-none">
                      {bestSessionTss}
                    </p>
                    <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mt-1">TSS</p>
                  </div>
                </div>
                {bestSession.training_sessions?.description && (
                  <p className="relative mt-4 text-xs text-text-secondary leading-relaxed line-clamp-2">
                    {bestSession.training_sessions.description}
                  </p>
                )}
              </section>
            )}
          </>
        )}

        {/* Enlace inferior para móvil (el header lo oculta en sm) */}
        <div className="sm:hidden">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Volver a mi plan semanal
          </Link>
        </div>
      </main>
    </div>
  );
}
