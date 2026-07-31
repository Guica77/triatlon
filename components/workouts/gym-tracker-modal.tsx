'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Timer, Minus, Plus, Dumbbell, ShieldAlert, Zap, Activity, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { getStrengthExercisesForUser, logStrengthSet } from '@/app/(app)/dashboard/strength-actions';

interface GymTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutTitle: string;
  workoutId?: string;
}

const StyledDiv = React.forwardRef<HTMLDivElement, any>(({ styleProps, ...props }, ref) => 
  React.createElement('div', { ref, style: styleProps, ...props })
);
StyledDiv.displayName = 'StyledDiv';

export function GymTrackerModal({ isOpen, onClose, workoutTitle, workoutId }: GymTrackerModalProps) {
  const [exercises, setExercises] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  
  const [currentExercise, setCurrentExercise] = React.useState(0);
  const [weight, setWeight] = React.useState(20);
  const [reps, setReps] = React.useState(10);
  const [rir, setRir] = React.useState(2);
  const [restTime, setRestTime] = React.useState(0);
  const [isResting, setIsResting] = React.useState(false);
  const [currentSet, setCurrentSet] = React.useState(1);

  React.useEffect(() => {
    async function loadData() {
      if (isOpen) {
        setIsLoading(true);
        const data = await getStrengthExercisesForUser();
        setExercises(data);
        if (data.length > 0) {
          setWeight(data[0].lastLift || 20);
          setReps(data[0].targetReps || 10);
        }
        setIsLoading(false);
      }
    }
    loadData();
  }, [isOpen]);

  const exercise = exercises[currentExercise];

  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isResting && restTime > 0) {
      interval = setInterval(() => setRestTime(prev => prev - 1), 1000);
    } else if (restTime === 0 && isResting) {
      setTimeout(() => setIsResting(false), 0);
    }
    return () => clearInterval(interval);
  }, [isResting, restTime]);

  const handleCompleteSet = async () => {
    if (isSaving || !workoutId || !exercise) return;
    setIsSaving(true);
    
    // Save to DB
    await logStrengthSet(workoutId, exercise.id, currentSet, weight, reps, rir);
    
    setIsSaving(false);

    if (currentSet < exercise.targetSets) {
      setCurrentSet(prev => prev + 1);
      setIsResting(true);
      setRestTime(90);
    } else {
      handleNextExercise();
    }
  };

  const handleNextExercise = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(prev => prev + 1);
      setCurrentSet(1);
      setWeight(exercises[currentExercise + 1].lastLift || 20);
      setReps(exercises[currentExercise + 1].targetReps || 10);
      setRir(2);
      setIsResting(true);
      setRestTime(120); // Longer rest between exercises
    } else {
      onClose(); // Terminar el entreno
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          className="w-full max-w-md bg-[#121214] sm:rounded-[2rem] border-t sm:border border-border-subtle shadow-elevated h-[95vh] sm:h-auto flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-border-subtle/80 flex justify-between items-center bg-[#121214] z-10 sticky top-0">
            <div>
              <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-1">
                <Dumbbell className="w-3.5 h-3.5" /> Companion de Fuerza
              </p>
              <h3 className="text-base font-bold text-text-primary truncate max-w-[250px]">{workoutTitle}</h3>
            </div>
            <button title="Cerrar" aria-label="Cerrar" onClick={onClose} className="p-2 bg-surface-hover/80 rounded-full text-text-muted hover:text-text-primary transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
              <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
                <p className="text-sm font-bold text-text-muted">Cargando tu progreso 1RM...</p>
              </div>
            </div>
          ) : !exercise ? (
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
              <p className="text-sm text-text-secondary font-bold">No se encontraron ejercicios en la base de datos.</p>
            </div>
          ) : (
            <>
              {/* Progress Bar */}
              <div className="w-full bg-surface-card h-1">
                <StyledDiv 
                  className="bg-purple-500 h-1 transition-all duration-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" 
                  styleProps={{ width: `${((currentExercise + (currentSet - 1) / exercise.targetSets) / exercises.length) * 100}%` }} 
                />
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto pb-6 flex flex-col relative">
                
                {/* Exercise Image Banner */}
                <div className="relative w-full h-48 sm:h-56 shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-[#121214]/60 to-transparent z-10" />
                  <Image src={exercise.img} alt={exercise.name} fill className="object-cover" />
                  
                  <div className="absolute bottom-4 left-6 z-20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-md bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30 uppercase tracking-wider backdrop-blur-md">
                        Ejercicio {currentExercise + 1} de {exercises.length}
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-surface-hover/80 text-text-muted text-[10px] font-bold border border-border-default uppercase tracking-wider backdrop-blur-md">
                        Serie {currentSet} de {exercise.targetSets}
                      </span>
                    </div>
                    <h2 className="text-3xl font-black text-text-primary leading-tight drop-shadow-md">
                      {exercise.name}
                    </h2>
                  </div>
                </div>

                <div className="px-6 space-y-6 pt-2">
                  
                  {/* Ajuste de Peso y Reps (Grid) */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Weight */}
                    <div className="p-4 bg-surface-card/80 rounded-3xl border border-border-subtle/80 flex flex-col items-center">
                      <p className="text-[10px] text-text-secondary uppercase font-bold mb-3 tracking-widest flex items-center gap-1">
                        <Dumbbell className="w-3 h-3" /> Peso (kg)
                      </p>
                      <div className="flex items-center justify-between w-full">
                        <button title="Reducir peso" aria-label="Reducir peso" onClick={() => setWeight(w => Math.max(0, w - 2.5))} className="w-10 h-10 flex items-center justify-center bg-surface-hover rounded-full hover:bg-surface-card text-text-muted transition-colors shrink-0">
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="text-3xl font-black text-text-primary tabular-nums tracking-tighter">{weight}</span>
                        <button title="Aumentar peso" aria-label="Aumentar peso" onClick={() => setWeight(w => w + 2.5)} className="w-10 h-10 flex items-center justify-center bg-surface-hover rounded-full hover:bg-surface-card text-text-muted transition-colors shrink-0">
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      {weight > exercise.lastLift && (
                        <p className="text-[10px] text-bike mt-2 font-bold bg-bike/10 px-2 py-0.5 rounded-full">
                          +{weight - exercise.lastLift}kg vs anterior
                        </p>
                      )}
                    </div>

                    {/* Reps */}
                    <div className="p-4 bg-surface-card/80 rounded-3xl border border-border-subtle/80 flex flex-col items-center">
                      <p className="text-[10px] text-text-secondary uppercase font-bold mb-3 tracking-widest flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Repeticiones
                      </p>
                      <div className="flex items-center justify-between w-full">
                        <button title="Reducir repeticiones" aria-label="Reducir repeticiones" onClick={() => setReps(r => Math.max(1, r - 1))} className="w-10 h-10 flex items-center justify-center bg-surface-hover rounded-full hover:bg-surface-card text-text-muted transition-colors shrink-0">
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="text-3xl font-black text-text-primary tabular-nums tracking-tighter">{reps}</span>
                        <button title="Aumentar repeticiones" aria-label="Aumentar repeticiones" onClick={() => setReps(r => r + 1)} className="w-10 h-10 flex items-center justify-center bg-surface-hover rounded-full hover:bg-surface-card text-text-muted transition-colors shrink-0">
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-text-secondary mt-2 font-medium">
                        Objetivo: {exercise.targetReps}
                      </p>
                    </div>
                  </div>

                  {/* RIR Selector */}
                  <div className="p-5 bg-surface-card/80 rounded-3xl border border-border-subtle/80 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-text-muted uppercase font-bold tracking-widest flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-warning" /> Esfuerzo (RIR)
                      </label>
                      <span className="text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-full">Autorregulación</span>
                    </div>
                    
                    <div className="flex gap-2">
                      {[0, 1, 2, 3, 4].map((num) => (
                        <button
                          key={num}
                          onClick={() => setRir(num)}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                            rir === num 
                              ? num <= 1 ? 'bg-run/20 text-run border-run/40 ring-1 ring-run/50' 
                                : num === 2 ? 'bg-warning/20 text-warning border-warning/40 ring-1 ring-warning/50'
                                : 'bg-bike/20 text-bike border-bike/40 ring-1 ring-bike/50'
                              : 'bg-surface-hover/50 text-text-secondary border-border-default hover:bg-surface-hover'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-between text-[9px] text-text-secondary px-1 font-medium">
                      <span>0 (Fallo)</span>
                      <span>1-2 (Óptimo)</span>
                      <span>4+ (Fácil)</span>
                    </div>
                  </div>

                </div>

                {/* Rest Timer Overlay (Glassmorphism) */}
                <AnimatePresence>
                  {isResting && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute inset-0 bg-black/80 backdrop-blur-lg flex flex-col items-center justify-center z-30"
                    >
                      <div className="relative">
                        <svg className="w-48 h-48 transform -rotate-90">
                          <circle cx="96" cy="96" r="90" className="stroke-border-subtle" strokeWidth="8" fill="none" />
                          <circle 
                            cx="96" cy="96" r="90" 
                            className="stroke-purple-500 transition-all duration-1000 linear" 
                            strokeWidth="8" 
                            fill="none"
                            strokeDasharray="565"
                            strokeDashoffset={565 - (565 * restTime) / (currentSet === 1 ? 120 : 90)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <Timer className="w-6 h-6 text-purple-400 mb-1" />
                          <div className="text-4xl font-black text-text-primary tabular-nums tracking-tighter">
                            {Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-text-muted mt-6 mb-1">Recuperación</h3>
                      <p className="text-sm text-text-secondary mb-8">Siguiente: {currentSet < exercise.targetSets ? `Serie ${currentSet + 1}` : exercises[currentExercise + 1]?.name || 'Fin'}</p>
                      
                      <button 
                        onClick={() => setIsResting(false)}
                        className="px-8 py-3.5 bg-surface-hover text-text-primary rounded-full font-bold hover:bg-surface-card transition-all text-sm  border border-border-default"
                      >
                        Saltar Descanso
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

              {/* Footer Actions */}
              <div className="p-5 bg-[#121214] border-t border-border-subtle/80 z-20">
                <button 
                  onClick={handleCompleteSet}
                  disabled={isSaving}
                  className="w-full py-4.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black text-base rounded-2xl shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} 
                  {currentSet < exercise.targetSets ? `Completar Serie ${currentSet}` : 'Completar Ejercicio'}
                </button>
                <div className="mt-3 flex justify-center">
                  <span className="text-[10px] text-text-secondary font-medium flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Mantén la técnica. La calidad importa más que el peso.
                  </span>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
