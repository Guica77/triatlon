import { describe, it, expect } from 'vitest';

import {
  normalizeDiscipline,
  sportLabel,
  activityPhrase,
  extractTargetKm,
  classifySession,
  estimateTss,
  findNextFreeDay,
  tomorrowISO,
  todayISO,
  type ActualActivity,
  type PlannedSession,
} from '@/lib/strava/classify';
import {
  buildRulesCongrats,
  buildRulesProposal,
  formatKm,
  plannedDescription,
} from '@/lib/strava/refocus';

const carrera10: PlannedSession = { sportType: 'carrera', durationMin: 50, targetKm: 10 };

const asRun = (durationMin: number, distanceKm: number): ActualActivity => ({
  discipline: 'carrera',
  sportType: 'run',
  durationMin,
  distanceKm,
});

// ============================================================
// normalizeDiscipline
// ============================================================

describe('normalizeDiscipline', () => {
  it('mapea tipos de Strava a nuestra disciplina', () => {
    expect(normalizeDiscipline('Run')).toBe('carrera');
    expect(normalizeDiscipline('trailrun')).toBe('carrera');
    expect(normalizeDiscipline('virtualrun')).toBe('carrera');
    expect(normalizeDiscipline('ride')).toBe('ciclismo');
    expect(normalizeDiscipline('VirtualRide')).toBe('ciclismo');
    expect(normalizeDiscipline('ebikeride')).toBe('ciclismo');
    expect(normalizeDiscipline('Swim')).toBe('natacion');
    expect(normalizeDiscipline('openwater')).toBe('natacion');
    expect(normalizeDiscipline('Workout')).toBe('fuerza');
  });

  it('cae a "otra" para actividades no deportivas o desconocidas', () => {
    expect(normalizeDiscipline('Padel')).toBe('otra');
    expect(normalizeDiscipline('Tennis')).toBe('otra');
    expect(normalizeDiscipline('walk')).toBe('otra');
    expect(normalizeDiscipline('')).toBe('otra');
    expect(normalizeDiscipline(null)).toBe('otra');
    expect(normalizeDiscipline(undefined)).toBe('otra');
  });
});

describe('etiquetas', () => {
  it('produce la etiqueta corta y la frase con artículo', () => {
    expect(sportLabel('run', 'carrera')).toBe('carrera');
    expect(sportLabel('Padel', 'otra')).toBe('pádel');
    expect(sportLabel('Tennis', 'otra')).toBe('tenis');

    expect(activityPhrase('run', 'carrera')).toEqual({ phrase: 'carrera', article: 'la' });
    expect(activityPhrase('Padel', 'otra')).toEqual({ phrase: 'pádel', article: 'el' });
    expect(activityPhrase('walk', 'otra')).toEqual({ phrase: 'caminata', article: 'la' });
  });
});

// ============================================================
// extractTargetKm
// ============================================================

describe('extractTargetKm', () => {
  it('extrae kilómetros en distintos formatos', () => {
    expect(extractTargetKm('10 km a ritmo objetivo')).toBe(10);
    expect(extractTargetKm('10km')).toBe(10);
    expect(extractTargetKm('10k')).toBe(10);
    expect(extractTargetKm('1,5 km progresivos')).toBe(1.5);
    expect(extractTargetKm('cinco kilómetros')).toBe(null);
  });

  it('extrae metros y los convierte a km', () => {
    expect(extractTargetKm('1500 m')).toBe(1.5);
    expect(extractTargetKm('1500m')).toBe(1.5);
    expect(extractTargetKm('3 x 200 m')).toBe(0.2);
  });

  it('no confunde minutos con metros y devuelve null sin distancia', () => {
    expect(extractTargetKm('20 min de rodaje suave')).toBe(null);
    expect(extractTargetKm('Z2 suave')).toBe(null);
    expect(extractTargetKm('')).toBe(null);
    expect(extractTargetKm(null)).toBe(null);
    expect(extractTargetKm(undefined)).toBe(null);
  });
});

// ============================================================
// classifySession
// ============================================================

