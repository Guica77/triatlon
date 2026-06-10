'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Star } from 'lucide-react';
import { submitAppFeedback } from '@/app/(app)/feedback/feedback-actions';

interface AppFeedbackModalProps {
  daysUsed: number;
}

export function AppFeedbackModal({ daysUsed }: AppFeedbackModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [comments, setComments] = useState('');
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    // Verificar si el usuario ya pospuso la encuesta en esta sesión del navegador
    const isDismissedThisSession = sessionStorage.getItem(`app-feedback-dismissed-${daysUsed}`);
    if (!isDismissedThisSession) {
      // Retrasar 2.5 segundos para no agobiar al atleta nada más entrar
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [daysUsed]);

  const handleDismiss = () => {
    sessionStorage.setItem(`app-feedback-dismissed-${daysUsed}`, 'true');
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      const result = await submitAppFeedback({
        days_used: daysUsed,
        rating,
        comments
      });

      if (result.success) {
        setIsSubmitted(true);
        // Cerrar después de mostrar el mensaje de agradecimiento
        setTimeout(() => {
          setIsOpen(false);
        }, 2000);
      } else {
        alert(`Error al enviar: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error inesperado al enviar el feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSatisfactionLabel = (score: number) => {
    if (score === 1) return 'Insatisfecho 😠';
    if (score === 2) return 'Regular 😕';
    if (score === 3) return 'Satisfecho 😐';
    if (score === 4) return 'Muy contento 🙂';
    if (score === 5) return '¡Me encanta! 😍';
    return 'Selecciona tu valoración';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl bg-zinc-950/90 border border-cyan-500/20 shadow-[0_0_50px_-12px_rgba(6,182,212,0.15)] p-6 sm:p-8 backdrop-blur-xl"
          >
            {/* Ambient Background Glows */}
            <div className="absolute -left-16 -top-16 w-32 h-32 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -right-16 -bottom-16 w-32 h-32 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            {/* Close Button */}
            {!isSubmitted && (
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 p-1 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400">
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </div>
                <h3 className="text-lg font-bold text-white">¡Muchas gracias!</h3>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  Tus comentarios nos ayudan a perfeccionar tus planes y la experiencia autónoma para tu Ironman.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                      Feedback de {daysUsed} Días
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-white tracking-tight">
                    ¿Cómo ha sido tu experiencia hasta ahora?
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Llevas una semana entrenando con nuestra IA. Cuéntanos qué tal te sientes con los planes de doble sesión y la intensidad.
                  </p>
                </div>

                {/* Rating Selector (Stars) */}
                <div className="space-y-3 bg-zinc-900/40 border border-zinc-900 rounded-2xl p-4 text-center">
                  <div className="flex justify-center items-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="text-zinc-600 hover:scale-115 transition duration-150 cursor-pointer"
                      >
                        <Star
                          className={`w-8 h-8 stroke-[1.5] ${
                            star <= (hoverRating || rating)
                              ? 'fill-cyan-400 stroke-cyan-400'
                              : 'stroke-zinc-500'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-cyan-400 min-h-[16px]">
                    {getSatisfactionLabel(hoverRating || rating)}
                  </p>
                </div>

                {/* Text Comments */}
                <div className="space-y-2">
                  <label htmlFor="comments" className="text-xs font-bold text-zinc-400">
                    ¿Qué te gustaría añadir o qué podemos mejorar?
                  </label>
                  <textarea
                    id="comments"
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Ej. Me encantan las sesiones de carrera a pie, pero la natación me gustaría con más volumen..."
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-cyan-500 focus:outline-none rounded-2xl p-4 text-xs text-white placeholder-zinc-500 resize-none transition shadow-inner font-medium"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="flex-1 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white text-zinc-400 text-xs font-bold transition cursor-pointer text-center"
                  >
                    Recordar más tarde
                  </button>
                  <button
                    type="submit"
                    disabled={rating === 0 || isSubmitting}
                    className="flex-1 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-extrabold flex items-center justify-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    <span>{isSubmitting ? 'Enviando...' : 'Enviar'}</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
