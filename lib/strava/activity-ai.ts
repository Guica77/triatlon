/**
 * Felicitación y propuesta de reajuste por IA para actividades (Strava y demás).
 *
 * Orquesta: contexto de clasificación → prompt → aiChat (Gemini→Claude) →
 * fallback determinista por reglas cuando no hay API o falla. La IA NUNCA decide
 * la acción mecánica de la propuesta (reprogramar/suavizar/no tocar): la toma
 * `buildRulesProposal` para que «aplicar» sea siempre correcto.
 */

import { aiChat, type AIServiceResult } from '@/lib/ai-service';
import {
  buildActivityCongratsPrompt,
  buildRefocusPrompt,
  type ActivityCongratsPromptInput,
} from '@/lib/ai-prompt-templates';
import { activityPhrase } from '@/lib/strava/classify';
import {
  buildRulesCongrats,
  buildRulesProposal,
  plannedDescription,
  type ActivityMessageContext,
  type RefocusProposal,
} from '@/lib/strava/refocus';

export type ActivitySource = 'ai' | 'rules';

export interface ActivityAiOutput {
  text: string;
  source: ActivitySource;
}

export interface RefocusAiOutput {
  proposal: RefocusProposal;
  source: ActivitySource;
}

/** Para inyectar un aiChat simulado en los tests. */
export interface ActivityAiDeps {
  chat?: typeof aiChat;
}

/** Límite de texto de los mensajes (cuerpo de push + columna BD). */
export const MAX_MESSAGE_LENGTH = 320;

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, MAX_MESSAGE_LENGTH);
}

/** Convierte el contexto de clasificación en la entrada de los prompts. */
function toPromptInput(ctx: ActivityMessageContext): ActivityCongratsPromptInput {
  const { phrase, article } = promptPhrase(ctx);
  const ratio =
    ctx.classification.distanceRatio ?? ctx.classification.durationRatio;
  return {
    athleteName: ctx.athleteName,
    activityPhrase: phrase,
    article,
    actualKm: ctx.classification.actualKm || null,
    actualDurationMin: ctx.actual.durationMin,
    avgPaceMinKm: ctx.avgPaceMinKm || null,
    kind: ctx.classification.kind,
    reasons: ctx.classification.reasons,
    plannedLabel: ctx.planned?.sportType ? plannedDescription(ctx.planned) : null,
    plannedPct: ratio,
  };
}

function promptPhrase(ctx: ActivityMessageContext): { phrase: string; article: 'el' | 'la' } {
  return activityPhrase(ctx.actual.sportType, ctx.actual.discipline);
}

export async function generateActivityCongrats(
  ctx: ActivityMessageContext,
  deps: ActivityAiDeps = {}
): Promise<ActivityAiOutput> {
  const chat = deps.chat ?? aiChat;
  const input = toPromptInput(ctx);
  const result: AIServiceResult = await chat(
    buildActivityCongratsPrompt(input),
    [
      {
        role: 'user',
        content: `Redacta la felicitación para la actividad de hoy (${input.activityPhrase}).`,
      },
    ],
    { temperature: 0.7, maxTokens: 200 }
  );
  if (result.success && result.content) {
    return { text: clean(result.content), source: 'ai' };
  }
  return { text: buildRulesCongrats(ctx), source: 'rules' };
}

export async function generateRefocusProposal(
  ctx: ActivityMessageContext,
  deps: ActivityAiDeps = {}
): Promise<RefocusAiOutput> {
  const chat = deps.chat ?? aiChat;
  const rulesProposal = buildRulesProposal(ctx);
  const input = { ...toPromptInput(ctx), applySummary: applySummaryOf(rulesProposal.action) };

  const result: AIServiceResult = await chat(
    buildRefocusPrompt(input),
    [
      {
        role: 'user',
        content: 'Redacta la propuesta de ajuste del plan.',
      },
    ],
    { temperature: 0.6, maxTokens: 180 }
  );

  if (result.success && result.content) {
    return {
      proposal: { action: rulesProposal.action, message: clean(result.content) },
      source: 'ai',
    };
  }
  return { proposal: rulesProposal, source: 'rules' };
}

/** Texto corto de la acción para el prompt (nunca decide la IA). */
function applySummaryOf(action: RefocusProposal['action']): string {
  switch (action) {
    case 'reschedule-missed':
      return 'PROGRAMAR de nuevo la sesión pendiente en el próximo día libre del plan.';
    case 'ease-next':
      return 'SUAVIZAR la siguiente sesión pendiente (reducir intensidad/duración de cara a la recuperación).';
    case 'none':
    default:
      return 'NO aplicar cambios al plan.';
  }
}