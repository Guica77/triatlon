'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bot, Sparkles, Loader2, AlertCircle, RefreshCw, Activity, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseAIResponse } from '@/lib/ai-response';
import { setAIConsent } from '@/app/(app)/settings/privacy-actions';

interface WorkoutAIFeedbackProps {
  aiConfigured: boolean;
  todayWorkout?: Record<string, any> | null;
  ctl?: number | null;
  atl?: number | null;
  tsb?: number | null;
  hrv?: number | null;
  readiness?: number | null;
  fatigue?: number | null;
}

export function WorkoutAIFeedback({
  aiConfigured,
  todayWorkout,
  ctl,
  atl,
  tsb,
  hrv,
  readiness,
  fatigue,
}: WorkoutAIFeedbackProps) {
  const [feedback, setFeedback] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [question, setQuestion] = React.useState('');
  const [showChatInput, setShowChatInput] = React.useState(false);
  const [aiDisclosure, setAiDisclosure] = React.useState<{ providers: string[]; models: string[]; version: string } | null>(null);
  const [consentBusy, setConsentBusy] = React.useState(false);
  const [pendingQuestion, setPendingQuestion] = React.useState<string | undefined>();
  const aiAvailable = aiConfigured;

  const buildWorkoutContext = React.useCallback(() => {
    const session = todayWorkout?.training_sessions;
    const sport = todayWorkout?.sport_type || session?.sport_type || 'sin entrenamiento programado';
    const duration = todayWorkout?.duration_min || session?.duration_min || 0;
    const tss = todayWorkout?.actual_tss;
    return `Analiza mi entrenamiento de hoy: ${sport}, ${duration} min, status ${todayWorkout?.status || 'pendiente'}. Mi readiness es ${readiness ?? 'N/A'}, HRV ${hrv ?? 'N/A'}, fatiga ${fatigue ?? 'N/A'}. Dame feedback y recomendaciones.`;
  }, [todayWorkout, readiness, hrv, fatigue]);

  const requestAnalysis = React.useCallback(async (customQuestion?: string) => {
    setLoading(true);
    setError(null);
    setShowChatInput(false);

    try {
      // Try the API route first
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user' as const, content: customQuestion || buildWorkoutContext() }],
          contextType: 'coach',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (errData.fallback) {
          setFeedback(getFallbackAnalysis());
        } else if (errData.code === 'AI_CONSENT_REQUIRED' && errData.aiDisclosure?.version) {
          setPendingQuestion(customQuestion);
          setAiDisclosure(errData.aiDisclosure);
        } else {
          setError(errData.error || 'No se pudo obtener el análisis. Inténtalo de nuevo.');
        }
      } else {
        const text = await res.text();
        const answer = parseAIResponse(text);
        if (answer.error) setError(answer.error);
        else setFeedback(answer.content || null);
      }
    } catch {
      setError('No se pudo conectar con el asistente. Comprueba la conexión y reinténtalo.');
    } finally {
      setLoading(false);
    }
  }, [buildWorkoutContext]);

  const decideAIConsent = async (granted: boolean) => {
    if (!aiDisclosure || consentBusy) return;
    setConsentBusy(true);
    try {
      const result = await setAIConsent(granted, aiDisclosure.version);
      if (result.error) {
        setError(result.error);
        return;
      }
      const questionToRetry = pendingQuestion;
      setAiDisclosure(null);
      setPendingQuestion(undefined);
      if (granted) await requestAnalysis(questionToRetry);
      else setError('No has dado permiso. Tu consulta no se enviará a proveedores de IA. Puedes cambiar de opinión en Perfil → Privacidad y ayuda.');
    } catch {
      setError('No se pudo guardar tu decisión. Inténtalo de nuevo.');
    } finally {
      setConsentBusy(false);
    }
  };

  const handleSendQuestion = () => {
    if (!question.trim()) return;
    requestAnalysis(question.trim());
    setQuestion('');
  };

  return (
    <div
      className="bg-bg-card border border-border-default rounded-2xl p-5"
    >
      {aiDisclosure ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="ai-consent-title" className="max-h-[min(88dvh,720px)] w-full max-w-lg overflow-y-auto rounded-[28px] border border-border-default bg-surface-card p-6 shadow-2xl sm:p-8">
            <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent"><Sparkles className="size-6" aria-hidden="true" /></div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">Decisión opcional</p>
            <h2 id="ai-consent-title" className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">¿Enviar tus datos al asistente de IA?</h2>
            <p className="mt-3 text-sm leading-6 text-text-secondary">Para responder, TriWaveX enviará tu consulta y el contexto deportivo pertinente de tu cuenta —que puede incluir entrenamientos, recuperación, lesiones y preferencias de nutrición— a:</p>
            <ul className="mt-3 space-y-2 rounded-2xl bg-surface-hover p-4 text-sm font-semibold text-text-primary">
              {aiDisclosure.models.map((model) => <li key={model} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-accent" />{model}</li>)}
            </ul>
            <p className="mt-3 text-xs leading-5 text-text-muted">El tratamiento ocurre en la infraestructura del proveedor indicado; puede ser fuera del Espacio Económico Europeo. La región y las condiciones contractuales dependen de la configuración de producción y deben verificarse antes de distribuir la app.</p>
            <p className="mt-3 text-xs leading-5 text-text-muted">El proveedor activo puede cambiar según la configuración del servicio; si cambia, volveremos a pedir permiso. Si no aceptas, el asistente no enviará datos a esos proveedores y podrás seguir usando el resto de TriWaveX. Retirar el permiso después impide nuevos envíos, pero no borra automáticamente lo ya recibido por el proveedor. Las respuestas pueden ser inexactas y no son consejo médico.</p>
            <p className="mt-3 text-xs leading-5 text-text-muted">Si la solicitud se refiere a otra persona atleta, también hará falta su consentimiento por separado.</p>
            <Link href="/legal/privacidad" className="mt-3 inline-flex min-h-10 items-center text-sm font-semibold text-accent underline underline-offset-4">Leer política de privacidad</Link>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button type="button" disabled={consentBusy} onClick={() => void decideAIConsent(false)} className="min-h-12 rounded-full border border-border-default px-5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-hover disabled:opacity-60">Ahora no</button>
              <button type="button" disabled={consentBusy || !aiDisclosure.providers.length} onClick={() => void decideAIConsent(true)} className="min-h-12 rounded-full bg-accent px-5 text-sm font-semibold text-white transition-[filter,transform] hover:brightness-95 active:scale-[.98] disabled:opacity-60">{consentBusy ? 'Guardando…' : 'Permitir y continuar'}</button>
            </div>
          </section>
        </div>
      ) : null}
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-swim/15 border border-swim/15 flex items-center justify-center">
            {aiAvailable ? (
              <Sparkles className="w-4 h-4 text-swim" />
            ) : (
              <Bot className="w-4 h-4 text-text-muted" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">Orientación del entrenamiento</h3>
            <p className="text-[10px] text-text-muted font-medium">
              {aiAvailable ? 'Recomendaciones para tu sesión' : 'Recomendaciones no disponibles'}
            </p>
          </div>
        </div>

        {!aiAvailable && (
          <span className="px-2 py-0.5 rounded-full bg-bg-hover border border-border-default text-[9px] text-text-muted font-bold uppercase tracking-wider">
            No disponible
          </span>
        )}
      </div>

      {/* Content area */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="h-4 bg-bg-hover rounded-lg animate-pulse w-3/4" />
            <div className="h-4 bg-bg-hover rounded-lg animate-pulse w-1/2" />
            <div className="h-4 bg-bg-hover rounded-lg animate-pulse w-5/6" />
            <div className="h-4 bg-bg-hover rounded-lg animate-pulse w-2/3" />
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3 py-4"
          >
            <AlertCircle className="w-6 h-6 text-red-400" />
            <p className="text-xs text-text-muted text-center max-w-xs">{error}</p>
            <button
              onClick={() => requestAnalysis()}
              className="flex items-center gap-1.5 text-xs font-bold text-swim hover:text-swim transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Intentar de nuevo
            </button>
          </motion.div>
        ) : feedback ? (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-text-secondary leading-relaxed space-y-2 whitespace-pre-wrap"
          >
            {feedback}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-4"
          >
            <Activity className="w-8 h-8 text-text-muted" />
            <div className="text-center">
              <p className="text-sm font-bold text-text-primary mb-1">¿Cómo fue tu entrenamiento?</p>
              <p className="text-[11px] text-text-muted leading-relaxed overflow-wrap-break-word">
                Pide un análisis de tu sesión o un consejo para optimizar tu rendimiento.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => requestAnalysis()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-swim/15 text-swim hover:bg-swim/25 border border-swim/15 transition-colors"
              >
                Analizar mi día
              </button>
              <button
                onClick={() => setShowChatInput(!showChatInput)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-bg-hover text-text-secondary hover:bg-bg-hover border border-border-default transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 inline mr-1" />
                Preguntar
              </button>
            </div>

            {showChatInput && (
              <div className="flex gap-2 w-full mt-2">
                <input
                  type="text"
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendQuestion()}
                  placeholder="Ej: ¿Qué tal mi carga esta semana?"
                  className="flex-1 bg-bg-hover border border-border-default rounded-xl px-3.5 py-2.5 text-xs text-text-primary placeholder-text-muted outline-none focus:border-swim/50 transition-all"
                />
                <button
                  onClick={handleSendQuestion}
                  disabled={!question.trim()}
                  className="p-2.5 rounded-xl bg-swim/15 text-swim hover:bg-swim/25 border border-swim/15 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Fallback rule-based analysis when personalised guidance is unavailable.
 */
function getFallbackAnalysis(): string {
  return `**Resumen Automático**

No se pudo cargar la orientación. Aquí tienes un resumen basado en tu plan:

• Consulta el estado de tu sesión en el plan para comprobar si está registrada.
• **Consejo general:** Mantén la consistencia en tus entrenamientos de baja intensidad (Z1-Z2) para construir base aeróbica.
• **Recuperación:** Prioriza el sueño y la nutrición post-entreno para maximizar adaptaciones.

*Este consejo es general; no sustituye un análisis personalizado de tus datos.*`;
}
