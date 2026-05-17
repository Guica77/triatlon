'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Smile, Frown, ThumbsUp } from 'lucide-react';
import { submitWorkoutFeedback } from '@/app/feedback/feedback-actions';

interface WorkoutFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutId: string;
  workoutTitle: string;
}

const FEELINGS = [
  { id: 'excelente', label: 'Excelente', icon: Smile, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  { id: 'buena', label: 'Buena', icon: ThumbsUp, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
  { id: 'fatigado', label: 'Fatigado', icon: AlertTriangle, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  { id: 'lesionado', label: 'Lesionado', icon: Frown, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' }
];

export function WorkoutFeedbackModal({ isOpen, onClose, workoutId, workoutTitle }: WorkoutFeedbackModalProps) {
  const [rpe, setRpe] = useState<number>(5);
  const [feeling, setFeeling] = useState<string>('buena');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitting = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await submitWorkoutFeedback({
      workout_id: workoutId,
      rpe_score: rpe,
      feeling,
      notes
    });

    setIsSubmitting(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setSuccessMessage('¡Feedback registrado con éxito! Tu py-entrenador ha sido notificado.');
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);
    }
  };

  const getRpeColor = (score: number) => {
    if (score <= 3) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    if (score <= 6) return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
    if (score <= 8) return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
  };

  const getRpeLabel = (score: number) => {
    if (score <= 2) return 'Muy Suave / Z1';
    if (score <= 4) return 'Suave / Z2 Aeróbico';
    if (score <= 6) return 'Moderado / Z3 Tempo';
    if (score <= 8) return 'Duro / Z4 Umbral';
    return 'Máximo Esfuerzo / Z5 Anaeróbico';
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden border rounded-3xl bg-zinc-900/90 border-zinc-800 shadow-2xl backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800/80">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white">Evaluación Post-Entrenamiento</h3>
              <p className="text-sm text-zinc-400 mt-1">{workoutTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 transition-colors rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form / Content */}
          <form onSubmit={handleSubmitting} className="p-6 space-y-6">
            {successMessage ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <CheckCircle className="w-16 h-16 text-emerald-400 mb-4 animate-bounce" />
                <p className="text-lg font-semibold text-white">{successMessage}</p>
              </motion.div>
            ) : (
              <>
                {errorMessage && (
                  <div className="p-4 text-sm border rounded-2xl bg-rose-500/10 border-rose-500/30 text-rose-400">
                    {errorMessage}
                  </div>
                )}

                {/* RPE Selector */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-zinc-300">Esfuerzo Percibido (RPE 1-10)</label>
                    <span className="text-xs font-medium text-cyan-400">{getRpeLabel(rpe)}</span>
                  </div>
                  <div className="grid grid-cols-10 gap-1.5 mb-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                      const isSelected = rpe === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setRpe(num)}
                          className={`h-11 rounded-xl font-bold text-sm transition-all flex items-center justify-center border ${
                            isSelected
                              ? getRpeColor(num) + ' scale-105 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-400'
                              : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[11px] text-zinc-500 font-medium px-1">
                    <span>1 - Muy Suave</span>
                    <span>5 - Moderado</span>
                    <span>10 - Extremo</span>
                  </div>
                </div>

                {/* Feeling Selector */}
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-3">¿Cómo te has sentido?</label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {FEELINGS.map((f) => {
                      const Icon = f.icon;
                      const isSelected = feeling === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFeeling(f.id)}
                          className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition-all ${
                            isSelected
                              ? f.color + ' ring-2 ring-cyan-400 shadow-md shadow-cyan-500/10'
                              : 'bg-zinc-800/40 border-zinc-700/50 text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
                          }`}
                        >
                          <Icon className="w-6 h-6 mb-2" />
                          <span className="text-xs font-semibold">{f.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes Input */}
                <div>
                  <label htmlFor="feedback-notes" className="block text-sm font-semibold text-zinc-300 mb-2">
                    Notas para tu py-entrenador (Opcional)
                  </label>
                  <textarea
                    id="feedback-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Ej: Sensaciones espectaculares en las series de carrera, pero algo cargado de isquios..."
                    className="w-full p-4.5 text-sm text-white placeholder-zinc-500 border rounded-2xl bg-zinc-800/50 border-zinc-700/80 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 text-sm font-bold text-black transition-all rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 shadow-lg shadow-cyan-500/20 flex items-center justify-center disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    'Enviar Evaluación a mi py-entrenador'
                  )}
                </button>
              </>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