describe('classifySession', () => {
  it('sin sesión planificada → extra', () => {
    const c = classifySession(null, asRun(40, 6));
    expect(c.kind).toBe('extra');
    expect(c.disciplineMatched).toBe(false);
    expect(c.reasons).toContain('sin_sesion_planificada');
  });

  it('descanso planificado → extra (no marca nada como perdido)', () => {
    const c = classifySession({ sportType: 'descanso' }, asRun(40, 6));
    expect(c.kind).toBe('extra');
    expect(c.reasons).toContain('descanso_planificado');
  });

  it('disciplina distinta → substitute', () => {
    const c = classifySession(carrera10, {
      discipline: 'ciclismo',
      sportType: 'ride',
      durationMin: 90,
      distanceKm: 30,
    });
    expect(c.kind).toBe('substitute');
    expect(c.disciplineMatched).toBe(false);
    expect(c.reasons).toContain('different_discipline');
  });

  it('sesión cumplida → ok', () => {
    const c = classifySession(carrera10, asRun(52, 10.2));
    expect(c.kind).toBe('ok');
    expect(c.disciplineMatched).toBe(true);
    expect(c.distanceRatio).toBeGreaterThanOrEqual(1);
  });

  it('mitad de la distancia y mitad del tiempo → partial (under_distance + under_duration)', () => {
    const c = classifySession(carrera10, asRun(25, 5));
    expect(c.kind).toBe('partial');
    expect(c.reasons).toContain('under_distance');
    expect(c.reasons).toContain('under_duration');
    expect(c.distanceRatio).toBe(0.5);
    expect(c.durationRatio).toBe(0.5);
  });

  it('misma duración pero mitad de distancia → partial (solo under_distance)', () => {
    const c = classifySession(carrera10, asRun(50, 5));
    expect(c.kind).toBe('partial');
    expect(c.reasons).toContain('under_distance');
    expect(c.reasons).not.toContain('under_duration');
  });

  it('sobrecumplimiento → ok', () => {
    const c = classifySession(carrera10, asRun(60, 12));
    expect(c.kind).toBe('ok');
  });

  it('una sola pierna de un brick → partial (brick_incomplete)', () => {
    const c = classifySession({ sportType: 'brick', durationMin: 90, targetKm: null }, {
      discipline: 'ciclismo',
      sportType: 'ride',
      durationMin: 60,
      distanceKm: 25,
    });
    expect(c.kind).toBe('partial');
    expect(c.reasons).toContain('brick_incomplete');
    expect(c.disciplineMatched).toBe(true);
  });

  it('fuerza con actividad de fuerza → ok', () => {
    const c = classifySession({ sportType: 'fuerza', durationMin: 45 }, {
      discipline: 'fuerza',
      sportType: 'workout',
      durationMin: 50,
      distanceKm: 0,
    });
    expect(c.kind).toBe('ok');
  });
});

// ============================================================
// estimateTss
// ============================================================

describe('estimateTss', () => {
  it('devuelve 0 sin duración', () => {
    expect(estimateTss(0)).toBe(0);
    expect(estimateTss(-5)).toBe(0);
  });

  it('Z2 base: 60 min → ~56 TSS', () => {
    expect(estimateTss(60)).toBe(56);
  });

  it('intensidad alta sube el factor', () => {
    expect(estimateTss(60, 'series 3x1500 en zona 4')).toBe(77);
    expect(estimateTss(60, 'rodaje suave en z1')).toBe(42);
  });

  it('refina por potencia cuando hay FTP', () => {
    const noPower = estimateTss(60);
    const withPower = estimateTss(60, 'fondo zona 2', { avgPower: 252, ftp: 280 });
    expect(withPower).toBe(66);
    expect(withPower).toBeGreaterThan(noPower);
  });
});

// ============================================================
// findNextFreeDay / tomorrowISO / formatKm
// ============================================================

describe('findNextFreeDay', () => {
  it('devuelve el día pedido si está libre', () => {
    expect(findNextFreeDay('2026-08-11', [])).toBe('2026-08-11');
  });
  it('salta el día ocupado', () => {
    expect(findNextFreeDay('2026-08-11', ['2026-08-11'])).toBe('2026-08-12');
  });
  it('salta varios días ocupados', () => {
    expect(findNextFreeDay('2026-08-11', ['2026-08-11', '2026-08-12', '2026-08-13'])).toBe('2026-08-14');
  });
  it('nada disponible tras 14 días ocupados', () => {
    const occupied = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(Date.UTC(2026, 7, 11 + i));
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    });
    expect(findNextFreeDay('2026-08-11', occupied)).toBe(null);
  });
});

