'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { submitCoachFeedback } from '@/app/feedback/feedback-actions';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { ProCard } from '@/components/ui/pro-card';

interface AthleteOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface CoachSuggestionFormProps {
  athletes: AthleteOption[];
}

export function CoachSuggestionForm({ athletes }: CoachSuggestionFormProps) {
  const [feedbackType, setFeedbackType] = useState<string>('platform_improvement');
  const [athleteId, setAthleteId] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await submitCoachFeedback({
      athlete_id: athleteId || undefined,
      feedback_type: feedbackType,
      content
    });

    setIsSubmitting(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setSuccessMessage('¡Sugerencia enviada con éxito al equipo de desarrollo!');
      setContent('');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  return (
    <ProCard className="bg-zinc-900/60 border-zinc-800 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400 text-sm font-semibold"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}

        {errorMessage && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-400 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tipo de Sugerencia */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Tipo de Sugerencia
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'platform_improvement', label: 'Mejora App' },
              { id: 'plan_adjustment', label: 'Ajuste Plan' },
              { id: 'athlete_review', label: 'Revisión Atleta' }
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFeedbackType(t.id)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                  feedbackType === t.id
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selector de py-atleta (Opcional según tipo) */}
        {(feedbackType === 'plan_adjustment' || feedbackType === 'athlete_review') && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <label htmlFor="athlete-select" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Atleta Relacionado
            </label>
            <select
              id="athlete-select"
              value={athleteId}
              onChange={(e) => setAthleteId(e.target.value)}
              className="w-full p-3.5 text-sm text-white border rounded-xl bg-zinc-800/80 border-zinc-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
            >
              <option value="">-- Seleccionar Atleta (Opcional) --</option>
              {athletes.map(a => (
                <option key={a.id} value={a.id}>{a.first_name} {a.last_name}</option>
              ))}
            </select>
          </motion.div>
        )}

        {/* Contenido / Texto */}
        <div>
          <label htmlFor="suggestion-content" className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            Detalle de la Propuesta / Mejora
          </label>
          <textarea
            id="suggestion-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder={
              feedbackType === 'platform_improvement'
                ? 'Ej: Propongo añadir soporte para sensores de temperatura corporal Core en la vista de analíticas...'
                : 'Ej: Ajustar el volumen de carrera de Carlos para asimilar la carga del fin de semana...'
            }
            className="w-full p-4 text-sm text-white placeholder-zinc-500 border rounded-2xl bg-zinc-800/50 border-zinc-700/80 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="w-full py-4 text-sm font-bold text-black transition-all rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Enviar Propuesta de Mejora</span>
            </>
          )}
        </button>

      </form>
    </ProCard>
  );
}
