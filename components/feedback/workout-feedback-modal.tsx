'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, Smile, Frown, ThumbsUp, Moon, Activity } from 'lucide-react';
import { completeWorkoutWithFeedback } from '@/app/(app)/dashboard/actions';

interface WorkoutFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutId: string;
  workoutTitle: string;
}

const FEELINGS = [
  { id: 'excelente', label: 'Excelente', icon: Smile, color: 'text-bike bg-bike/10 border-bike/30' },
  { id: 'buena', label: 'Buena', icon: ThumbsUp, color: 'text-swim bg-swim/10 border-swim/30' },
  { id: 'fatigado', label: 'Fatigado', icon: AlertTriangle, color: 'text-warning bg-warning/10 border-warning/30' },
  { id: 'lesionado', label: 'Lesionado', icon: Frown, color: 'text-run bg-run/10 border-run/30' }
];

const SLEEP_QUALITY = [
  { id: 'mala', label: 'Mala ( <6h )', color: 'text-run border-run/30 hover:bg-run/10' },
  { id: 'regular', label: 'Regular ( 6-7h )', color: 'text-warning border-warning/30 hover:bg-warning/10' },
  { id: 'buena', label: 'Buena ( 7-8h )', color: 'text-bike border-bike/30 hover:bg-bike/10' },
];

const PAIN_LEVELS = [
  { id: 'ninguno', label: 'Ninguno', color: 'text-bike border-bike/30 hover:bg-bike/10' },
  { id: 'ligero', label: 'Ligera molestia', color: 'text-warning border-warning/30 hover:bg-warning/10' },
  { id: 'fuerte', label: 'Dolor fuerte', color: 'text-run border-run/30 hover:bg-run/10' },
];

