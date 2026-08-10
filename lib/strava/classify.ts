/**
 * Inteligencia de Actividad (Strava y otras fuentes) — clasificación pura.
 *
 * Funciones 100% determinísticas y sin I/O: mapean una actividad externa
 * contra la sesión planificada del día y deciden, con honestidad, si la
 * sesión se completó (ok), se completó solo a medias (partial), se sustituyó
 * por otra disciplina (substitute) o no había nada planificado (extra).
 *
 * Diseñado para ser unit-testeado (vitest) y para alimentar a los mensajes
 * de felicitación de la IA y a las propuestas de reajuste del plan.
 */

export type Discipline = 'natacion' | 'ciclismo' | 'carrera' | 'fuerza' | 'otra';

export const TRAINING_DISCIPLINES: ReadonlyArray<Exclude<Discipline, 'otra'>> = [
  'natacion',
  'ciclismo',
  'carrera',
  'fuerza',
];

/** Mapeo de tipos de actividad de Strava → nuestra disciplina. */
export const STRAVA_TO_DISCIPLINE: Record<string, Discipline> = {
  run: 'carrera',
  trailrun: 'carrera',
  trailrunning: 'carrera',
  virtualrun: 'carrera',
  ride: 'ciclismo',
  virtualride: 'ciclismo',
  ebikeride: 'ciclismo',
  mountainbiking: 'ciclismo',
  emountainbikeride: 'ciclismo',
  gravelride: 'ciclismo',
  cyclocross: 'ciclismo',
  handcycle: 'ciclismo',
  swim: 'natacion',
  openwater: 'natacion',
  watersports: 'natacion',
  workout: 'fuerza',
  weights: 'fuerza',
  crossfit: 'fuerza',
};

/** Nombre en español para actividades "otras" habituales (pádel, tenis…). */
export const FRIENDLY_EXTRA_LABELS: Record<string, string> = {
  padel: 'pádel',
  pickleball: 'pádel',
  tennis: 'tenis',
  badminton: 'bádminton',
  squash: 'squash',
  walk: 'caminata',
  hike: 'senderismo',
  yoga: 'yoga',
  pilates: 'pilates',
  rowing: 'remo',
  skiing: 'esquí',
  snowboard: 'snowboard',
  climbing: 'escalada',
  elliptical: 'elíptica',
  'canoe:other': 'canoa',
};

/** Sustantivo con su artículo para construir frases tipo «¡Bien por el pádel!». */
export interface ActivityPhrase {
  phrase: string;
  article: 'el' | 'la';
}

const ARTICLE_BY_NOUN: Record<string, 'el' | 'la'> = {
  pádel: 'el',
  padel: 'el',
  tenis: 'el',
  bádminton: 'el',
  squash: 'el',
  remo: 'el',
  yoga: 'el',
  esquí: 'el',
  snowboard: 'el',
  senderismo: 'el',
  pilates: 'el',
  escalada: 'la',
  caminata: 'la',
  elíptica: 'la',
};

