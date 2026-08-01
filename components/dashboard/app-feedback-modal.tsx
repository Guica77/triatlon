'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    const isDismissedThisSession = sessionStorage.getItem(`app-feedback-dismissed-${daysUsed}`);
    if (!isDismissedThisSession) {
      const timer = setTimeout(() => setIsOpen(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [daysUsed]);

  // Render only after mount (needed for createPortal to have document.body)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleDismiss = () => {
    sessionStorage.setItem(`app-feedback-dismissed-${daysUsed}`, 'true');
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      const result = await submitAppFeedback({ days_used: daysUsed, rating, comments });
      if (result.success) {
        setIsSubmitted(true);
        setTimeout(() => setIsOpen(false), 2000);
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

  if (!mounted || !isOpen) return null;

  // Render via portal at body level so no stacking context (PageTransition,
  // Dialog portal, etc.) can trap the z-index or block clicks.
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 180 }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-surface-elevated border border-border-default shadow-elevated p-6 sm:p-8 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {!isSubmitted && (
          <button
            type="button"
            onClick={handleDismiss}
            title="Cerrar"
            className="absolute top-4 right-4 z-20 text-text-muted hover:text-text-primary p-1.5 rounded-xl bg-surface-hover hover:bg-border-default border border-border-default transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {isSubmitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-swim/10 border border-swim/20 flex items-center justify-center mx-auto text-swim">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">¡Muchas gracias!</h3>
            <p className="text-xs text-text-secondary max-w-xs mx-auto">
              Tus comentarios nos ayudan a perfeccionar tus planes y la experiencia autónoma para tu Ironman.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-swim/15 text-swim text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-swim/25">
                  Feedback de {daysUsed} Días
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-text-primary tracking-tight">
                ¿Cómo ha sido tu experiencia hasta ahora?
              </h3>
              <p className="text-xs text-text-secondary">
                Llevas una semana entrenando con nuestra IA. Cuéntanos qué tal te sientes con los planes de doble sesión y la intensidad.
              </p>
            </div>

            {/* Rating Selector */}
            <div className="space-y-3 bg-surface-hover border border-border-default rounded-2xl p-4 text-center">
              <div className="flex justify-center items-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    title={`Calificar con ${star} estrellas`}
                    className="relative z-10 text-text-muted hover:scale-110 transition duration-150 cursor-pointer"
                  >
                    <Star
                      className={`w-8 h-8 stroke-[1.5] ${
                        star <= (hoverRating || rating)
                          ? 'fill-swim stroke-swim'
                          : 'stroke-text-muted'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-semibold text-swim min-h-[16px]">
                {getSatisfactionLabel(hoverRating || rating)}
              </p>
            </div>

            {/* Text Comments */}
            <div className="space-y-2">
              <label htmlFor="comments" className="text-xs font-bold text-text-secondary">
                ¿Qué te gustaría añadir o qué podemos mejorar?
              </label>
              <textarea
                id="comments"
                rows={3}
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Ej. Me encantan las sesiones de carrera a pie, pero la natación me gustaría con más volumen..."
                className="relative z-10 w-full bg-surface-card border border-border-default focus:border-swim focus:outline-none rounded-2xl p-4 text-xs text-text-primary placeholder:text-text-muted resize-none transition font-medium pointer-events-auto"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDismiss}
                className="relative z-10 flex-1 py-3.5 rounded-2xl bg-surface-hover border border-border-default hover:bg-border-default hover:text-text-primary text-text-secondary text-xs font-bold transition cursor-pointer text-center"
              >
                Recordar más tarde
              </button>
              <button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                className="relative z-10 flex-1 py-3.5 rounded-2xl bg-swim hover:bg-swim/90 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>{isSubmitting ? 'Enviando...' : 'Enviar'}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>,
    document.body
  );
}
