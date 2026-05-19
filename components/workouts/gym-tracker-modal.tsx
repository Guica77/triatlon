'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Timer, Minus, Plus, Dumbbell, ShieldAlert } from 'lucide-react';

interface GymTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutTitle: string;
}

export function GymTrackerModal({ isOpen, onClose, workoutTitle }: GymTrackerModalProps) {
  const [currentExercise, setCurrentExercise] = React.useState(0);
  const [weight, setWeight] = React.useState(20);
  const [reps, setReps] = React.useState(10);
  const [restTime, setRestTime] = React.useState(0);
  const [isResting, setIsResting] = React.useState(false);

  const exercises = [
    { name: 'Sentadilla Búlgara', target: '3 x 10', recomendedWeight: 24, lastLift: 20 },
    { name: 'Peso Muerto Rumano', target: '3 x 8', recomendedWeight: 60, lastLift: 60 },
    { name: 'Dominadas Asistidas', target: '3 x F', recomendedWeight: -10, lastLift: -15 },
  ];

  const exercise = exercises[currentExercise];

  // Timer para descanso
  React.useEffect(() => {
    let interval: any;
    if (isResting && restTime > 0) {
      interval = setInterval(() => setRestTime(prev => prev - 1), 1000);
    } else if (restTime === 0 && isResting) {
      setIsResting(false);
    }
    return () => clearInterval(interval);
  }, [isResting, restTime]);

  const handleCompleteSet = () => {
    setIsResting(true);
    setRestTime(90); // 90 segundos de descanso por defecto
  };

  const handleNextExercise = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(prev => prev + 1);
      setWeight(exercises[currentExercise + 1].lastLift);
      setIsResting(false);
    } else {
      onClose(); // Terminar el entreno
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-zinc-950/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="w-full max-w-md bg-zinc-900 sm:rounded-2xl border-t sm:border border-zinc-800 shadow-2xl h-[90vh] sm:h-auto flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900 rounded-t-2xl">
            <div>
              <p className="text-xs text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5" /> Modo Gimnasio
              </p>
              <h3 className="text-lg font-bold text-zinc-100">{workoutTitle}</h3>
            </div>
            <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-zinc-800 h-1.5">
            <div 
              className="bg-purple-500 h-1.5 transition-all duration-500" 
              style={{ width: `${((currentExercise + 1) / exercises.length) * 100}%` }} 
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center space-y-8 relative">
            
            <div className="text-center w-full">
              <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-widest">
                Ejercicio {currentExercise + 1} de {exercises.length}
              </p>
              <h2 className="text-3xl font-black text-white leading-tight mb-2">
                {exercise.name}
              </h2>
              <p className="text-sm text-zinc-400">Objetivo: <strong className="text-zinc-200">{exercise.target}</strong> repeticiones</p>
            </div>

            {/* Ajuste de Peso y Reps */}
            <div className="w-full p-6 bg-zinc-950/50 rounded-3xl border border-zinc-800/80 space-y-6">
              
              <div className="flex flex-col items-center justify-center">
                <p className="text-xs text-zinc-500 uppercase font-bold mb-3 tracking-widest">Peso Actual (kg)</p>
                <div className="flex items-center gap-6">
                  <button onClick={() => setWeight(w => w - 2.5)} className="w-12 h-12 flex items-center justify-center bg-zinc-800 rounded-full hover:bg-zinc-700 text-zinc-300">
                    <Minus className="w-6 h-6" />
                  </button>
                  <span className="text-6xl font-black text-white w-28 text-center tabular-nums">{weight}</span>
                  <button onClick={() => setWeight(w => w + 2.5)} className="w-12 h-12 flex items-center justify-center bg-zinc-800 rounded-full hover:bg-zinc-700 text-zinc-300">
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
                {weight > exercise.lastLift && (
                  <p className="text-xs text-green-400 mt-4 flex items-center gap-1 font-bold">
                    ▲ +{weight - exercise.lastLift}kg desde tu última sesión
                  </p>
                )}
              </div>

            </div>

            {/* Rest Timer Overlay */}
            <AnimatePresence>
              {isResting && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute inset-0 bg-zinc-900/95 backdrop-blur-md flex flex-col items-center justify-center z-10 rounded-xl"
                >
                  <Timer className="w-12 h-12 text-purple-400 animate-pulse mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">Tiempo de Descanso</h3>
                  <div className="text-7xl font-black text-purple-400 tabular-nums">
                    {Math.floor(restTime / 60)}:{(restTime % 60).toString().padStart(2, '0')}
                  </div>
                  <button 
                    onClick={() => setIsResting(false)}
                    className="mt-8 px-6 py-3 bg-zinc-800 text-white rounded-full font-bold hover:bg-zinc-700 transition"
                  >
                    Saltar Descanso
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-zinc-900 border-t border-zinc-800 pb-8 sm:pb-4 space-y-3">
            
            <div className="flex items-center justify-between px-2 pb-2">
              <span className="text-xs text-zinc-500 font-medium flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-zinc-500" />
                No llegues al fallo. Deja 1-2 RIR.
              </span>
            </div>

            <button 
              onClick={handleCompleteSet}
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-lg rounded-xl shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-6 h-6" /> Completar Serie
            </button>
            <button 
              onClick={handleNextExercise}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-sm rounded-xl transition-all"
            >
              Siguiente Ejercicio ➔
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
