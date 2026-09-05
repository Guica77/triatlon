/**
 * Fixture de integración del Webhook de Actividades: monta el handler POST real y
 * sustituye solo las costuras externas (Supabase admin, fetch a Strava, push y el
 * chat IA) para verificar de extremo a extremo los tres comportamientos pedidos:
 *
 *   1. Actividad "otra" (pádel) en lugar de la sesión planificada → se felicita,
 *      se marca la sesión como perdida con honestidad y se propone reprogramarla.
 *   2. Sesión parcial (plan 10 km, hecho 5 km) → se completa con feedback honesto
 *      y se propone suavizar la siguiente sesión.
 *   3. Actividad extra sin plan → se guarda en telemetría sin tocar ninguna sesión.
 *
 * El texto de la IA se sustituye por las reglas deterministas (`buildRulesCongrats` /
 * `buildRulesProposal`) para que el test sea hermético y no dependa de la red; la
 * decisión de acción y el clasificado son los reales.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// --- Costuras reemplazables, visibles en el cuerpo del test mediante vi.hoisted ---
const h = vi.hoisted(() => {
  const state: {
    adminClient: any;
    activity: any;
    fetchStatus: number;
    token: string | null; // null → simula sin credencial de Strava
    push: { calls: Array<{ userId: string; payload: any }> };
  } = {
    adminClient: null,     // fake supabase (se asigna por test)
    activity: null,        // respuesta de la "API de Strava"
    fetchStatus: 200,
    token: 'strava-token-test',
    push: { calls: [] },
  };

  return {
    state,
    createAdminClient: () => state.adminClient,
    fetchWithTimeout: async () =>
      new Response(JSON.stringify(state.activity), {
        status: state.fetchStatus,
        headers: { 'content-type': 'application/json' },
      }),
    getOrRefreshStravaToken: async () => state.token,
    sendPushNotification: async (userId: string, payload: any) => {
      state.push.calls.push({ userId, payload });
      return true;
    },
  };
});

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: h.createAdminClient }));
vi.mock('@/lib/fetch-with-timeout', () => ({ fetchWithTimeout: h.fetchWithTimeout }));
vi.mock('@/lib/telemetry/strava-sync', async () => ({
  getOrRefreshStravaToken: h.getOrRefreshStravaToken,
}));
vi.mock('@/lib/notifications', () => ({ sendPushNotification: h.sendPushNotification }));
// El texto IA se sustituye por las reglas (sin red); la acción y el clasificado son reales.
vi.mock('@/lib/strava/activity-ai', async () => {
  const { buildRulesCongrats, buildRulesProposal } = await import('@/lib/strava/refocus');
  return {
    generateActivityCongrats: async (ctx: any) => ({ text: buildRulesCongrats(ctx), source: 'rules' }),
    generateRefocusProposal: async (ctx: any) => ({ proposal: buildRulesProposal(ctx), source: 'rules' }),
  };
});

import { processWebhookRequest as POST } from '@/app/api/webhooks/telemetry/route';

/** Mini-fake de Supabase: cadena encadenable y then-able, registra writes. */
function buildDb() {
  const store: Record<string, any> = {};
  const calls: { updates: any[]; upserts: any[] } = { updates: [], upserts: [] };

  function query(state: any): any {
    const run = () => {
      switch (state.op) {
        case 'select': {
          const rows = state.rows ?? [];
          if (state.terminal === 'single' || state.terminal === 'maybeSingle') {
            return { data: rows[0] ?? null, error: null };
          }
          return { data: rows, error: null };
        }
        case 'update':
          calls.updates.push({ table: state.table, row: state.row });
          return { error: null };
        case 'upsert':
          calls.upserts.push({ table: state.table, row: state.row });
          return { error: null };
        default:
          return { data: null, error: null };
      }
    };
    return {
      select: () => query({ ...state, op: 'select' }),
      eq: (k: string, v: any) => query({ ...state, filters: [...(state.filters ?? []), [k, v]] }),
      gte: (k: string, v: any) => query({ ...state, filters: [...(state.filters ?? []), ['gte', k, v]] }),
      gt: (k: string, v: any) => query({ ...state, filters: [...(state.filters ?? []), ['gt', k, v]] }),
      order: () => query(state),
      limit: () => query(state),
      single: () => query({ ...state, terminal: 'single' }),
      maybeSingle: () => query({ ...state, terminal: 'maybeSingle' }),
      update: (row: any) => query({ ...state, op: 'update', row }),
      upsert: (row: any) => query({ ...state, op: 'upsert', row }),
      then: (resolve: any, reject: any) => Promise.resolve(run()).then(resolve, reject),
    };
  }

  return {
    store,
    calls,
    client: { from: (table: string) => query({ table, rows: store[table] ?? null }) },
  };
}

/** POST de un evento Strava real al handler, con el cuerpo del webhook. */
async function fireWebhook(objectId = 12345, ownerId = 777) {
  const req = new Request('http://localhost/api/webhooks/telemetry', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      object_type: 'activity',
      aspect_type: 'create',
      object_id: objectId,
      owner_id: ownerId,
    }),
  });
  return POST(req as any);
}