export function WorkoutFeedbackModal({ isOpen, onClose, workoutId, workoutTitle }: WorkoutFeedbackModalProps) {
  const [rpe, setRpe] = useState<number>(5);
  const [feeling, setFeeling] = useState<string>('buena');
  const [sleep, setSleep] = useState<string>('buena');
  const [pain, setPain] = useState<string>('ninguno');
  const [intensityAdherence, setIntensityAdherence] = useState<string>('clavado');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmitting = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await completeWorkoutWithFeedback(
        workoutId,
        rpe,
        feeling,
        intensityAdherence,
        pain !== 'ninguno',
        notes
      );
      
      if (result.aiAdjusted) {
        setSuccessMessage(result.aiMessage || '¡Feedback registrado! La IA ha adaptado tus próximas sesiones.');
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 4000);
      } else {
        setSuccessMessage('¡Feedback registrado y entrenamiento completado!');
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error guardando feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRpeColor = (score: number) => {
    if (score <= 3) return 'bg-bike/20 text-bike border-bike/40';
    if (score <= 6) return 'bg-swim/20 text-swim border-swim/40';
    if (score <= 8) return 'bg-warning/20 text-warning border-warning/40';
    return 'bg-run/20 text-run border-run/40';
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
          className="relative w-full max-w-lg overflow-hidden border rounded-3xl bg-surface-app/90 border-border-subtle shadow-elevated backdrop-blur-xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border-subtle/80 sticky top-0 bg-surface-app/90 backdrop-blur-xl z-10">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-text-primary">Evaluación Post-Entrenamiento</h3>
              <p className="text-sm text-text-muted mt-1">{workoutTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 transition-colors rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover"
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
                <CheckCircle className="w-16 h-16 text-bike mb-4 animate-bounce" />
                <p className="text-lg font-semibold text-text-primary">{successMessage}</p>
              </motion.div>
            ) : (
              <>
                {errorMessage && (
                  <div className="p-4 text-sm border rounded-2xl bg-run/10 border-run/30 text-run">
                    {errorMessage}
                  </div>
                )}

                {/* RPE Selector */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-text-muted">Esfuerzo Percibido (RPE 1-10)</label>
                    <span className="text-xs font-medium text-swim">{getRpeLabel(rpe)}</span>
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
                              ? getRpeColor(num) + ' scale-105 ring-2 ring-swim'
                              : 'bg-surface-hover/50 border-border-default text-text-muted hover:border-border-default hover:text-text-muted'
                          }`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-[11px] text-text-secondary font-medium px-1">
                    <span>1 - Muy Suave</span>
                    <span>5 - Moderado</span>
                    <span>10 - Extremo</span>
                  </div>
                </div>

                {/* Feeling Selector */}
                <div>
                  <label className="block text-sm font-semibold text-text-muted mb-3">¿Cómo te has sentido hoy?</label>
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
                              ? f.color + ' ring-2 ring-swim'
                              : 'bg-surface-hover/40 border-border-default text-text-muted hover:bg-surface-hover/80 hover:text-text-muted'
                          }`}
                        >
                          <Icon className="w-6 h-6 mb-2" />
                          <span className="text-xs font-semibold">{f.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  {/* Sleep Selector */}
                  <div>
                    <label className="text-sm font-semibold text-text-muted mb-3 flex items-center gap-2">
                      <Moon className="w-4 h-4 text-swim" /> Descanso Previo
                    </label>
                    <div className="flex flex-col gap-2">
                      {SLEEP_QUALITY.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSleep(s.id)}
                          className={`text-xs font-semibold py-2 px-3 rounded-xl border text-left transition-all ${
                            sleep === s.id ? s.color + ' ring-1 ring-current bg-surface-hover/80' : 'text-text-secondary border-border-subtle hover:border-border-default'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pain Selector */}
                  <div>
                    <label className="text-sm font-semibold text-text-muted mb-3 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-run" /> Molestias / Dolor
                    </label>
                    <div className="flex flex-col gap-2">
                      {PAIN_LEVELS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPain(p.id)}
                          className={`text-xs font-semibold py-2 px-3 rounded-xl border text-left transition-all ${
                            pain === p.id ? p.color + ' ring-1 ring-current bg-surface-hover/80' : 'text-text-secondary border-border-subtle hover:border-border-default'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Intensity Adherence Selector */}
                <div>
                  <label className="block text-sm font-semibold text-text-muted mb-3">¿Cumpliste las zonas de intensidad?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'suave', label: 'Más suave', emoji: '📉' },
                      { id: 'clavado', label: 'Clavado', emoji: '🎯' },
                      { id: 'fuerte', label: 'Más fuerte', emoji: '📈' }
                    ].map((item) => {
                      const isSelected = intensityAdherence === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setIntensityAdherence(item.id)}
                          className={`py-2.5 px-3 border rounded-xl flex items-center justify-center gap-1.5 text-xs transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-swim text-swim bg-swim/10 font-bold scale-102 ring-2 ring-swim' 
                              : 'bg-surface-hover/40 border-border-default text-text-muted hover:bg-surface-hover hover:text-text-muted'
                          }`}
                        >
                          <span>{item.emoji}</span>
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* AI Week Adjustment (Added per user request to be in every training) */}
                <div className="pt-2">
                  <label className="block text-sm font-semibold text-text-muted mb-2">¿Necesitas ajustar el resto de la semana?</label>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                      type="button"
                      onClick={() => setNotes(prev => (prev ? prev + '\n' : '') + 'Noto poca carga. Por favor, añádeme más volumen general.')}
                      className="border border-border-default bg-surface-hover/40 text-xs py-2.5 px-3 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-colors text-text-muted hover:bg-surface-hover hover:text-text-muted"
                    >
                      📈 Poco volumen
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotes(prev => (prev ? prev + '\n' : '') + 'Siento demasiada fatiga. Por favor, reduce el volumen general de la semana.')}
                      className="border border-border-default bg-surface-hover/40 text-xs py-2.5 px-3 rounded-xl font-medium flex items-center justify-center gap-1.5 transition-colors text-text-muted hover:bg-surface-hover hover:text-text-muted"
                    >
                      📉 Demasiada carga
                    </button>
                  </div>
                </div>

                {/* Notes Input */}
                <div>
                  <label htmlFor="feedback-notes" className="block text-sm font-semibold text-text-muted mb-2">
                    Notas adicionales / Instrucciones para la IA
                  </label>
                  <textarea
                    id="feedback-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Ej: Sensaciones espectaculares en las series..."
                    className="w-full p-3 text-sm text-text-primary placeholder-text-muted border rounded-2xl bg-surface-hover/50 border-border-default focus:outline-none focus:ring-2 focus:ring-swim/50 focus:border-swim transition-all resize-none"
                  />
                </div>

                {/* Nutrition Reminder */}
                <div className="p-3 text-xs border rounded-xl bg-swim/10 border-swim/30 text-swim flex items-center gap-2 mt-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-swim" />
                  <p><strong>Nutrición Post-Entreno:</strong> Recuerda revisar tus macros y recuperar líquidos en la pestaña de Nutrición.</p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 text-sm font-bold text-white transition-all rounded-2xl bg-swim hover:bg-swim/90 flex items-center justify-center disabled:opacity-50 mt-4"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
