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
}

export function AIWorkoutGenerator({ isOpen, onClose, onGenerate, currentDate }: AIWorkoutGeneratorProps) {
  const [prompt, setPrompt] = React.useState('');
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
      setPrompt('');
      setIsGenerating(false);
      setGenerationStep(0);
    }
  }, [isOpen]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);

    // Simulate AI thinking steps
    for (let i = 0; i < steps.length; i++) {
      setGenerationStep(i);
      await new Promise(res => setTimeout(res, 800 + Math.random() * 500));
    }

    // Generate Mock Week based on the current date (Monday to Sunday)
    const baseDate = new Date(currentDate);
    const day = baseDate.getDay();
    const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const startOfWeek = new Date(baseDate.setDate(diff));

    const mockWorkouts: GeneratedWorkout[] = [
      {
        date: new Date(new Date(startOfWeek).setDate(startOfWeek.getDate())).toISOString().split('T')[0], // Monday
        sport_type: 'descanso',
        title: 'Descanso Activo',
        duration_minutes: 0,
        tss: 0,
        description: 'Día libre de carga para asimilar el fin de semana. Prioriza estiramientos suaves o foam roller.'
      },
      {
        date: new Date(new Date(startOfWeek).setDate(startOfWeek.getDate() + 1)).toISOString().split('T')[0], // Tuesday
        sport_type: 'carrera',
        title: 'Series de Umbral Anaeróbico',
        duration_minutes: 60,
        tss: 65,
        description: 'Calentamiento 15min Z1. Bloque principal: 5 x 1000m en Z4 (Umbral) recuperando 90s trotando. Enfriamiento 10min Z1.'
      },
      {
        date: new Date(new Date(startOfWeek).setDate(startOfWeek.getDate() + 2)).toISOString().split('T')[0], // Wednesday
        sport_type: 'natacion',
        title: 'Técnica y Fuerza en Agua',
        duration_minutes: 45,
        tss: 40,
        description: 'Calentamiento 400m libre. Bloque: 10 x 100m con palas y pullboy enfocado en tracción. Enfriamiento 200m estilos.'
      },
      {
        date: new Date(new Date(startOfWeek).setDate(startOfWeek.getDate() + 3)).toISOString().split('T')[0], // Thursday
        sport_type: 'ciclismo',
        title: 'Rodillo: Sweet Spot',
        duration_minutes: 75,
        tss: 80,
        description: 'Sesión indoor. Calentamiento progresivo. 3 bloques de 12 minutos al 88-92% FTP (Sweet Spot), cadencia 90rpm. Rec. 4min Z1.'
      },
      {
        date: new Date(new Date(startOfWeek).setDate(startOfWeek.getDate() + 4)).toISOString().split('T')[0], // Friday
        sport_type: 'fuerza',
        title: 'Fuerza Core y Piernas',
        duration_minutes: 40,
        tss: 30,
        description: 'Circuito de gimnasio: Sentadillas búlgaras, peso muerto rumano, planchas isométricas. Movilidad articular final.'
      },
      {
        date: new Date(new Date(startOfWeek).setDate(startOfWeek.getDate() + 5)).toISOString().split('T')[0], // Saturday
        sport_type: 'ciclismo',
        title: 'Tirada Larga Z2',
        duration_minutes: 180,
        tss: 140,
        description: 'Rodaje constante en Z2. Controla alimentación (60g CH/hora). Terreno con desnivel moderado.'
      },
      {
        date: new Date(new Date(startOfWeek).setDate(startOfWeek.getDate() + 6)).toISOString().split('T')[0], // Sunday
        sport_type: 'carrera',
        title: 'Transición Carrera Z2',
        duration_minutes: 90,
        tss: 95,
        description: 'Carrera suave en Z2. Puedes hacerlo después de la bici del sábado o como rodaje suelto. Ritmo conversacional.'
      }
    ];

    onGenerate(mockWorkouts);
    setIsGenerating(false);
    onClose();
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
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-lg bg-[#121214] border border-cyan-900/50 rounded-3xl shadow-2xl shadow-cyan-900/20 overflow-hidden z-10"
          >
            {/* Header */}
            <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-800/80 bg-gradient-to-r from-zinc-950/50 to-cyan-950/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Generador AI
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">Beta</span>
                </h3>
              </div>
              {!isGenerating && (
                <button 
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-6">
              {isGenerating ? (
                <div className="py-8 flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
                    <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center relative z-10">
                      <BrainCircuit className="w-8 h-8 text-cyan-400 animate-pulse" />
                    </div>
                    {/* Orbiting dots */}
                    <div className="absolute inset-[-10px] border border-cyan-500/20 rounded-full animate-[spin_3s_linear_infinite]" />
                    <div className="absolute inset-[-20px] border border-cyan-500/10 rounded-full animate-[spin_4s_linear_infinite_reverse]" />
                  </div>
                  
                  <div className="text-center space-y-2">
                    <h4 className="text-lg font-bold text-white">Construyendo tu semana</h4>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={generationStep}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-sm text-cyan-400 font-medium"
                      >
                        {steps[generationStep]}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleGenerate} className="space-y-6">
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Describe tu objetivo para esta semana. Nuestro motor analizará tu fatiga actual (CTL/ATL) y generará una planificación óptima.
                  </p>

                  <div className="space-y-3">
                    <textarea
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      placeholder="Ej: Quiero una semana enfocada en el sector de ciclismo con unos 1000m de desnivel acumulado, y un rodaje largo de carrera a pie el domingo. El viernes necesito descansar."
                      className="w-full h-32 px-4 py-3 bg-zinc-900 border border-zinc-800 focus:border-cyan-500 rounded-xl text-sm text-white placeholder-zinc-600 outline-none resize-none custom-scrollbar"
                      autoFocus
                    />
                    
                    {/* Quick prompts */}
                    <div className="flex gap-2 flex-wrap">
                      <button type="button" onClick={() => setPrompt("Semana de recuperación activa (Z1/Z2) bajando volumen al 50%.")} className="text-[10px] px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition">Recuperación</button>
                      <button type="button" onClick={() => setPrompt("Bloque de carga fuerte: Priorizar series anaeróbicas en carrera y V02Max en bici.")} className="text-[10px] px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition">Carga Máxima</button>
                      <button type="button" onClick={() => setPrompt("Semana Tapering pre-competición. Bajada de volumen, activación neuromuscular.")} className="text-[10px] px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition">Tapering (Pre-Carrera)</button>
                    </div>
                  </div>

                  <AnimatedButton
                    type="submit"
                    variant="primary"
                    disabled={!prompt.trim()}
                    className="w-full py-3.5 !bg-cyan-500 hover:!bg-cyan-400 !text-black font-extrabold rounded-xl shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generar Calendario AI
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