function profile(userId: string) {
  return {
    id: userId,
    first_name: 'Lucía',
    current_ftp: 220,
    current_run_pace: '5:30',
    current_swim_pace: '1:50',
    strava_auth_tokens: null,
  };
}

function plannedRun(id: string, description: string) {
  return {
    id,
    training_sessions: { sport_type: 'carrera', duration_min: 50, description },
  };
}

const run10 = plannedRun('w-run', 'Rodaje de 10 km a ritmo suave');

describe('webhook /api/webhooks/telemetry (fixture integración)', () => {
  beforeEach(() => {
    // Silenciar logs del handler para que la salida del test sea legible.
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    h.state.fetchStatus = 200;
    h.state.token = 'strava-token-test';
    h.state.push.calls = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sesión pendiente → felicita pádel, marca la sesión como perdida y propone reprogramar', async () => {
    const db = buildDb();
    db.store['profiles'] = [profile('u1')];
    db.store['user_workouts'] = [run10]; // la carrera planificada sigue pending hoy
    h.state.adminClient = db.client;
    h.state.activity = { type: 'Padel', distance: 0, moving_time: 3600 }; // 1 h de pádel

    const res = await fireWebhook();
    expect(res.status).toBe(200);

    // 1) Se felicita la actividad REAL, no se finge que hicieron la carrera.
    const congrats = h.state.push.calls[0].payload.body;
    expect(congrats).toContain('pádel');

    // 2) La sesión planificada NO se marca hecha: queda como perdida con honestidad.
    const update = db.calls.updates.find((u) => u.table === 'user_workouts');
    expect(update.row.status).toBe('missed');

    // 3) La propuesta sugiere reprogramar la sesión perdida.
    expect(update.row.refocus_proposal.action).toBe('reschedule-missed');
    expect(update.row.refocus_applied).toBe(false);

    // 4) La actividad extra se guarda SIN sesión vinculada, con su etiqueta y resultado.
    const telemetry = db.calls.upserts.find((u) => u.table === 'universal_telemetry');
    expect(telemetry.row.workout_id).toBeNull();
    expect(telemetry.row.sport_label).toBe('pádel');
    expect(telemetry.row.outcome_kind).toBe('substitute');

    // 5) El push va a la sesión perdida (para que el atleta pueda aplicarla).
    expect(h.state.push.calls[0].payload.url).toBe('/dashboard/workout/w-run');
  });

  it('sesión parcial → completa con feedback honesto y propone suavizar la siguiente', async () => {
    const db = buildDb();
    db.store['profiles'] = [profile('u1')];
    db.store['user_workouts'] = [run10]; // plan: 10 km
    h.state.adminClient = db.client;
    // Strava informa 5 km a ~5:00/km → cumplido a medias.
    h.state.activity = {
      type: 'Run',
      distance: 5000,
      moving_time: 1500,
      average_speed: 3.333,
      average_watts: 180,
    };

    const res = await fireWebhook();
    expect(res.status).toBe(200);

    const update = db.calls.updates.find((u) => u.table === 'user_workouts');
    // No se le regalan los 10 km: honestidad sobre lo que se hizo de verdad.
    expect(update.row.status).toBe('completed');
    expect(update.row.refocus_proposal.action).toBe('ease-next');

    const telemetry = db.calls.upserts.find((u) => u.table === 'universal_telemetry');
    expect(telemetry.row.workout_id).toBe('w-run');
    expect(telemetry.row.outcome_kind).toBe('partial');
    expect(telemetry.row.sport_label).toBe('carrera');
  });

  it('actividad extra sin plan → solo telemetría, ninguna sesión tocada', async () => {
    const db = buildDb();
    db.store['profiles'] = [profile('u1')];
    db.store['user_workouts'] = []; // hoy no hay sesión pendiente
    h.state.adminClient = db.client;
    h.state.activity = { type: 'Padel', distance: 0, moving_time: 2700 };

    const res = await fireWebhook();
    expect(res.status).toBe(200);

    expect(db.calls.updates).toHaveLength(0); // ninguna sesión se toca
    const telemetry = db.calls.upserts.find((u) => u.table === 'universal_telemetry');
    expect(telemetry.row.workout_id).toBeNull();
    expect(telemetry.row.outcome_kind).toBe('extra');
  });

  it('sin perfil vinculado a Strava → 404 y no escribe nada', async () => {
    const db = buildDb();
    db.store['profiles'] = []; // ningún atleta con ese external_athlete_id
    h.state.adminClient = db.client;
    h.state.activity = { type: 'Run', distance: 10000, moving_time: 3000 };

    const res = await fireWebhook(999, 424242);
    expect(res.status).toBe(404);
    expect(db.calls.updates).toHaveLength(0);
    expect(db.calls.upserts).toHaveLength(0);
    expect(h.state.push.calls).toHaveLength(0);
  });

  it('sin token de Strava → responde ok sin clasificar (no rompe el webhook)', async () => {
    const db = buildDb();
    db.store['profiles'] = [profile('u1')];
    h.state.adminClient = db.client;
    h.state.activity = { type: 'Run', distance: 10000, moving_time: 3000 };
    h.state.token = null;

    const res = await fireWebhook();
    expect(res.status).toBe(200);
    expect(db.calls.updates).toHaveLength(0);
    expect(db.calls.upserts).toHaveLength(0);
  });
});