/** Normaliza el tipo de actividad de Strava (minúsculas, sin espacios) a nuestra disciplina. */
export function normalizeDiscipline(sportType?: string | null): Discipline {
  if (!sportType) return 'otra';
  const key = sportType.toLowerCase().replace(/[\s'\-_.]/g, '');
  return STRAVA_TO_DISCIPLINE[key] ?? 'otra';
}

/** Etiqueta corta de la actividad para logs/telemetría («carrera», «pádel»…). */
export function sportLabel(sportType: string, discipline: Discipline): string {
  if (discipline === 'carrera') return 'carrera';
  if (discipline === 'ciclismo') return 'ciclismo';
  if (discipline === 'natacion') return 'natación';
  if (discipline === 'fuerza') return 'fuerza';
  return FRIENDLY_EXTRA_LABELS[sportType.toLowerCase()] ?? cleanLabel(sportType);
}

/** Frase natural con artículo para los mensajes («la carrera», «el pádel»). */
export function activityPhrase(sportType: string, discipline: Discipline): ActivityPhrase {
  const base: Record<Exclude<Discipline, 'otra'>, ActivityPhrase> = {
    carrera: { phrase: 'carrera', article: 'la' },
    ciclismo: { phrase: 'salida en bici', article: 'la' },
    natacion: { phrase: 'sesión de natación', article: 'la' },
    fuerza: { phrase: 'sesión de fuerza', article: 'la' },
  };
  if (discipline !== 'otra') return base[discipline];

  const noun = FRIENDLY_EXTRA_LABELS[sportType.toLowerCase()] ?? cleanLabel(sportType);
  return { phrase: noun, article: ARTICLE_BY_NOUN[noun] ?? 'la' };
}

function cleanLabel(raw: string): string {
  return raw
    .replace(/[_\-.]+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================================
// Distancia objetivo desde la descripción («10 km», «1500 m»)
// ============================================================

/** Extrae la distancia objetivo (km) de la descripción de la sesión, o null. */
export function extractTargetKm(description?: string | null): number | null {
  const d = (description ?? '').toLowerCase().trim();
  if (!d) return null;

  const km = d.match(/(\d+(?:[.,]\d+)?)\s*(?:km\b|kilometros?\b|kilómetros?\b|k\b)/);
  if (km) return parseFloat(km[1].replace(',', '.'));

  const meters = d.match(/(\d{1,6})\s*m\b/);
  if (meters) return Math.round(parseFloat(meters[1])) / 1000;

  return null;
}

// ============================================================
// Clasificación de la sesión
// ============================================================

export interface PlannedSession {
  /** sport_type de training_sessions: natacion | ciclismo | carrera | brick | fuerza | … */
  sportType: string;
  durationMin?: number | null;
  targetKm?: number | null;
}

export interface ActualActivity {
  discipline: Discipline;
  sportType: string;
  durationMin: number;
  distanceKm: number;
}

export type OutcomeKind = 'ok' | 'partial' | 'substitute' | 'extra';

export interface Classification {
  kind: OutcomeKind;
  disciplineMatched: boolean;
  /** Motivos legibles de la decisión (under_distance, different_discipline, …). */
  reasons: string[];
  actualKm: number;
  plannedKm: number | null;
  distanceRatio: number | null;
  durationRatio: number | null;
}

/** Umbral mínimo (proporción) para considerar que una unidad se completó. */
export const COMPLETION_RATIO = 0.9;

/** Resuelve la disciplina esperada de una sesión planificada (o null si no entrena). */
export function resolvePlannedDiscipline(sportType: string): Discipline | 'brick' | null {
  const t = (sportType ?? '').toLowerCase().trim();
  if (t === 'brick') return 'brick';
  return (TRAINING_DISCIPLINES as readonly string[]).includes(t) ? (t as Discipline) : null;
}

export function classifySession(planned: PlannedSession | null, actual: ActualActivity): Classification {
  const noData = {
    actualKm: round1(actual.distanceKm),
    plannedKm: planned?.targetKm ?? null,
    distanceRatio: null,
    durationRatio: null,
  };

  if (!planned || !planned.sportType) {
    return { kind: 'extra', disciplineMatched: false, reasons: ['sin_sesion_planificada'], ...noData };
  }

  const plannedDisc = resolvePlannedDiscipline(planned.sportType);
  if (plannedDisc === null) {
    // Descanso planificado / tipo desconocido → cualquier actividad es extra.
    return { kind: 'extra', disciplineMatched: false, reasons: ['descanso_planificado'], ...noData };
  }

  const matched =
    plannedDisc === 'brick'
      ? actual.discipline === 'ciclismo' || actual.discipline === 'carrera'
      : plannedDisc === actual.discipline;

  if (!matched) {
    return {
      kind: 'substitute',
      disciplineMatched: false,
      reasons: ['different_discipline'],
      ...noData,
    };
  }

  // Coincide la disciplina: evaluar si completó volumen/duración.
  const targetKm = planned.targetKm ?? null;
  const plDur = planned.durationMin ?? null;

  const distanceRatio = targetKm && targetKm > 0 ? round2(actual.distanceKm / targetKm) : null;
  const durationRatio = plDur && plDur > 0 ? round2(actual.durationMin / plDur) : null;

  const reasons: string[] = [];
  if (plannedDisc === 'brick') reasons.push('brick_incomplete');
  if (distanceRatio !== null && distanceRatio < COMPLETION_RATIO) reasons.push('under_distance');
  if (durationRatio !== null && durationRatio < COMPLETION_RATIO) reasons.push('under_duration');

  return {
    kind: reasons.length > 0 ? 'partial' : 'ok',
    disciplineMatched: true,
    reasons,
    actualKm: round1(actual.distanceKm),
    plannedKm: targetKm,
    distanceRatio,
    durationRatio,
  };
}

// ============================================================
// TSS estimado (paridad con analytics — SIN dependencias externas)
// ============================================================

export interface TssOptions {
  avgPower?: number | null;
  ftp?: number | null;
}

/**
 * Estima el TSS por duración y descripción de intensidad.
 * Misma lógica base que `app/(app)/analytics/analytics-actions.ts`,
 * con refinamiento por potencia cuando el FTP del atleta está disponible.
 */
export function estimateTss(durationMin: number, description?: string | null, options?: TssOptions): number {
  if (!durationMin || durationMin <= 0) return 0;

  const desc = (description ?? '').toLowerCase();
  let intensityFactor = 0.75;

  if (desc.includes('zona 4') || desc.includes('z4') || desc.includes('series') || desc.includes('fuerte') || desc.includes('umbral')) {
    intensityFactor = 0.88;
  } else if (desc.includes('zona 3') || desc.includes('z3') || desc.includes('ritmo') || desc.includes('tempo')) {
    intensityFactor = 0.8;
  } else if (desc.includes('zona 1') || desc.includes('z1') || desc.includes('recuperación') || desc.includes('suave')) {
    intensityFactor = 0.65;
  }

  if (options?.avgPower && options?.ftp && options.ftp > 0) {
    const if2 = clamp(options.avgPower / options.ftp, 0.5, 1.1);
    intensityFactor = Math.max(intensityFactor, clamp(if2 * if2, 0.4, 1.0));
  }

  return Math.round((durationMin / 60) * Math.pow(intensityFactor, 2) * 100);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

// ============================================================
// Reprogramación: próximo día libre
// ============================================================

/**
 * Devuelve la primera fecha ISO «YYYY-MM-DD» >= `fromDateISO` que no esté ya
 * ocupada, dentro de los próximos 14 días. null si no hay hueco.
 */
export function findNextFreeDay(fromDateISO: string, occupiedDates: string[]): string | null {
  const occupied = new Set(occupiedDates);
  const from = parseISO(fromDateISO);
  if (isNaN(from.getTime())) return null;

  for (let i = 0; i < 14; i++) {
    const day = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + i));
    const iso = toISO(day);
    if (!occupied.has(iso)) return iso;
  }
  return null;
}

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function toISO(date: Date): string {
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${date.getUTCFullYear()}-${mm}-${dd}`;
}

/** Fecha de hoy en formato ISO (UTC). */
export function todayISO(): string {
  return toISO(new Date());
}

/** Fecha de mañana en formato ISO (UTC). */
export function tomorrowISO(fromISO = todayISO()): string {
  const from = parseISO(fromISO);
  return toISO(new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + 1)));
}