describe('tomorrowISO / formatKm', () => {
  it('calcula mañana', () => {
    expect(tomorrowISO('2026-08-10')).toBe('2026-08-11');
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  it('formatea km y metros', () => {
    expect(formatKm(10)).toBe('10 km');
    expect(formatKm(1.5)).toBe('1.500 m');
    expect(formatKm(0)).toBe(null);
    expect(formatKm(null)).toBe(null);
  });
});

// ============================================================
// buildRulesCongrats / buildRulesProposal
// ============================================================

function ctxOf(overrides: Partial<Parameters<typeof buildRulesCongrats>[0]> = {}) {
  const merged = {
    athleteName: 'Lucía',
    actual: asRun(30, 5),
    planned: carrera10 as PlannedSession | null,
    ...overrides,
  };
  // La clasificación se deriva SIEMPRE de actual/planned reales, salvo que el test la fije.
  const classification = overrides.classification ?? classifySession(merged.planned, merged.actual);
  return { ...merged, classification };
}

describe('buildRulesCongrats', () => {
  it('ok → celebra la disciplina hecha sin mencionar carencias', () => {
    const msg = buildRulesCongrats(ctxOf({ actual: asRun(52, 10.2) }));
    expect(msg).toContain('carrera');
    expect(msg).toContain('Lucía');
    expect(msg).toContain('Completaste');
  });

  it('partial → honesto sobre distancia corta y ritmo', () => {
    const msg = buildRulesCongrats(ctxOf({ classification: classifySession(carrera10, asRun(50, 5)), avgPaceMinKm: '6:12' }));
    expect(msg).toContain('50%');
    expect(msg).toContain('El plan pedía 10 km');
    expect(msg).toContain('6:12');
  });

  it('substitute → felicita por lo hecho y avisa del plan pendiente', () => {
    const msg = buildRulesCongrats(ctxOf({
      actual: { discipline: 'otra', sportType: 'Padel', durationMin: 60, distanceKm: 0 },
      classification: classifySession(carrera10, { discipline: 'otra', sportType: 'Padel', durationMin: 60, distanceKm: 0 }),
    }));
    expect(msg).toContain('pádel');
    expect(msg).toContain('correr 10 km');
    expect(msg).toContain('quedó pendiente');
  });

  it('extra → celebra la actividad registrada', () => {
    const msg = buildRulesCongrats(ctxOf({
      planned: null,
      classification: classifySession(null, { discipline: 'otra', sportType: 'Tennis', durationMin: 75, distanceKm: 0 }),
      actual: { discipline: 'otra', sportType: 'Tennis', durationMin: 75, distanceKm: 0 },
    }));
    expect(msg).toContain('tenis');
    expect(msg).toContain('Lucía');
  });
});

describe('buildRulesProposal', () => {
  it('substitute → reprogramar la sesión perdida', () => {
    const p = buildRulesProposal(ctxOf({
      actual: { discipline: 'otra', sportType: 'Padel', durationMin: 60, distanceKm: 0 },
      classification: classifySession(carrera10, { discipline: 'otra', sportType: 'Padel', durationMin: 60, distanceKm: 0 }),
    }));
    expect(p.action).toBe('reschedule-missed');
    expect(p.message).toContain('Reprogramamos');
  });

  it('partial → suavizar la próxima sesión', () => {
    const p = buildRulesProposal(ctxOf());
    expect(p.action).toBe('ease-next');
    expect(p.message).toContain('50%');
  });

  it('extra con carga ≥30 min → suavizar próxima sesión', () => {
    const p = buildRulesProposal(ctxOf({
      planned: null,
      actual: { discipline: 'otra', sportType: 'Padel', durationMin: 60, distanceKm: 0 },
      classification: classifySession(null, { discipline: 'otra', sportType: 'Padel', durationMin: 60, distanceKm: 0 }),
    }));
    expect(p.action).toBe('ease-next');
  });

  it('extra breve → no tocar el plan', () => {
    const p = buildRulesProposal(ctxOf({
      planned: null,
      actual: { discipline: 'otra', sportType: 'walk', durationMin: 15, distanceKm: 1.2 },
      classification: classifySession(null, { discipline: 'otra', sportType: 'walk', durationMin: 15, distanceKm: 1.2 }),
    }));
    expect(p.action).toBe('none');
  });

  it('ok → no tocar el plan', () => {
    const p = buildRulesProposal(ctxOf({
      actual: asRun(52, 10.2),
      classification: classifySession(carrera10, asRun(52, 10.2)),
    }));
    expect(p.action).toBe('none');
  });
});

describe('plannedDescription', () => {
  it('describe la sesión planificada', () => {
    expect(plannedDescription({ sportType: 'carrera', targetKm: 10 })).toBe('correr 10 km');
    expect(plannedDescription({ sportType: 'natacion', targetKm: 1.5 })).toBe('natación de 1.500 m');
    expect(plannedDescription({ sportType: 'brick' })).toBe('brick (bici + carrera)');
  });
});