'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitCoachFeedback } from '@/app/(app)/feedback/feedback-actions';
import { Send, CheckCircle2, AlertCircle, FileText, Settings, User } from 'lucide-react';
import { ProCard } from '@/components/ui/pro-card';

export function CoachSuggestionForm() {
  const [feedbackType, setFeedbackType] = useState<string>('platform_improvement');
  const [content, setContent] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value.slice(0, 2000);
    setContent(text);
    requestAnimationFrame(adjustTextareaHeight);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await submitCoachFeedback({
      feedback_type: feedbackType,
      content
    });

    setIsSubmitting(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      setSuccessMessage('¡Sugerencia enviada con éxito al equipo de desarrollo!');
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      setTimeout(() => setSuccessMessage(null), 4000);
    }
  };

  const categories = [
    { id: 'platform_improvement', label: 'Mejora App', icon: Settings },
    { id: 'plan_adjustment', label: 'Ajuste Plan', icon: FileText },
    { id: 'athlete_review', label: 'Revisión Atleta', icon: User }
  ];

  return (
    <ProCard className="bg-surface-card/60 border-border-subtle/80 space-y-6 shadow-elevated relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-swim to-swim" />
      
      <form onSubmit={handleSubmit} className="space-y-5">
        
        <AnimatePresence mode="wait">
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              className="p-4 bg-bike/10 border border-bike/25 rounded-2xl flex items-center gap-3 text-bike text-sm font-semibold "
            >
              <CheckCircle2 className="w-5 h-5 text-bike flex-shrink-0" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              className="p-4 bg-run/10 border border-run/25 rounded-2xl flex items-center gap-3 text-run text-sm font-semibold "
            >
              <AlertCircle className="w-5 h-5 text-run flex-shrink-0" />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tipo de Sugerencia */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted mb-2.5">
            Tipo de Sugerencia
          </label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((t) => {
              const Icon = t.icon;
              const isSelected = feedbackType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFeedbackType(t.id)}
                  className={`py-3 px-3 rounded-xl text-xs font-bold transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.97] border flex flex-col sm:flex-row items-center justify-center gap-1.5 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-swim/50 ${
                    isSelected
                      ? 'bg-swim/15 border-swim/70 text-swim'
                      : 'bg-surface-hover/40 border-border-subtle/80 text-text-muted fine-hover:border-border-default fine-hover:text-text-muted'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-swim' : 'text-text-secondary'}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenido / Texto */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="suggestion-content" className="block text-xs font-bold uppercase tracking-wider text-text-muted">
              Detalle de la Propuesta / Mejora
            </label>
            <span className={`text-[10px] font-mono transition-colors duration-200 ${content.length >= 1900 ? 'text-run font-bold' : 'text-text-secondary'}`}>
              {content.length} / 2000
            </span>
          </div>
          <textarea
            id="suggestion-content"
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder={
              feedbackType === 'platform_improvement'
                ? 'Ej: Propongo añadir soporte para sensores de temperatura corporal Core en la vista de analíticas...'
                : feedbackType === 'plan_adjustment'
                ? 'Ej: Ajustar el volumen aeróbico general para asimilar la carga de entrenamiento...'
                : 'Ej: Evaluar el rendimiento del atleta en la transición de carrera...'
            }
            className="w-full p-4 text-sm text-text-primary placeholder-text-muted border rounded-2xl bg-surface-hover/30 border-border-subtle/80 focus:outline-none focus:ring-2 focus:ring-swim/40 focus:border-swim/60 transition-[background-color,border-color,box-shadow,color] duration-150 ease-out resize-none min-height-[100px] overflow-hidden leading-relaxed"
          />
          <p className="text-[10px] text-text-secondary italic">
            Escribe sin límites de espacio. La caja de texto se expandirá de forma automática.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="w-full py-4 text-sm font-bold text-white transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-out active:scale-[0.97] rounded-2xl bg-swim fine-hover:bg-swim/90 flex items-center justify-center gap-2 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-swim/50 disabled:cursor-not-allowed select-none cursor-pointer"
        >
          {isSubmitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
