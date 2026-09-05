import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Json } from '@/types/database.types';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPushNotification } from '@/lib/notifications';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

import {
  classifySession,
  estimateTss,
  extractTargetKm,
  normalizeDiscipline,
  resolvePlannedDiscipline,
  sportLabel,
  todayISO,
  type ActualActivity,
} from '@/lib/strava/classify';
import {
  generateActivityCongrats,
  generateRefocusProposal,
  type ActivityAiOutput,
  type RefocusAiOutput,
} from '@/lib/strava/activity-ai';
import type { ActivityMessageContext } from '@/lib/strava/refocus';

/**
 * Strava Webhooks verification handler (GET)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN || 'triatlon_verify_token';
  if (mode === 'subscribe' && token === verifyToken && challenge) {
    console.log('WEBHOOK_VERIFIED');
    return NextResponse.json({ 'hub.challenge': challenge }, { status: 200 });
  }

  return NextResponse.json({ error: 'Fallo de verificación' }, { status: 403 });
}

interface PlannedWorkoutRow {
  id: string;
  training_sessions?: { sport_type: string; duration_min?: number | null; description?: string | null } | null;
}

/** Elige qué sesión pendiente de hoy corresponde a la actividad (o null). */
function pickWorkout(workouts: PlannedWorkoutRow[] | null, discipline: string): PlannedWorkoutRow | null {
  if (!workouts || workouts.length === 0) return null;

  const matches = workouts.filter((w) => {
    const t = w.training_sessions?.sport_type;
    const plannedDiscipline = resolvePlannedDiscipline(t || '');
    if (plannedDiscipline === null) return false;
    if (plannedDiscipline === 'brick') return discipline === 'ciclismo' || discipline === 'carrera';
    return plannedDiscipline === discipline;
  });

  if (matches.length > 0) return matches[0];

  // Sin coincidencia por disciplina: solo marcamos "perdida" cuando hay UNA
  // sesión pendiente (así no acusamos de mala a una de varias). Con varias,
  // la actividad pasa a ser "extra" y ninguna sesión se toca.
  return workouts.length === 1 ? workouts[0] : null;
}

/** Ritmo medio en «mm:ss /km» para carrera/natación (null si no aplica). */
function avgPaceMinKm(discipline: string, activity: Record<string, unknown>, distanceKm: number, durationMin: number): string | null {
  if (discipline !== 'carrera' && discipline !== 'natacion') return null;

  const speedMs = typeof activity.average_speed === 'number' && activity.average_speed > 0 ? activity.average_speed : null;
  let minPerKm: number | null = null;
  if (speedMs) {
    minPerKm = 16.6667 / speedMs;
  } else if (distanceKm > 0 && durationMin > 0) {
    minPerKm = durationMin / distanceKm;
  }
  if (minPerKm === null || !isFinite(minPerKm) || minPerKm <= 0) return null;

  const mm = Math.floor(minPerKm);
  const ss = Math.round((minPerKm - mm) * 60);
  return `${mm}:${String(ss).padStart(2, '0')}`;
}

function pushTitle(kind: string, label: string): string {
  switch (kind) {
    case 'ok':
      return '¡Entrenamiento Completado! 🎉';
    case 'partial':
      return '¡Buen esfuerzo hoy! 💪';
    case 'substitute':
      return `¡Cambiaste el plan! 🤝`;
    case 'extra':
    default:
      return '¡Actividad extra detectada! 👀';
  }
}

function pushBody(congrats: ActivityAiOutput, refocus: RefocusAiOutput): string {
  const base = congrats.text;
  const refocusNeeded = refocus.proposal.action !== 'none';
  return refocusNeeded ? `${base}\n\n💡 ${refocus.proposal.message}` : base;
}

