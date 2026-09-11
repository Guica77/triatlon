'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Sparkles, X, BrainCircuit, Activity, Zap, Droplets, ArrowRight } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';

export interface GeneratedWorkout {
  date: string;
  sport_type: 'natacion' | 'ciclismo' | 'carrera' | 'fuerza' | 'descanso';
  title: string;
  duration_minutes: number;
  tss: number;
  description: string;
}

interface AIWorkoutGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (workouts: GeneratedWorkout[]) => void;
  currentDate: string;
  initialPrompt?: string;
}

export function AIWorkoutGenerator({ isOpen, onClose, onGenerate, currentDate, initialPrompt = '' }: AIWorkoutGeneratorProps) {
  const [prompt, setPrompt] = React.useState(initialPrompt);
  const [error, setError] = React.useState('');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generationStep, setGenerationStep] = React.useState(0);

  const steps = [
    "Analizando historial de carga (CTL/ATL)...",
    "Evaluando estado de recuperación (HRV)...",
    "Distribuyendo cargas de Umbral y Z2...",
    "Generando bloques de entrenamiento..."
  ];

  React.useEffect(() => {
    if (!isOpen) {
      setPrompt(initialPrompt);
      setIsGenerating(false);
      setGenerationStep(0);
    } else {
      setPrompt(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('La generación automática de sesiones todavía no está disponible. Puedes crear una sesión desde el calendario.');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isGenerating ? onClose : undefined}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg bg-surface-elevated border border-border-default rounded-3xl shadow-elevated overflow-hidden z-10"
          >
            {/* Header */}
            <div className="px-6 py-4 flex justify-between items-center border-b border-border-subtle bg-surface-hover">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  Planificador semanal
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-accent/20 text-accent border border-accent/30">Beta</span>
                </h3>
              </div>
              {!isGenerating && (
                <button
                  onClick={onClose}
                  title="Cerrar"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-6">
              {isGenerating ? (
                <div className="py-8 flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-surface-hover border border-border-default rounded-full flex items-center justify-center relative z-10">
                      <BrainCircuit className="w-8 h-8 text-accent animate-pulse" />
                    </div>
                    {/* Orbiting rings */}
                    <div className="absolute inset-[-10px] border border-accent/25 rounded-full animate-[spin_3s_linear_infinite]" />
                    <div className="absolute inset-[-20px] border border-accent/15 rounded-full animate-[spin_4s_linear_infinite_reverse]" />
                  </div>

                  <div className="text-center space-y-2">
                    <h4 className="text-lg font-bold text-text-primary">Construyendo tu semana</h4>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={generationStep}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-sm text-accent font-semibold"
                      >
                        {steps[generationStep]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleGenerate} className="space-y-6">
                  {error && <p role="alert" className="text-sm text-danger">{error}</p>}
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Describe tu objetivo para esta semana. Nuestro motor analizará tu fatiga actual (CTL/ATL) y generará una planificación óptima.
                  </p>

                  <div className="space-y-3">
                    <textarea
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      placeholder="Ej: Quiero una semana enfocada en el sector de ciclismo con unos 1000m de desnivel acumulado, y un rodaje largo de carrera a pie el domingo. El viernes necesito descansar."
                      className="w-full h-32 px-4 py-3 bg-surface-card border border-border-default focus:border-accent rounded-xl text-sm text-text-primary placeholder:text-text-muted outline-none resize-none custom-scrollbar"
                      autoFocus
                    />

                    {/* Quick prompts */}
                    <div className="flex gap-2 flex-wrap">
                      <button type="button" onClick={() => setPrompt("Semana de recuperación activa (Z1/Z2) bajando volumen al 50%.")} className="text-[10px] px-2.5 py-1.5 rounded-full bg-surface-hover text-text-secondary hover:text-text-primary hover:bg-border-default transition cursor-pointer font-medium">Recuperación</button>
                      <button type="button" onClick={() => setPrompt("Bloque de carga fuerte: Priorizar series anaeróbicas en carrera y V02Max en bici.")} className="text-[10px] px-2.5 py-1.5 rounded-full bg-surface-hover text-text-secondary hover:text-text-primary hover:bg-border-default transition cursor-pointer font-medium">Carga Máxima</button>
                      <button type="button" onClick={() => setPrompt("Semana Tapering pre-competición. Bajada de volumen, activación neuromuscular.")} className="text-[10px] px-2.5 py-1.5 rounded-full bg-surface-hover text-text-secondary hover:text-text-primary hover:bg-border-default transition cursor-pointer font-medium">Tapering (Pre-Carrera)</button>
                    </div>
                  </div>

                  <AnimatedButton
                    type="submit"
                    variant="primary"
                    disabled={!prompt.trim()}
                    className="w-full py-3.5 !bg-accent hover:!bg-lime-400 !text-bg-deep font-extrabold rounded-xl flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Preparar calendario
                  </AnimatedButton>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
