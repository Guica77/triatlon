'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleWorkoutStatus, updateWorkoutStatus, completeWorkoutWithFeedback } from '@/app/(app)/dashboard/actions';
import { ProCard } from '@/components/ui/pro-card';
import { adaptWorkoutDescription } from '@/lib/zones-utility';
import { AnimatedButton } from '@/components/ui/animated-button';
import { ZoneBadge } from '@/components/ui/zone-badge';
import { 
  Flame, 
  Target, 
  Activity, 
  RefreshCw, 
  Wind, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Circle, 
  Info, 
  ShoppingBag, 
  Dumbbell, 
  Heart, 
  Timer, 
  Smartphone,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

interface WorkoutStep {
  type: 'Warmup' | 'Interval' | 'Rest' | 'Repeat' | 'Cooldown';
  stepOrder: number;
  repeatCount?: number;
  endCondition: 'LAP_BUTTON' | 'TIME' | 'DISTANCE';
  endConditionValue?: number;
  targetType: 'POWER' | 'HEART_RATE' | 'PACE' | 'OPEN';
  targetValueOne?: number;
  targetValueTwo?: number;
  workoutSteps?: WorkoutStep[];
}

interface WorkoutDetailClientProps {
  workout: {
    id: string;
    scheduled_date: string;
    status: string;
    auto_adjusted?: boolean | null;
    adjustment_reason?: string | null;
    training_sessions: {
      sport_type: string;
      duration_min: number;
      description: string;
      day_name: string;
      gear_needed?: string[] | null;
    };
    workout_feedback?: any[] | null;
  };
  structured: {
    workoutName: string;
    sport: string;
    description: string;
    workoutSegments: {
      segmentOrder: number;
      sport: string;
      workoutSteps: WorkoutStep[];
    }[];
  } | null;
  profile: any;
}

const sportBgColors: Record<string, string> = {
  natacion: 'from-[#0ea5e9]/20 to-[#0ea5e9]/5 border-[#0ea5e9]/30',
  ciclismo: 'from-[#10b981]/20 to-[#10b981]/5 border-[#10b981]/30',
  carrera: 'from-[#f97316]/20 to-[#f97316]/5 border-[#f97316]/30',
  fuerza: 'from-[#a855f7]/20 to-[#a855f7]/5 border-[#a855f7]/30',
};

const sportTextColors: Record<string, string> = {
  natacion: 'text-[#38bdf8]',
  ciclismo: 'text-[#34d399]',
  carrera: 'text-[#fb923c]',
  fuerza: 'text-[#c084fc]',
};

const sportGlows: Record<string, string> = {
  natacion: 'bg-[#0ea5e9]/10',
  ciclismo: 'bg-[#10b981]/10',
  carrera: 'bg-[#f97316]/10',
  fuerza: 'bg-[#a855f7]/10',
};

export function WorkoutDetailClient({ workout, structured, profile }: WorkoutDetailClientProps) {
  const router = useRouter();
  const [status, setStatus] = React.useState(workout.status);
  const [loading, setLoading] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const session = workout.training_sessions;

  const durationMin = React.useMemo(() => {
    let dur = session.duration_min || 0;
    if (workout.auto_adjusted) {
      if (workout.adjustment_reason === 'lesion') {
        dur = Math.round(dur * 0.5);
      } else if (workout.adjustment_reason === 'adherencia') {
        dur = Math.round(dur * 0.85);
      } else {
        dur = Math.round(dur * 0.75);
      }
    }
    return dur;
  }, [session.duration_min, workout.auto_adjusted, workout.adjustment_reason]);

  const adaptedDescription = React.useMemo(() => {
    let desc = session.description || '';
    if (workout.auto_adjusted) {
      if (workout.adjustment_reason === 'lesion') {
        desc = `[AJUSTE DE IA: PREVENCIÓN DE LESIONES] Sesión reducida al 50%. Entrena estrictamente en Zona 1 (recuperación activa) y detén la sesión inmediatamente si sientes cualquier molestia o pinchazo. Objetivo original:\n${desc}`;
      } else if (workout.adjustment_reason === 'adherencia') {
        desc = `[AJUSTE DE IA: ADHERENCIA] Carga reducida un 15% para consolidar ritmos. Prioriza terminar la sesión cómodamente en lugar de forzar zonas altas. Objetivo original:\n${desc}`;
      } else {
        desc = `[AJUSTE DE IA: AJUSTE POR FATIGA] Duración principal reducida un 25%. Mantén un esfuerzo moderado y cómodo en Zona 1-2. Objetivo original:\n${desc}`;
      }
    }
    return desc;
  }, [session.description, workout.auto_adjusted, workout.adjustment_reason]);
  const isCompleted = status === 'completed';
  const isMissed = status === 'missed';

  // Estados de feedback subjetivo
  const initialFeedback = workout.workout_feedback && Array.isArray(workout.workout_feedback)
    ? workout.workout_feedback[0]
    : (workout.workout_feedback || null);

  const [hasFeedback, setHasFeedback] = React.useState(!!initialFeedback);
  const [showFeedbackForm, setShowFeedbackForm] = React.useState(workout.status === 'completed' && !initialFeedback);
  const [submittingFeedback, setSubmittingFeedback] = React.useState(false);

  // Campos del cuestionario
  const [rpe, setRpe] = React.useState(initialFeedback?.rpe_score || 5);
  const [feeling, setFeeling] = React.useState(initialFeedback?.feeling || 'buena');
  const [intensityAdherence, setIntensityAdherence] = React.useState(initialFeedback?.intensity_adherence || 'clavado');
  const [painLocalized, setPainLocalized] = React.useState(!!initialFeedback?.pain_localized);
  const [notes, setNotes] = React.useState(initialFeedback?.notes || '');

  const handleToggle = async () => {
    if (loading) return;
    
    // Si queremos marcar como completado, en lugar de completarlo directamente, abrimos el formulario de feedback
    if (!isCompleted) {
      setShowFeedbackForm(true);
      return;
    }

    // Si ya está completado y queremos desmarcarlo
    setLoading(true);
    const prevStatus = status;
    const nextStatus = 'pending';
    setStatus(nextStatus);
    setHasFeedback(false);
    setShowFeedbackForm(false);

    try {
      await toggleWorkoutStatus(workout.id, prevStatus);
      router.refresh();
    } catch (e) {
      setStatus(prevStatus);
      setHasFeedback(!!initialFeedback);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingFeedback) return;
    setSubmittingFeedback(true);
    setLoading(true);

    try {
      await completeWorkoutWithFeedback(
        workout.id,
        rpe,
        feeling,
        intensityAdherence,
        painLocalized,
        notes
      );
      setHasFeedback(true);
      setShowFeedbackForm(false);
      setStatus('completed');
      setToastMsg('¡Entrenamiento valorado y completado con éxito! 🚀');
      setTimeout(() => setToastMsg(null), 5000);
      router.refresh();
    } catch (err: any) {
      console.error('Error al guardar feedback:', err);
      setToastMsg('⚠️ Error al registrar feedback.');
      setTimeout(() => setToastMsg(null), 5000);
    } finally {
      setSubmittingFeedback(false);
      setLoading(false);
    }
  };

  const handleToggleMissed = async () => {
    if (loading) return;
    setLoading(true);
    const prevStatus = status;
    const nextStatus = isMissed ? 'pending' : 'missed';
    setStatus(nextStatus);

    try {
      await updateWorkoutStatus(workout.id, nextStatus as any);
      router.refresh();
    } catch (e) {
      setStatus(prevStatus);
    } finally {
      setLoading(false);
    }
  };

  // Helper formatting functions
  const formatTarget = (targetType: string, val1?: number, val2?: number) => {
    if (!val1 && !val2) return 'Libre / Sensaciones';
    if (targetType === 'POWER') {
      return `${val1}W - ${val2}W`;
    }
    if (targetType === 'HEART_RATE') {
      return `${val1} - ${val2} ppm`;
    }
    if (targetType === 'PACE') {
      const formatPace = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = Math.round(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
      };
      return `${formatPace(val1!)} - ${formatPace(val2!)} min/km`;
    }
    return 'Libre';
  };

  const formatCondition = (condition: string, value?: number) => {
    if (condition === 'LAP_BUTTON') return 'Hasta pulsar botón LAP';
    if (condition === 'TIME') {
      const mins = Math.floor(value! / 60);
      const secs = value! % 60;
      return secs > 0 ? `${mins}m ${secs}s` : `${mins} min`;
    }
    if (condition === 'DISTANCE') {
      return `${value} metros`;
    }
    return '';
  };

  const renderStepIcon = (type: string) => {
    switch (type) {
      case 'Warmup':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'Interval':
        return <Target className="w-4 h-4 text-cyan-400" />;
      case 'Rest':
        return <Info className="w-4 h-4 text-emerald-400" />;
      case 'Repeat':
        return <RefreshCw className="w-4 h-4 text-purple-400" />;
      case 'Cooldown':
        return <Wind className="w-4 h-4 text-blue-400" />;
      default:
        return <Activity className="w-4 h-4 text-zinc-400" />;
    }
  };

  const renderStepCard = (step: WorkoutStep, index: number) => {
    if (step.type === 'Repeat') {
      return (
        <div key={index} className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-3">
          <div className="flex items-center justify-between border-b border-purple-500/10 pb-2">
            <span className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
              {renderStepIcon('Repeat')}
              Repetir Bloque ({step.repeatCount} veces)
            </span>
          </div>
          <div className="space-y-3 pl-4 border-l border-purple-500/10">
            {step.workoutSteps?.map((subStep, subIdx) => (
              <div key={subIdx} className="p-3 rounded-lg bg-zinc-950/40 border border-zinc-850 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  {renderStepIcon(subStep.type)}
                  <div>
                    <p className="font-semibold text-white capitalize">{subStep.type === 'Interval' ? 'Intervalo de Carga' : 'Recuperación'}</p>
                    <p className="text-[10px] text-zinc-500">{formatCondition(subStep.endCondition, subStep.endConditionValue)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded bg-zinc-900 text-zinc-300 font-bold border border-zinc-800">
                    Objetivo: {formatTarget(subStep.targetType, subStep.targetValueOne, subStep.targetValueTwo)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div key={index} className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between flex-wrap gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center border border-zinc-200">
            {renderStepIcon(step.type)}
          </div>
          <div>
            <p className="font-semibold text-foreground capitalize">
              {step.type === 'Warmup' ? 'Calentamiento' : step.type === 'Cooldown' ? 'Vuelta a la Calma' : 'Intervalo'}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {formatCondition(step.endCondition, step.endConditionValue)}
            </p>
          </div>
        </div>
        <div>
          <span className="px-3 py-1 rounded-lg bg-zinc-100 text-foreground font-bold border border-zinc-200 text-xs">
            {formatTarget(step.targetType, step.targetValueOne, step.targetValueTwo)}
          </span>
        </div>
      </div>
    );
  };

  const stepsList = structured?.workoutSegments?.[0]?.workoutSteps || [];
  const gearNeeded = session.gear_needed || [];
  const virtualGarage = profile?.virtual_garage || [];
  const missingGear = gearNeeded.filter(g => !virtualGarage.includes(g));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Toast notifications */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-semibold shadow-lg shadow-orange-950/20 max-w-sm"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Column (Main steps and details) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Hero Card */}
        <div className={`p-6 rounded-2xl bg-gradient-to-br border shadow-sm relative overflow-hidden ${sportBgColors[session.sport_type] || 'from-zinc-50 to-white border-zinc-200'}`}>
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none ${sportGlows[session.sport_type] || 'bg-transparent'}`} />
          
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-zinc-500/10 text-[9px] font-bold uppercase tracking-widest text-zinc-600 border border-zinc-200">
              {session.day_name}
            </span>
            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${sportTextColors[session.sport_type] || 'text-foreground'}`}>
              • {session.sport_type}
            </span>
            {workout.auto_adjusted && (
              workout.adjustment_reason === 'lesion' ? (
                <span className="px-2 py-0.5 rounded bg-red-950/40 border border-red-550/30 text-red-400 text-[9px] font-bold flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                  <span>IA: Prevención de Lesión</span>
                </span>
              ) : workout.adjustment_reason === 'adherencia' ? (
                <span className="px-2 py-0.5 rounded bg-blue-950/40 border border-blue-550/30 text-blue-400 text-[9px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5 text-blue-400" />
                  <span>IA: Ajuste de Carga</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-550/30 text-amber-400 text-[9px] font-bold flex items-center gap-1">
                  <Flame className="w-2.5 h-2.5 text-amber-400" />
                  <span>IA: Ajuste por Fatiga</span>
                </span>
              )
            )}
          </div>

          <h2 className="text-2xl font-bold text-foreground capitalize leading-tight mb-4">
            {session.sport_type === 'fuerza' ? 'Fuerza y Acondicionamiento' : `Sesión de ${session.sport_type}`}
          </h2>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-black/5">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Duración</p>
              <p className="text-base font-bold text-foreground mt-0.5">{durationMin} min</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Tipo</p>
              <p className="text-base font-bold text-foreground mt-0.5 capitalize">{session.sport_type}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Estado</p>
              <p className={`text-base font-bold mt-0.5 flex items-center gap-1 capitalize ${
                isCompleted ? 'text-green-400' : isMissed ? 'text-red-400' : 'text-amber-400'
              }`}>
                {isCompleted ? 'Completado' : isMissed ? 'Saltado' : 'Pendiente'}
              </p>
            </div>
          </div>
        </div>

        {/* Cuestionario de Feedback Adaptativo */}
        <AnimatePresence mode="wait">
          {showFeedbackForm && (
            <motion.div
              key="feedback-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <ProCard className="p-6 border-cyan-500/30 bg-zinc-900/90 shadow-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none bg-cyan-500/5" />
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Valoración del Entrenamiento
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowFeedbackForm(false);
                    }}
                    className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>

                <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                  {/* 1. RPE Slider / Buttons */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                      Esfuerzo Percibido (RPE): <span className="text-white text-sm font-bold ml-1">{rpe}/10</span>
                    </label>
                    
                    {/* RPE Buttons Grid */}
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-1">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => {
                        let btnClass = "bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-850";
                        if (rpe === val) {
                          if (val <= 3) btnClass = "bg-green-500/25 border-green-400 text-green-300 scale-105 font-bold shadow-lg shadow-green-950/20";
                          else if (val <= 7) btnClass = "bg-yellow-500/25 border-yellow-400 text-yellow-300 scale-105 font-bold shadow-lg shadow-yellow-950/20";
                          else btnClass = "bg-red-500/25 border-red-400 text-red-300 scale-105 font-bold shadow-lg shadow-red-950/20";
                        }
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setRpe(val)}
                            className={`py-2 px-1 text-xs border rounded-lg text-center transition-all cursor-pointer duration-150 ${btnClass}`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                    
                    <p className="text-[10px] text-zinc-500 italic mt-1.5">
                      {rpe <= 2 && "Suave: Conversación fluida y muy cómodo."}
                      {rpe >= 3 && rpe <= 4 && "Moderado: Nivel de esfuerzo bajo, respiración controlada."}
                      {rpe >= 5 && rpe <= 6 && "Algo Duro: Comienza la fatiga, requiere concentración."}
                      {rpe >= 7 && rpe <= 8 && "Duro: Esfuerzo alto, respiración muy agitada."}
                      {rpe >= 9 && "Extenuante: Esfuerzo límite, casi imposible de mantener."}
                    </p>
                  </div>

                  {/* 2. Sensaciones (Feeling) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                      ¿Cómo te has sentido en general?
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {[
                        { id: 'excelente', label: 'Excelente', emoji: '😃', color: 'border-green-500 text-green-300 bg-green-500/5' },
                        { id: 'buena', label: 'Bueno', emoji: '🙂', color: 'border-cyan-500 text-cyan-300 bg-cyan-500/5' },
                        { id: 'fatigado', label: 'Fatigado', emoji: '🥱', color: 'border-yellow-500 text-yellow-300 bg-yellow-500/5' },
                        { id: 'lesionado', label: 'Lesión / Dolor', emoji: '🤕', color: 'border-red-500 text-red-300 bg-red-500/5' }
                      ].map((item) => {
                        const isSelected = feeling === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setFeeling(item.id)}
                            className={`py-2 px-3 border rounded-xl flex items-center justify-center gap-1.5 text-xs transition-all cursor-pointer ${
                              isSelected 
                                ? `${item.color} font-bold scale-102` 
                                : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-300"
                            }`}
                          >
                            <span className="text-base">{item.emoji}</span>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Adherencia a la Intensidad */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                      ¿Cumpliste las zonas de intensidad indicadas?
                    </label>
                    <div className="grid grid-cols-3 gap-2 pt-1">
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
                            className={`py-2 px-3 border rounded-xl flex items-center justify-center gap-1.5 text-xs transition-all cursor-pointer ${
                              isSelected 
                                ? "border-cyan-500 text-cyan-300 bg-cyan-500/5 font-bold scale-102" 
                                : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-300"
                            }`}
                          >
                            <span>{item.emoji}</span>
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Dolor Localizado */}
                  <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-4 h-4 ${painLocalized ? 'text-red-400' : 'text-zinc-500'}`} />
                        <div>
                          <p className="text-xs font-bold text-white">¿Dolor o molestia localizada inusual?</p>
                          <p className="text-[10px] text-zinc-500">Excluye la fatiga muscular común.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label="Alternar dolor localizado"
                        title="Alternar dolor localizado"
                        onClick={() => setPainLocalized(!painLocalized)}
                        className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                          painLocalized ? 'bg-red-500/80' : 'bg-zinc-800'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                          painLocalized ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {painLocalized && (
                      <div className="pt-2 border-t border-red-500/10 text-[10px] text-red-300 leading-relaxed">
                        ⚠️ **Alerta activa:** Esto avisará a tu entrenador y activará la reducción preventora de carga de la IA.
                      </div>
                    )}
                  </div>

                  {/* 5. Comentarios */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 flex justify-between">
                      <span>Comentarios y notas (opcional)</span>
                      <span className="text-[10px] text-zinc-550 font-normal">{notes.length}/1000</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value.slice(0, 1000))}
                      placeholder="¿Cómo fue el viento, la temperatura? ¿Tuviste problemas mecánicos o de nutrición? Cuéntaselo al entrenador..."
                      rows={3}
                      className="w-full rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 p-3 text-xs focus:outline-none focus:border-cyan-500/50 resize-none font-normal"
                    />
                  </div>

                  {/* Submit Button */}
                  <AnimatedButton
                    variant="primary"
                    type="submit"
                    disabled={loading}
                    className="w-full justify-center py-5 text-xs font-bold shadow-lg shadow-cyan-500/10"
                  >
                    <span>Guardar Valoración y Completar</span>
                  </AnimatedButton>
                </form>
              </ProCard>
            </motion.div>
          )}

          {hasFeedback && !showFeedbackForm && (
            <motion.div
              key="feedback-summary"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
            >
              <ProCard className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    Valoración de la Sesión
                  </h3>
                  <button 
                    type="button" 
                    onClick={() => setShowFeedbackForm(true)}
                    className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer"
                  >
                    Editar Valoración
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Esfuerzo (RPE)</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{rpe}/10</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Sensación</p>
                    <p className="text-sm font-bold text-foreground mt-0.5 capitalize flex items-center gap-1">
                      {feeling === 'excelente' && '😃 Excelente'}
                      {feeling === 'buena' && '🙂 Bueno'}
                      {feeling === 'fatigado' && '🥱 Fatigado'}
                      {feeling === 'lesionado' && '🤕 Lesionado'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Adherencia</p>
                    <p className="text-sm font-bold text-foreground mt-0.5 capitalize">
                      {intensityAdherence === 'suave' && '📉 Más suave'}
                      {intensityAdherence === 'clavado' && '🎯 Clavado'}
                      {intensityAdherence === 'fuerte' && '📈 Más fuerte'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Dolor muscular</p>
                    <p className={`text-sm font-bold mt-0.5 ${painLocalized ? 'text-red-400' : 'text-green-400'}`}>
                      {painLocalized ? 'Sí 🔴' : 'No 🟢'}
                    </p>
                  </div>
                </div>

                {notes && (
                  <div className="pt-2 border-t border-zinc-850">
                    <p className="text-[10px] text-zinc-550 uppercase font-bold tracking-wider mb-1">Notas registradas</p>
                    <p className="text-xs text-zinc-300 italic bg-zinc-950/20 p-2.5 rounded-lg border border-zinc-850/50 leading-relaxed font-normal">
                      {notes}
                    </p>
                  </div>
                )}
              </ProCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Coaching Notes / Description */}
        <ProCard className="p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Info className="w-4 h-4 text-cyan-400" />
            Notas del Entrenador
          </h3>
          <p className="text-sm text-foreground leading-relaxed font-normal whitespace-pre-line">
            {adaptWorkoutDescription(adaptedDescription, session.sport_type, profile) || 'Sin notas descriptivas para este entrenamiento.'}
          </p>
        </ProCard>

        {/* Structured steps checklist */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Desglose Estructurado del Bloque
          </h3>
          
          <div className="space-y-3">
            {stepsList.length > 0 ? (
              stepsList.map((step, index) => renderStepCard(step, index))
            ) : (
              <ProCard className="p-6 text-center bg-zinc-50">
                <p className="text-sm text-zinc-500">Esta sesión no dispone de bloques de intervalos estructurados.</p>
                <p className="text-xs text-zinc-400 mt-1">Completa la sesión de forma continua basándote en la descripción.</p>
              </ProCard>
            )}
          </div>
        </div>

      </div>

      {/* Right Column (Sidebar details / zones / gear) */}
      <div className="space-y-6">
        
        {/* Actions panel */}
        <ProCard className="p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Acciones rápidas</h3>
          
          <div className="space-y-2">
            {!isCompleted && !isMissed && (
              <>
                <AnimatedButton 
                  variant="primary" 
                  className="w-full justify-center py-6 text-sm font-semibold shadow-lg shadow-primary/10"
                  onClick={handleToggle}
                  disabled={loading}
                >
                  <Circle className="w-4 h-4" />
                  <span>Completar Entrenamiento</span>
                </AnimatedButton>

                <AnimatedButton
                  variant="secondary"
                  className="w-full justify-center py-6 text-muted-foreground"
                  onClick={handleToggleMissed}
                  disabled={loading}
                >
                  <XCircle className="w-4 h-4 text-muted-foreground" />
                  <span>Saltar esta sesión</span>
                </AnimatedButton>
              </>
            )}

            {isCompleted && (
              <AnimatedButton 
                variant="secondary" 
                className="w-full justify-center py-6 text-sm font-semibold"
                onClick={handleToggle}
                disabled={loading}
              >
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-zinc-250">Completado (Desmarcar)</span>
              </AnimatedButton>
            )}

            {isMissed && (
              <AnimatedButton 
                variant="secondary" 
                className="w-full justify-center py-6 text-sm font-semibold border-red-500/20 bg-red-950/10 hover:bg-red-950/20 text-red-400"
                onClick={handleToggleMissed}
                disabled={loading}
              >
                <XCircle className="w-4 h-4 text-red-500" />
                <span>Restaurar sesión saltada</span>
              </AnimatedButton>
            )}

            {!isMissed && (
              <button
                className="w-full py-3.5 border border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50 flex items-center justify-center gap-2 rounded-xl text-xs font-bold shadow-lg shadow-orange-500/10 transition cursor-pointer"
                onClick={() => {
                  setToastMsg('📥 Descargando archivo .TCX para Garmin/Coros...');
                  window.open(`/api/workouts/export?workoutId=${workout.id}`, '_blank');
                  setTimeout(() => setToastMsg(null), 5000);
                }}
              >
                <Download className="w-4 h-4 text-orange-400 animate-bounce" />
                <span>Descargar archivo (.TCX)</span>
              </button>
            )}
          </div>
        </ProCard>

        {/* Gear Checklist */}
        <ProCard className="p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Material de Entrenamiento</h3>
          {gearNeeded.length > 0 ? (
            <div className="space-y-2 pt-1">
              {gearNeeded.map((gear, idx) => {
                const hasGear = virtualGarage.includes(gear);
                return (
                  <div key={idx} className="flex items-center justify-between text-xs py-1">
                    <span className="text-foreground font-medium">{gear}</span>
                    {hasGear ? (
                      <span className="text-[10px] text-green-600 font-semibold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">✓ En Garaje</span>
                    ) : (
                      <span className="text-[10px] text-orange-600 font-semibold bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">⚠️ Falta</span>
                    )}
                  </div>
                );
              })}

              {missingGear.length > 0 && (
                <div className="pt-3 border-t border-border">
                  <span className="w-full py-2 text-muted-foreground text-[11px] font-bold rounded-lg flex items-center justify-center gap-1">
                    Recuerda conseguir este material antes de la sesión.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No se especifica equipamiento especial.</p>
          )}
        </ProCard>

        {/* Physiological Zones guidance */}
        <ProCard className="p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Zonas de Intensidad</h3>
          <div className="space-y-3 pt-1 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 font-bold border border-border text-[10px]">Z1</span>
              <div>
                <p className="font-semibold text-foreground">Recuperación Pasiva</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Fácil, conversación fluida. Ritmo regenerativo post-intervalos.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 font-bold border border-green-500/20 text-[10px]">Z2</span>
              <div>
                <p className="font-semibold text-foreground">Resistencia Aeróbica Base</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Esfuerzo moderado y sostenible. Base de la carga de volumen.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 font-bold border border-cyan-500/20 text-[10px]">Z3</span>
              <div>
                <p className="font-semibold text-foreground">Tempo / Ritmo Medio</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Exigente pero aeróbico. Ritmo de competición media distancia.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 font-bold border border-red-500/20 text-[10px]">Z4</span>
              <div>
                <p className="font-semibold text-foreground">Umbral Lactato / Series</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Zonas de series intensas. Mejora del VO2Máx y tolerancia al lactato.</p>
              </div>
            </div>
          </div>
        </ProCard>

      </div>

    </div>
  );
}