/**
 * Endpoint de Webhook Oficial para Ingesta Automática en Segundo Plano (Garmin / Strava)
 * POST /api/webhooks/telemetry
 *
 * Flujo: verificar → buscar atleta → traer actividad → mapear/validar contra el plan
 * → clasificar (ok/partial/substitute/extra) → felicitar con IA (todo lo hecho, con
 * honestidad si el plan no se cumplió) → proponer reajuste → persistir + push.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received webhook event:', body);

    const { object_type, aspect_type, object_id, owner_id } = body;

    if (object_type !== 'activity' || aspect_type !== 'create') {
      // Otros eventos de Strava (delete, update, etc.) no requieren respuesta.
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const externalAthleteId = `strava_user_${owner_id}`;
    const supabase = createAdminClient();

    // Atleta + perfil fisiológico para personalizar la celebración y el TSS.
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, first_name, current_ftp, current_run_pace, current_swim_pace, strava_auth_tokens')
      .eq('external_athlete_id', externalAthleteId)
      .single();

    if (!profile) {
      console.error('Athlete not found for Strava ID:', owner_id);
      return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });
    }

    const userId = profile.id;
    const { getOrRefreshStravaToken } = await import('@/lib/telemetry/strava-sync');
    const accessToken = await getOrRefreshStravaToken(userId);

    if (!accessToken) {
      console.error('No access token for', userId);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const activityResponse = await fetchWithTimeout(
      `https://www.strava.com/api/v3/activities/${object_id}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!activityResponse.ok) {
      console.error('Failed to fetch activity details from Strava:', await activityResponse.text());
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const activity = (await activityResponse.json()) as Record<string, unknown> & {
      distance?: number;
      moving_time?: number;
      type?: string;
      average_watts?: number;
    };
    console.log('Fetched Strava activity:', activity);

    const distanceKm = activity.distance ? activity.distance / 1000 : 0;
    const durationMin = activity.moving_time ? Math.round(activity.moving_time / 60) : 0;
    const sportTypeRaw = (activity.type || '').trim();

    const discipline = normalizeDiscipline(sportTypeRaw);
    const label = sportLabel(sportTypeRaw, discipline);
    const pace = avgPaceMinKm(discipline, activity, distanceKm, durationMin);

    // Sesiones pendientes de hoy.
    const { data: workouts } = await supabase
      .from('user_workouts')
      .select('*, training_sessions(sport_type, duration_min, description)')
      .eq('user_id', userId)
      .eq('scheduled_date', todayISO())
      .eq('status', 'pending');

    const plannedWorkout = pickWorkout(workouts as PlannedWorkoutRow[] | null, discipline);
    const planned = plannedWorkout?.training_sessions
      ? {
          sportType: plannedWorkout.training_sessions.sport_type || '',
          durationMin: plannedWorkout.training_sessions.duration_min ?? null,
          targetKm: extractTargetKm(plannedWorkout.training_sessions.description),
        }
      : null;

    const actual: ActualActivity = { discipline, sportType: sportTypeRaw, durationMin, distanceKm };
    const classification = classifySession(planned, actual);

    const ctx: ActivityMessageContext = {
      athleteName: profile.first_name || '',
      actual,
      planned,
      classification,
      avgPaceMinKm: pace,
    };

    // IA (con fallback por reglas) — la felicitación y la propuesta de reajuste.
    const [congrats, refocus] = await Promise.all([
      generateActivityCongrats(ctx),
      generateRefocusProposal(ctx),
    ]);

    // TSS estimado con la descripción de la sesión planificada y, si hay, potencia.
    const description = plannedWorkout?.training_sessions?.description ?? null;
    const tss = estimateTss(durationMin, description, {
      avgPower: typeof activity.average_watts === 'number' ? activity.average_watts : null,
      ftp: profile.current_ftp ?? null,
    });

    const now = new Date().toISOString();
    const telemetryRow = {
      user_id: userId,
      source_provider: 'strava',
      external_activity_id: `strava_${object_id}`,
      actual_duration_min: durationMin,
      actual_distance_km: distanceKm,
      actual_tss: tss,
      raw_payload: activity,
      sport_label: label,
      outcome_kind: classification.kind,
      ai_comment: congrats.text,
    };

    // Caso A: la sesión planificada SÍ se hizo (total o parcialmente) → completada.
    if (plannedWorkout && (classification.kind === 'ok' || classification.kind === 'partial')) {
      await supabase
        .from('user_workouts')
        .update({
          status: 'completed',
          completed_at: now,
          actual_tss: tss,
          actual_discipline: label,
          ai_feedback: congrats.text,
          refocus_proposal: refocus.proposal as unknown as Json,
          refocus_applied: refocus.proposal.action === 'none',
        })
        .eq('id', plannedWorkout.id);

      await insertTelemetry(supabase, { ...telemetryRow, workout_id: plannedWorkout.id });
      console.log(`Workout ${plannedWorkout.id} marked completed (${classification.kind}) via webhook`);

      await safePush(sendPushNotification(userId, {
        title: pushTitle(classification.kind, label),
        body: pushBody(congrats, refocus),
        url: `/dashboard/workout/${plannedWorkout.id}`,
      }));
    }
    // Caso B: se hizo OTRA actividad en lugar de la planificada, o no había plan.
    else {
      const substituteMissed = plannedWorkout && classification.kind === 'substitute';

      // La sesión planificada quedó pendiente → marcada como perdida con el aviso honesto.
      if (substituteMissed) {
        await supabase
          .from('user_workouts')
          .update({
            status: 'missed',
            actual_discipline: label,
            ai_feedback: congrats.text,
            refocus_proposal: refocus.proposal as unknown as Json,
            refocus_applied: refocus.proposal.action === 'none',
          })
          .eq('id', plannedWorkout.id);
        console.log(`Planned workout ${plannedWorkout.id} marked missed (substitute: ${label})`);
      }

      // La actividad extra se guarda SIN sesión vinculada (workout_id NULL).
      await insertTelemetry(supabase, { ...telemetryRow, workout_id: null });

      await safePush(sendPushNotification(userId, {
        title: pushTitle(classification.kind, label),
        body: pushBody(congrats, refocus),
        url: substituteMissed ? `/dashboard/workout/${plannedWorkout.id}` : '/dashboard',
      }));
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook POST exception:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// ============================================================
// Helpers
// ============================================================

/** Inserta telemetría sin romper el webhook si Strava reenvía el mismo evento. */
async function insertTelemetry(supabase: SupabaseClient, row: Record<string, unknown>): Promise<void> {
  const { error } = await supabase
    .from('universal_telemetry')
    .upsert(row, { onConflict: 'source_provider,external_activity_id', ignoreDuplicates: true });
  if (error) console.error('Telemetry insert error (ignored):', error.message);
}

/** Un push que falla no puede tumbar el flujo del webhook. */
async function safePush(p: Promise<boolean>): Promise<void> {
  await p.catch((e) => console.error('Push notification error (ignored):', e?.message));
}
