'use client';

import * as React from 'react';
import { Bot, Sparkles, Loader2, AlertCircle, RefreshCw, Activity, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isAIAvailable } from '@/lib/ai-service';

interface WorkoutAIFeedbackProps {
  todayWorkout?: Record<string, any> | null;
  ctl?: number | null;
  atl?: number | null;
  tsb?: number | null;
  hrv?: number | null;
  readiness?: number | null;
  fatigue?: number | null;
}

export function WorkoutAIFeedback({
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
  const aiAvailable = isAIAvailable();

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
        setFeedback(errData.error || 'No se pudo obtener análisis. Usando recomendación automática.');
        if (errData.fallback) {
          setFeedback(getFallbackAnalysis());
        }
      } else {
        const text = await res.text();
        setFeedback(text || getFallbackAnalysis());
      }
    } catch {
      // Fallback to rule-based analysis
      setFeedback(getFallbackAnalysis());
    } finally {
      setLoading(false);
    }
  }, [buildWorkoutContext]);

  const handleSendQuestion = () => {
    if (!question.trim()) return;
    requestAnalysis(question.trim());
    setQuestion('');
  };

  return (
    <div
      className="bg-bg-card border border-border-default rounded-2xl p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sport-swim/15 border border-sport-swim/15 flex items-center justify-center">
            {aiAvailable ? (
              <Sparkles className="w-4 h-4 text-sport-swim" />
            ) : (
              <Bot className="w-4 h-4 text-text-muted" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">
              {aiAvailable ? 'Coach IA' : 'Asistente de Entrenamiento'}
            </h3>
            <p className="text-[10px] text-text-muted font-medium">
              {aiAvailable ? 'Análisis inteligente' : 'Recomendación automática'}
            </p>
          </div>
        </div>

        {!aiAvailable && (
          <span className="px-2 py-0.5 rounded-full bg-bg-hover border border-border-default text-[9px] text-text-muted font-bold uppercase tracking-wider">
            Offline
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
              className="flex items-center gap-1.5 text-xs font-bold text-sport-swim hover:text-sport-swim transition-colors"
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
                className="px-4 py-2 rounded-xl text-xs font-bold bg-sport-swim/15 text-sport-swim hover:bg-sport-swim/25 border border-sport-swim/15 transition-colors"
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
                  className="flex-1 bg-bg-hover border border-border-default rounded-xl px-3.5 py-2.5 text-xs text-text-primary placeholder-text-muted outline-none focus:border-sport-swim/50 transition-all"
                />
                <button
                  onClick={handleSendQuestion}
                  disabled={!question.trim()}
                  className="p-2.5 rounded-xl bg-sport-swim/15 text-sport-swim hover:bg-sport-swim/25 border border-sport-swim/15 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
 * Fallback rule-based analysis when AI is unavailable
 */
function getFallbackAnalysis(): string {
  return `📊 **Resumen Automático**

No se pudo conectar con el asistente IA. Aquí tienes un análisis basado en reglas:

• **Sesión registrada correctamente.** Sigue monitorizando tu carga semanal.
• **Consejo general:** Mantén la consistencia en tus entrenamientos de baja intensidad (Z1-Z2) para construir base aeróbica.
• **Recuperación:** Prioriza el sueño y la nutrición post-entreno para maximizar adaptaciones.

*Para análisis más detallados, configura una clave de API de IA en Ajustes.*`;
}