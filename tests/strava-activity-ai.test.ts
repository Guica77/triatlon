import { describe, it, expect } from 'vitest';

import {
  generateActivityCongrats,
  generateRefocusProposal,
  MAX_MESSAGE_LENGTH,
} from '@/lib/strava/activity-ai';
import { classifySession } from '@/lib/strava/classify';
import { buildActivityCongratsPrompt, buildRefocusPrompt } from '@/lib/ai-prompt-templates';
import { plannedDescription } from '@/lib/strava/refocus';

const carrera10 = { sportType: 'carrera', durationMin: 50, targetKm: 10 };
const run = (d: number, k: number) => ({
  discipline: 'carrera' as const,
  sportType: 'run',
  durationMin: d,
  distanceKm: k,
});
const padel = (d = 60, k = 0) => ({
  discipline: 'otra' as const,
  sportType: 'Padel',
  durationMin: d,
  distanceKm: k,
});

function ctxOf(overrides: Partial<Parameters<typeof generateActivityCongrats>[0]> = {}) {
  const merged = {
    athleteName: 'Lucía',
    actual: run(30, 5),
    planned: carrera10 as null | { sportType: string; durationMin?: number; targetKm?: number | null },
    ...overrides,
  };
  const classification = merged.actual.discipline === 'otra'
    ? classifySession(merged.planned, merged.actual)
    : undefined;
  return {
    ...merged,
    classification: overrides.classification ?? classification ?? classifySession(merged.planned, merged.actual),
  };
}

const okChat = () =>
  Promise.resolve({
    content: '¡Buen pádel, Lucía! Mañana lo retomamos con calma. 👏',
    success: true,
    source: 'gemini' as const,
  });

const failChat = () =>
  Promise.resolve({ content: '', success: false, source: 'fallback' as const, error: 'no key' });

const longChat = () =>
  Promise.resolve({ content: 'X'.repeat(600), success: true, source: 'anthropic' as const });

describe('generateActivityCongrats', () => {
  it('usa el texto de la IA cuando está disponible', async () => {
    const out = await generateActivityCongrats(ctxOf({ actual: padel(60) }), { chat: okChat });
    expect(out.source).toBe('ai');
    expect(out.text).toContain('pádel');
  });

  it('cae a reglas cuando no hay IA', async () => {
    const out = await generateActivityCongrats(ctxOf({ actual: padel(60) }), { chat: failChat });
    expect(out.source).toBe('rules');
    expect(out.text).toContain('pádel');
  });

  it('recorta textos largos y normaliza espacios', async () => {
    const out = await generateActivityCongrats(ctxOf(), { chat: longChat });
    expect(out.text.length).toBeLessThanOrEqual(MAX_MESSAGE_LENGTH);
    expect(out.text).not.toMatch(/\s{2,}/);
  });
});

describe('generateRefocusProposal', () => {
  it('mantiene la acción determinista y viste el mensaje con la IA', async () => {
    const out = await generateRefocusProposal(ctxOf({ actual: padel(60) }), { chat: okChat });
    expect(out.source).toBe('ai');
    expect(out.proposal.action).toBe('reschedule-missed');
    expect(out.proposal.message).toContain('pádel');
  });

  it('en fallback, la acción sigue siendo correcta', async () => {
    const out = await generateRefocusProposal(ctxOf({ actual: padel(60) }), { chat: failChat });
    expect(out.source).toBe('rules');
    expect(out.proposal.action).toBe('reschedule-missed');
  });

  it('sesión ok → no tocar el plan', async () => {
    const out = await generateRefocusProposal(ctxOf({ actual: run(52, 10.2) }), { chat: failChat });
    expect(out.proposal.action).toBe('none');
  });
});

describe('prompts en español', () => {
  it('la felicitación incluye la actividad y la instrucción de honestidad', () => {
    const input = {
      athleteName: 'Lucía',
      activityPhrase: 'pádel',
      article: 'el' as const,
      actualDurationMin: 60,
      kind: 'substitute',
      plannedLabel: plannedDescription(carrera10),
    };
    const p = buildActivityCongratsPrompt(input);
    expect(p).toContain('pádel');
    expect(p.toLowerCase()).toContain('español');
  });

  it('el reajuste siempre declara una acción decidida', () => {
    const p = buildRefocusPrompt({
      athleteName: 'Lucía',
      activityPhrase: 'pádel',
      article: 'el',
      actualDurationMin: 60,
      kind: 'substitute',
      plannedLabel: 'correr 10 km',
      applySummary: 'PROGRAMAR de nuevo la sesión pendiente en el próximo día libre del plan.',
    });
    expect(p).toContain('PROGRAMAR de nuevo');
  });
});