/**
 * Mensajes y propuestas de reajuste — reglas deterministas.
 *
 * Estas funciones producen el texto EN ESPAÑOL de felicitación y la propuesta
 * de reajuste cuando la IA no está disponible (modo offline), y además definen
 * la dimensión *accionable* de la propuesta (action) que la IA nunca decide:
 * reprogramar la sesión perdida, suavizar la siguiente, o no tocar nada.
 */

import {
  ActivityPhrase,
  ActualActivity,
  Classification,
  PlannedSession,
  activityPhrase,
} from './classify';

// ============================================================
// Tipos
// ============================================================

export type RefocusAction = 'reschedule-missed' | 'ease-next' | 'none';

export interface RefocusProposal {
  action: RefocusAction;
  message: string;
}

export interface ActivityMessageContext {
  athleteName: string;
  actual: ActualActivity;
  planned?: PlannedSession | null;
  classification: Classification;
  /** Ritmo medio de la actividad en min/km, p. ej. «5:12» (opcional). */
  avgPaceMinKm?: string | null;
}

// ============================================================
// Formato auxiliar
// ============================================================

/** «10 km» | «1.500 m» (muestra metros para distancias cortas, típico natación). */
export function formatKm(km: number | null | undefined): string | null {
  if (km === null || km === undefined || !isFinite(km) || km <= 0) return null;
  if (km < 2) return `${thousandSep(Math.round(km * 1000))} m`;
  const rounded = Math.round(km * 10) / 10;
  return `${String(rounded).replace('.', ',')} km`;
}

/** Separa miles con «.» (es-ES): 1500 → «1.500». */
function thousandSep(n: number): string {
  const digits = String(n);
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Descripción humana de la sesión planificada («correr 10 km», «natación 1.500 m»). */
export function plannedDescription(planned?: PlannedSession | null): string {
  const t = (planned?.sportType ?? '').toLowerCase().trim();
  const km = formatKm(planned?.targetKm ?? null);
  const kmSuffix = km ? ` de ${km}` : '';

  switch (t) {
    case 'carrera':
      return `correr ${km ?? 'la tirada'}`;
    case 'ciclismo':
      return `salida en bici${kmSuffix}`;
    case 'natacion':
      return `natación${kmSuffix}`;
    case 'brick':
      return 'brick (bici + carrera)';
    case 'fuerza':
      return 'sesión de fuerza';
    default:
      return t || 'la sesión planificada';
  }
}

function phraseOf(actual: ActualActivity): ActivityPhrase {
  return activityPhrase(actual.sportType, actual.discipline);
}

function greeting() {
  return '¡Bien por';
}

// ============================================================
// Felicitación (fallback por reglas)
// ============================================================

/**
 * Mensaje de felicitación honesto: celebra SIEMPRE la actividad realmente hecha
 * y, si el plan no se cumplió, lo dice sin dramatizar y propone seguir adelante.
 */
export function buildRulesCongrats(ctx: ActivityMessageContext): string {
  const { classification, actual, planned } = ctx;
  const name = ctx.athleteName?.trim() || 'Atleta';
  const { phrase, article } = phraseOf(actual);
  const dur = actual.durationMin;
  const kmText = formatKm(actual.distanceKm);

  switch (classification.kind) {
    case 'ok': {
      const dist = kmText ? ` ${kmText} en ${dur} min` : ` durante ${dur} min`;
      return `¡Completaste ${article} ${phrase} de hoy! 🎯${dist}. Tal y como estaba planificado, ${name}. ¡Gran nivel!`;
    }

    case 'partial': {
      // Proporción más fiel al plan (distancia o duración, lo que haya).
      const ratio = classification.distanceRatio ?? classification.durationRatio;
      const pct = ratio !== null ? Math.round(ratio * 100) : null;
      const brickPart = planned?.sportType?.toLowerCase() === 'brick';
      const incompleto = brickPart
        ? 'una parte del brick'
        : pct !== null
          ? `${String(pct).replace('.', ',')}% del plan`
          : 'una parte del plan';

      let msg = `¡Bien ahí, ${name}! 💪 Completaste ${incompleto}${kmText ? ` (${kmText})` : ''}${dur ? ` en ${dur} min` : ''}.`;
      if (ctx.avgPaceMinKm) msg += ` Tu ritmo quedó en ${ctx.avgPaceMinKm}/km.`;
      if (classification.reasons.includes('under_distance') && classification.plannedKm) {
        msg += ` El plan pedía ${formatKm(classification.plannedKm)}, así que vamos poco a poco.`;
      }
      return msg;
    }

    case 'substitute': {
      const extra = `${greeting()} ${article} ${phrase} de hoy, ${name}! 👏`;
      if (!planned || !planned.sportType) return extra;
      const pendiente = ` El plan de hoy era ${plannedDescription(planned)} y se quedó pendiente: lo reprogramamos para hacerlo bien, sin presionarte.`;
      return extra + pendiente;
    }

    case 'extra':
    default:
      return `${greeting()} ${article} ${phrase} de hoy, ${name}! 🎉${dur ? ` ${dur} min de movimiento que suman.` : ''}`;
  }
}

// ============================================================
// Propuesta de reajuste (fallback por reglas)
// ============================================================

/**
 * Propuesta accionable de reajuste del plan. La `action` es la parte que la IA
 * nunca decide: se deriva de reglas deterministas para que «aplicar» sea
 * siempre mecánicamente correcto.
 */
export function buildRulesProposal(ctx: ActivityMessageContext): RefocusProposal {
  const { classification, actual, planned } = ctx;
  const { phrase, article } = phraseOf(actual);

  switch (classification.kind) {
    case 'substitute':
      return {
        action: 'reschedule-missed',
        message: planned
          ? `Tocaba ${plannedDescription(planned)} y no se realizó. ¿Reprogramamos la sesión para el próximo día libre del plan?`
          : `Hiciste ${article} ${phrase} en lugar de la sesión planificada. ¿Reprogramamos la sesión para un día libre?`,
      };

    case 'partial': {
      const ratio = classification.distanceRatio ?? classification.durationRatio;
      const pct = ratio !== null ? Math.round(ratio * 100) : null;
      const plannedDisc = planned?.sportType?.toLowerCase();
      if (plannedDisc === 'brick') {
        return {
          action: 'ease-next',
          message: 'Completaste solo una parte del brick planificado. Proponemos suavizar la siguiente sesión para reponer bien.',
        };
      }
      return {
        action: 'ease-next',
        message:
          pct !== null
            ? `Completaste ${article} ${phrase} al ${String(pct).replace('.', ',')}% del volumen planificado. Proponemos suavizar la próxima sesión para asentar lo hecho.`
            : `Completaste ${article} ${phrase} por debajo del plan. Proponemos suavizar la próxima sesión.`,
      };
    }

    case 'extra': {
      if (actual.durationMin >= 30) {
        return {
          action: 'ease-next',
          message: `Registramos ${article} ${phrase} extra (+${actual.durationMin} min de carga). Para no arrastrar fatiga, proponemos suavizar la siguiente sesión.`,
        };
      }
      return {
        action: 'none',
        message: `Actividad extra breve (${actual.durationMin} min) sin impacto en el plan: no hace falta tocar nada.`,
      };
    }

    case 'ok':
    default:
      return {
        action: 'none',
        message: 'La sesión se completó según lo planificado. Sin cambios en el plan. 👍',
      };
  }
}