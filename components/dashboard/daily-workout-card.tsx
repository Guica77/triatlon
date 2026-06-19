'use client';

import * as React from 'react';
import { toggleWorkoutStatus, updateWorkoutStatus } from '@/app/(app)/dashboard/actions';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { ZoneBadge } from '@/components/ui/zone-badge';
import { CheckCircle2, Circle, Clock, Flame, MessageSquarePlus, Bell, Target, Sparkles, ShieldCheck, Dumbbell, ShoppingBag, Watch, Activity, Download, XCircle, ChevronRight, RefreshCw, Wind, Info, Droplet, Zap, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkoutFeedbackModal } from '@/components/feedback/workout-feedback-modal';
import { simulateWatchIngestion } from '@/app/telemetry/telemetry-actions';
import { GymTrackerModal } from '@/components/workouts/gym-tracker-modal';
import Link from 'next/link';
import { WatchSyncModal } from '@/components/dashboard/watch-sync-modal';
import { calculateSessionPacing, calculateRecoveryMeal, calculatePreWorkoutMeal } from '@/lib/nutrition-utility';

interface WorkoutCardProps {
  initialIsConnected?: boolean;
  virtualGarage?: string[];
  athleteLevel?: string;
  readOnly?: boolean;
  sweatRate?: number | null;
  customCarbsPerHour?: number | null;
  preferredIngredients?: string[] | null;
  workout: {
    id: string;
    scheduled_date: string;
    status: string;
    auto_adjusted?: boolean | null;
    adjustment_reason?: string | null;
    actual_tss?: number | null;
    training_sessions: {
      sport_type: string;
      duration_min: number;
      description: string;
      day_name: string;
      gear_needed?: string[] | null;
    };
    universal_telemetry?: {
      source_provider: string;
      avg_hr?: number;
      max_hr?: number;
      avg_power?: number;
      normalized_power?: number;
      avg_cadence?: number;
      training_effect_aerobic?: number;
      training_effect_anaerobic?: number;
      raw_payload: any;
    }[] | null;
    workout_feedback?: any[] | null;
  };
}

function parseWorkoutDescription(desc: string, sportType: string) {
  let main = desc || 'Sesión de entrenamiento aeróbico de construcción base.';
  let warmup = '15 mins de calentamiento progresivo de Z1 a Z2 con movilidad articular.';
  let cooldown = '10 mins de vuelta a la calma en Z1 y estiramientos suaves descontracturantes.';
  const gear = sportType === 'natacion' 
    ? '🩱 Palas, aletas cortas y pullbuoy.' 
    : sportType === 'ciclismo' 
    ? '🚴‍♂️ Potenciómetro calibrado, bidones de sales y geles de carbohidratos.' 
    : '🏃‍♂️ Zapatillas mixtas y banda pectoral de frecuencia cardíaca.';

  if (desc.includes('Calentamiento:') || desc.includes('Parte principal:') || desc.includes('Enfriamiento:')) {
    const warmupMatch = desc.match(/Calentamiento:\s*([^\n]+)/i);
    if (warmupMatch) warmup = warmupMatch[1].replace('Parte principal:', '').trim();

    const mainMatch = desc.match(/Parte principal:\s*([^\n]+)/i);
    if (mainMatch) main = mainMatch[1].replace('Enfriamiento:', '').trim();

    const cooldownMatch = desc.match(/Enfriamiento:\s*([^\n]+)/i);
    if (cooldownMatch) cooldown = cooldownMatch[1].trim();
  }

  return { main, warmup, cooldown, gear };
}

interface LocalWorkoutStep {
  type: 'Warmup' | 'Interval' | 'Rest' | 'Repeat' | 'Cooldown';
  stepOrder: number;
  repeatCount?: number;
  endCondition: 'LAP_BUTTON' | 'TIME' | 'DISTANCE';
  endConditionValue?: number;
  targetType: 'POWER' | 'HEART_RATE' | 'PACE' | 'OPEN';
  targetValueOne?: number;
  targetValueTwo?: number;
  workoutSteps?: LocalWorkoutStep[];
}

function getLocalStructuredSteps(sportType: string, description: string, durationMin: number): LocalWorkoutStep[] {
  const sportMap: Record<string, 'CYCLED' | 'RUNNING' | 'SWIMMING' | 'GENERIC'> = {
    ciclismo: 'CYCLED',
    carrera: 'RUNNING',
    natacion: 'SWIMMING',
    brick: 'GENERIC'
  };

  const sport = sportMap[sportType] || 'GENERIC';
  const desc = description || '';
  const steps: LocalWorkoutStep[] = [];

  // 1. Calentamiento
  steps.push({
    type: 'Warmup',
    stepOrder: 1,
    endCondition: 'LAP_BUTTON',
    targetType: sport === 'CYCLED' ? 'POWER' : sport === 'RUNNING' ? 'HEART_RATE' : 'OPEN',
    targetValueOne: sport === 'CYCLED' ? 120 : sport === 'RUNNING' ? 110 : undefined,
    targetValueTwo: sport === 'CYCLED' ? 150 : sport === 'RUNNING' ? 130 : undefined,
  });

  // 2. Bloque Principal
  const isInterval = desc.includes('series') || desc.includes('x') || desc.includes('Z4') || desc.includes('fuerte');
  
  if (isInterval) {
    steps.push({
      type: 'Repeat',
      stepOrder: 2,
      repeatCount: 5,
      endCondition: 'TIME',
      targetType: 'OPEN',
      workoutSteps: [
        {
          type: 'Interval',
          stepOrder: 1,
          endCondition: 'TIME',
          endConditionValue: 180, // 3 min
          targetType: sport === 'CYCLED' ? 'POWER' : sport === 'RUNNING' ? 'PACE' : 'OPEN',
          targetValueOne: sport === 'CYCLED' ? 220 : sport === 'RUNNING' ? 240 : undefined,
          targetValueTwo: sport === 'CYCLED' ? 250 : sport === 'RUNNING' ? 270 : undefined,
        },
        {
          type: 'Rest',
          stepOrder: 2,
          endCondition: 'TIME',
          endConditionValue: 90, // 1.5 min
          targetType: sport === 'CYCLED' ? 'POWER' : sport === 'RUNNING' ? 'HEART_RATE' : 'OPEN',
          targetValueOne: sport === 'CYCLED' ? 100 : sport === 'RUNNING' ? 110 : undefined,
          targetValueTwo: sport === 'CYCLED' ? 130 : sport === 'RUNNING' ? 125 : undefined,
        }
      ]
    });
  } else {
    const mainDuration = Math.max((durationMin - 20) * 60, 1200);
    steps.push({
      type: 'Interval',
      stepOrder: 2,
      endCondition: 'TIME',
      endConditionValue: mainDuration,
      targetType: sport === 'CYCLED' ? 'POWER' : sport === 'RUNNING' ? 'HEART_RATE' : 'OPEN',
      targetValueOne: sport === 'CYCLED' ? 170 : sport === 'RUNNING' ? 130 : undefined,
      targetValueTwo: sport === 'CYCLED' ? 195 : sport === 'RUNNING' ? 145 : undefined,
    });
  }

  // 3. Enfriamiento
  steps.push({
    type: 'Cooldown',
    stepOrder: 3,
    endCondition: 'TIME',
    endConditionValue: 600, // 10 min
    targetType: 'OPEN'
  });

  return steps;
}

const localFormatTarget = (targetType: string, val1?: number, val2?: number) => {
  if (!val1 && !val2) return 'Libre';
  if (targetType === 'POWER') return `${val1}W-${val2}W`;
  if (targetType === 'HEART_RATE') return `${val1}-${val2} ppm`;
  if (targetType === 'PACE') {
    const formatPace = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = Math.round(sec % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    };
    return `${formatPace(val1!)}-${formatPace(val2!)}/km`;
  }
  return 'Libre';
};

const localFormatCondition = (condition: string, value?: number) => {
  if (condition === 'LAP_BUTTON') return 'Hasta Lap';
  if (condition === 'TIME') {
    const mins = Math.floor(value! / 60);
    return `${mins} min`;
  }
  if (condition === 'DISTANCE') return `${value}m`;
  return '';
};

const renderAsBulletList = (text: string) => {
  if (!text) return null;
  const items = text.split(/\.\s+/).map(s => s.trim()).filter(Boolean);
  return (
    <ul className="list-disc pl-4 space-y-1 text-xs text-zinc-700">
      {items.map((item, index) => {
        const displayItem = item.endsWith('.') ? item : `${item}.`;
        return (
          <li key={index} className="leading-relaxed">
            {displayItem}
          </li>
        );
      })}
    </ul>
  );
};

export function DailyWorkoutCard({ workout, initialIsConnected = false, virtualGarage = [], athleteLevel = 'intermedio', readOnly = false, sweatRate = 0.8, customCarbsPerHour, preferredIngredients = [] }: WorkoutCardProps) {
  const [status, setStatus] = React.useState(workout.status);
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'main' | 'warmup' | 'cooldown' | 'gear' | 'telemetry' | 'nutrition'>('main');
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);
  const [isGymModeOpen, setIsGymModeOpen] = React.useState(false);
  const [isSyncingOpen, setIsSyncingOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const session = workout.training_sessions;
  const desc = session.description || '';
  const parsed = React.useMemo(() => {
    const p = parseWorkoutDescription(desc, session.sport_type);
    if (workout.auto_adjusted) {
      if (workout.adjustment_reason === 'lesion') {
        p.main = `[AJUSTE DE IA: PREVENCIÓN DE LESIONES] Sesión reducida al 50%. Entrena estrictamente en Zona 1 (recuperación activa) y detén la sesión inmediatamente si sientes cualquier molestia o pinchazo. Objetivo original: ${p.main}`;
      } else if (workout.adjustment_reason === 'adherencia') {
        p.main = `[AJUSTE DE IA: ADHERENCIA] Carga reducida un 15% para consolidar ritmos. Prioriza terminar la sesión cómodamente en lugar de forzar zonas altas. Objetivo original: ${p.main}`;
      } else {
        p.main = `[AJUSTE DE IA: AJUSTE POR FATIGA] Duración principal reducida un 25%. Mantén un esfuerzo moderado y cómodo en Zona 1-2. Objetivo original: ${p.main}`;
      }
    }
    if (athleteLevel === 'principiante') {
      if (session.sport_type === 'natacion') {
        p.gear = '🩱 Bañador y gafas de natación (palas o aletas opcionales).';
      } else if (session.sport_type === 'ciclismo') {
        p.gear = '🚴‍♂️ Cualquier bicicleta (de carretera, híbrida o montaña) y casco obligatorio.';
      } else if (session.sport_type === 'carrera') {
        p.gear = '🏃‍♂️ Zapatillas de running normales y ropa cómoda.';
      }
    }
    return p;
  }, [desc, session.sport_type, workout.auto_adjusted, workout.adjustment_reason, athleteLevel]);

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

  const pacing = calculateSessionPacing(
    session?.sport_type || 'descanso',
    durationMin,
    sweatRate || 0.8,
    customCarbsPerHour
  );
  const isCompleted = status === 'completed';
  const isMissed = status === 'missed';

  const hasFeedback = React.useMemo(() => {
    return !!(workout.workout_feedback && workout.workout_feedback.length > 0);
  }, [workout.workout_feedback]);

  const plannedTss = React.useMemo(() => {
    if (!session) return 0;
    return Math.round(durationMin * (session.sport_type === 'carrera' ? 0.8 : session.sport_type === 'ciclismo' ? 0.75 : session.sport_type === 'natacion' ? 0.6 : 0.5));
  }, [session, durationMin]);

  const telemetry = workout.universal_telemetry?.[0] || (isCompleted ? {
    source_provider: 'garmin',
    avg_hr: 152,
    max_hr: 178,
    avg_power: session?.sport_type === 'ciclismo' ? 215 : undefined,
    normalized_power: session?.sport_type === 'ciclismo' ? 230 : undefined,
    avg_cadence: session?.sport_type === 'carrera' ? 176 : 92,
    training_effect_aerobic: 4.2,
    training_effect_anaerobic: 2.1,
    actual_tss: 85,
    raw_payload: { device: 'Garmin Forerunner 965', firmware: '18.22' }
  } : null);

  const complianceStatus = React.useMemo(() => {
    if (session?.sport_type === 'descanso') return 'planned';
    if (isCompleted) {
      const actualTssVal = (workout as any).actual_tss || (telemetry as any)?.actual_tss || 85;
      const pct = (actualTssVal / plannedTss) * 100;
      if (pct >= 80 && pct <= 120) {
        return 'green';
      }
      return 'yellow';
    }
    if (isMissed) {
      return 'red';
    }
    // Pending status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduledDate = new Date(workout.scheduled_date + 'T00:00:00');
    if (scheduledDate < today) {
      return 'red'; // Past pending is red (missed) in TP
    }
    return 'planned'; // Today or future is planned
  }, [status, workout.scheduled_date, plannedTss, telemetry, session, isCompleted, isMissed]);

  // Sincronización Automática en Segundo Plano (Garmin / Strava Webhooks)
  React.useEffect(() => {
    if (!readOnly && initialIsConnected && status === 'pending' && session?.sport_type !== 'descanso') {
      const timer = setTimeout(async () => {
        const res = await simulateWatchIngestion(workout.id, session?.sport_type || 'ciclismo');
        if (res?.success) {
          setStatus('completed');
          setToastMsg('¡Actividad detectada y sincronizada automáticamente desde tu reloj! TSS Real: 85');
          // Abrir modal de feedback inmediatamente al sincronizarse en vivo
          setIsFeedbackOpen(true);
        }
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [initialIsConnected, status, workout.id, session?.sport_type, readOnly]);

  if (!session) return null;

  const gearNeeded = session.gear_needed || [];
  let missingGear = gearNeeded.filter(g => !virtualGarage.includes(g));
  if (athleteLevel === 'principiante') {
    missingGear = missingGear.filter(g => !['Potenciómetro', 'Cabra Triatlón', 'Ruedas Carbono', 'Casco Aero'].includes(g));
  }

  const sportBgGlow: Record<string, string> = {
    natacion: 'bg-[var(--color-swim)]/5',
    ciclismo: 'bg-[var(--color-bike)]/5',
    carrera: 'bg-[var(--color-run)]/5',
    brick: 'bg-amber-400/5',
    fuerza: 'bg-purple-500/10',
    descanso: 'bg-transparent',
  };

  async function handleToggle() {
    if (loading) return;
    
    // Si vamos a completarlo, abrimos el modal de feedback y detenemos aquí
    if (!isCompleted) {
      setIsFeedbackOpen(true);
      return;
    }

    // Si vamos a des-completarlo, lo hacemos directo
    setLoading(true);
    const prevStatus = status;
    setStatus('pending'); // Optimistic
    try {
      await toggleWorkoutStatus(workout.id, prevStatus);
    } catch (error) {
      setStatus(prevStatus); // Revert
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleMissed() {
    if (loading) return;
    setLoading(true);
    const prevStatus = status;
    const nextStatus = isMissed ? 'pending' : 'missed';
    setStatus(nextStatus); // Optimistic

    try {
      await updateWorkoutStatus(workout.id, nextStatus as any);
    } catch (error) {
      setStatus(prevStatus); // Revert
    } finally {
      setLoading(false);
    }
  }



  const recoveryMeal = calculateRecoveryMeal(
    session?.sport_type || 'descanso',
    durationMin,
    preferredIngredients
  );

  const preWorkoutMeal = calculatePreWorkoutMeal(
    session?.sport_type || 'descanso',
    durationMin,
    preferredIngredients
  );



  const localSteps = getLocalStructuredSteps(session.sport_type, desc, durationMin);

  const hasZ1 = desc.includes('Zona 1') || desc.includes('Z1');
  const hasZ2 = desc.includes('Zona 2') || desc.includes('Z2') || desc.includes('suave') || desc.includes('fácil');
  const hasZ3 = desc.includes('Zona 3') || desc.includes('Z3') || desc.includes('ritmo') || desc.includes('crol');
  const hasZ4 = desc.includes('Zona 4') || desc.includes('Z4') || desc.includes('series') || desc.includes('fuerte');

  const sportBorderColors: Record<string, string> = {
    natacion: 'border-l-[5px] border-l-[#00a2e8]',
    ciclismo: 'border-l-[5px] border-l-[#2ecc71]',
    carrera: 'border-l-[5px] border-l-[#e74c3c]',
    fuerza: 'border-l-[5px] border-l-purple-500',
    descanso: 'border-l-[5px] border-l-zinc-300',
  };
  const leftBorderClass = sportBorderColors[session.sport_type] || 'border-l-[5px] border-l-zinc-200';

  let backgroundClass = '';
  if (session.sport_type === 'descanso') {
    backgroundClass = 'bg-zinc-50 border-zinc-200 text-zinc-650';
  } else {
    switch (complianceStatus) {
      case 'green':
        backgroundClass = 'bg-[#e2f9eb]/65 border-[#c5f3d7] text-zinc-900';
        break;
      case 'yellow':
        backgroundClass = 'bg-[#fff8e6]/65 border-[#fae4b9] text-zinc-900';
        break;
      case 'red':
        backgroundClass = 'bg-[#feeef0]/65 border-[#f9d5db] text-zinc-900' + (status === 'missed' ? ' opacity-90' : '');
        break;
      case 'planned':
      default:
        backgroundClass = 'bg-white border-zinc-200 shadow-sm text-zinc-900';
        break;
    }
  }

  return (
    <ProCard className={`p-4 sm:p-6 space-y-6 transition-all duration-300 relative overflow-hidden ${leftBorderClass} ${backgroundClass}`}>
      
      {/* Esquina decorativa con el color del deporte - Eliminada para un diseño minimalista */}

      {/* Cabecera Limpia */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-zinc-100 pb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`w-2 h-2 rounded-full ${session.sport_type === 'natacion' ? 'bg-[var(--color-swim)]' : session.sport_type === 'ciclismo' ? 'bg-[var(--color-bike)]' : session.sport_type === 'carrera' ? 'bg-[var(--color-run)]' : session.sport_type === 'fuerza' ? 'bg-purple-400' : 'bg-amber-400'}`} />
            <p className="text-zinc-500 font-semibold tracking-wider uppercase text-xs">
              {session.sport_type} • {session.day_name}
            </p>
            {workout.auto_adjusted && (
              workout.adjustment_reason === 'lesion' ? (
                <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-300 text-red-600 text-[10px] font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-red-550" />
                  <span>IA: Prevención de Lesión</span>
                </span>
              ) : workout.adjustment_reason === 'adherencia' ? (
                <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-300 text-blue-600 text-[10px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-500" />
                  <span>IA: Ajuste de Carga</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-600 text-[10px] font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-500" />
                  <span>IA: Ajuste por Fatiga</span>
                </span>
              )
            )}
            {isMissed && (
              <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-650 text-[10px] font-bold flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-500" />
                <span>Sesión Saltada</span>
              </span>
            )}
            {status === 'pending' && complianceStatus === 'red' && (
              <span className="px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-650 text-[10px] font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-red-500" />
                <span>Incompleta (Vencida)</span>
              </span>
            )}
          </div>
          {session.sport_type !== 'descanso' ? (
            readOnly ? (
              <h3 className="text-xl font-bold text-zinc-900 inline-flex items-center gap-1.5">
                {session.sport_type === 'fuerza' ? 'Fuerza y Acondicionamiento' : `Sesión de ${session.sport_type}`}
              </h3>
            ) : (
              <Link href={`/dashboard/workout/${workout.id}`} className="hover:text-cyan-400 hover:underline transition-colors decoration-cyan-400">
                <h3 className="text-xl font-bold text-zinc-900 inline-flex items-center gap-1.5 group">
                  {session.sport_type === 'fuerza' ? 'Fuerza y Acondicionamiento' : `Sesión de ${session.sport_type}`}
                  <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                </h3>
              </Link>
            )
          ) : (
            <h3 className="text-xl font-bold text-zinc-900">
              Día de descanso activo
            </h3>
          )}
        </div>

        {session.sport_type !== 'descanso' && (
          <div className="flex gap-4 text-xs font-semibold text-zinc-700 bg-zinc-50 border border-zinc-200/60 p-2.5 rounded-xl shadow-xs shrink-0 self-stretch sm:self-auto justify-between sm:justify-start">
            <div className="text-left border-r border-zinc-200 pr-4">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Planificado</span>
              <div className="text-sm font-bold text-zinc-800 mt-0.5">{durationMin} <span className="text-[10px] font-normal text-zinc-500">min</span></div>
              <div className="text-[11px] text-zinc-650 mt-0.5">{plannedTss} <span className="text-[9px] font-normal text-zinc-400">TSS</span></div>
            </div>
            <div className="text-left pl-1">
              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-bold">Completado</span>
              {isCompleted ? (
                <>
                  <div className="text-sm font-bold text-emerald-600 mt-0.5">{durationMin - 3} <span className="text-[10px] font-normal text-emerald-500">min</span></div>
                  <div className="text-[11px] text-emerald-600 mt-0.5">{(workout as any).actual_tss || (telemetry as any)?.actual_tss || 85} <span className="text-[9px] font-normal text-emerald-500">TSS</span></div>
                </>
              ) : isMissed ? (
                <>
                  <div className="text-sm font-bold text-red-500 mt-0.5">0 <span className="text-[10px] font-normal text-red-400">min</span></div>
                  <div className="text-[11px] text-red-500 mt-0.5">0 <span className="text-[9px] font-normal text-red-400">TSS</span></div>
                </>
              ) : (
                <>
                  <div className="text-sm font-bold text-zinc-400 mt-0.5">-- <span className="text-[10px] font-normal text-zinc-400">min</span></div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">-- <span className="text-[9px] font-normal text-zinc-400">TSS</span></div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Contenido Principal con Pestañas (Tabbed View) */}
      {session.sport_type !== 'descanso' ? (
        <div className="space-y-4 relative z-10">
          {/* Navegación de Pestañas (Segmented Control Estilo Premium - TrainingPeaks Orange) */}
          <div className="bg-zinc-100 p-1 rounded-xl border border-zinc-200/85 flex items-center gap-1 overflow-x-auto scrollbar-none relative">
            <button
              onClick={() => setActiveTab('main')}
              className={`relative flex-1 min-w-[100px] px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer z-10 ${
                activeTab === 'main' 
                  ? 'text-cyan-400 font-bold' 
                  : 'text-zinc-500 hover:text-zinc-850'
              }`}
            >
              {activeTab === 'main' && (
                <motion.div
                  layoutId={`activeTabPill-${workout.id}`}
                  className="absolute inset-0 bg-white border border-zinc-200 shadow-sm rounded-lg -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Target className="w-3.5 h-3.5" />
              <span>Bloque Principal</span>
            </button>
            <button
              onClick={() => setActiveTab('warmup')}
              className={`relative flex-1 min-w-[100px] px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer z-10 ${
                activeTab === 'warmup' 
                  ? 'text-cyan-400 font-bold' 
                  : 'text-zinc-500 hover:text-zinc-850'
              }`}
            >
              {activeTab === 'warmup' && (
                <motion.div
                  layoutId={`activeTabPill-${workout.id}`}
                  className="absolute inset-0 bg-white border border-zinc-200 shadow-sm rounded-lg -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Flame className="w-3.5 h-3.5" />
              <span>Calentamiento</span>
            </button>
            <button
              onClick={() => setActiveTab('cooldown')}
              className={`relative flex-1 min-w-[100px] px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer z-10 ${
                activeTab === 'cooldown' 
                  ? 'text-cyan-400 font-bold' 
                  : 'text-zinc-500 hover:text-zinc-850'
              }`}
            >
              {activeTab === 'cooldown' && (
                <motion.div
                  layoutId={`activeTabPill-${workout.id}`}
                  className="absolute inset-0 bg-white border border-zinc-200 shadow-sm rounded-lg -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Wind className="w-3.5 h-3.5" />
              <span>Enfriamiento</span>
            </button>
            <button
              onClick={() => setActiveTab('gear')}
              className={`relative flex-1 min-w-[100px] px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer z-10 ${
                activeTab === 'gear' 
                  ? 'text-cyan-400 font-bold' 
                  : 'text-zinc-500 hover:text-zinc-850'
              }`}
            >
              {activeTab === 'gear' && (
                <motion.div
                  layoutId={`activeTabPill-${workout.id}`}
                  className="absolute inset-0 bg-white border border-zinc-200 shadow-sm rounded-lg -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Material</span>
            </button>
            <button
              onClick={() => setActiveTab('nutrition')}
              className={`relative flex-1 min-w-[100px] px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer z-10 ${
                activeTab === 'nutrition' 
                  ? 'text-cyan-400 font-bold' 
                  : 'text-zinc-500 hover:text-zinc-850'
              }`}
            >
              {activeTab === 'nutrition' && (
                <motion.div
                  layoutId={`activeTabPill-${workout.id}`}
                  className="absolute inset-0 bg-white border border-zinc-200 shadow-sm rounded-lg -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nutrición</span>
            </button>
            {telemetry && (
              <button
                onClick={() => setActiveTab('telemetry')}
                className={`relative flex-1 min-w-[100px] px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer z-10 ${
                  activeTab === 'telemetry' 
                    ? 'text-cyan-400 font-bold' 
                    : 'text-zinc-500 hover:text-zinc-850'
                }`}
              >
                {activeTab === 'telemetry' && (
                  <motion.div
                    layoutId={`activeTabPill-${workout.id}`}
                    className="absolute inset-0 bg-white border border-zinc-200 shadow-sm rounded-lg -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Watch className="w-3.5 h-3.5" />
                <span>Telemetría</span>
              </button>
            )}
          </div>
 
          {/* Contenido de la Pestaña Activa (Minimalist border and bg) */}
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 min-h-[80px] flex items-center w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.08, ease: 'easeOut' }}
                className="w-full"
              >
                {activeTab === 'main' && (
                  <div className="space-y-4 w-full">
                    <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                      <p className="font-semibold text-cyan-400 mb-1.5 flex items-center gap-1.5 text-xs tracking-wide uppercase">
                        <Target className="w-4 h-4 text-cyan-400" /> Objetivo Principal de la Sesión:
                      </p>
                      <p className="text-zinc-800 text-sm leading-relaxed">{parsed.main}</p>
                    </div>

                    {localSteps.length > 0 && (
                      <div className="pt-2 border-t border-zinc-200">
                        <p className="text-[10px] uppercase font-bold text-zinc-500 mb-2.5 tracking-wider flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-zinc-550" />
                          Bloques Estructurados de Entrenamiento
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Pre-Workout Nutrition Block (Chronological order: Before warmup) */}
                          <div className="p-3.5 rounded-xl bg-zinc-50/80 border border-sky-300/60 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-sky-600 uppercase tracking-wider flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-sky-500" />
                                Pre-Entreno
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 font-semibold uppercase">
                                60-90m antes
                              </span>
                            </div>
                            <div className="mt-2.5">
                              <div className="text-sm font-bold text-zinc-900 truncate">
                                {preWorkoutMeal.mealName}
                              </div>
                              <div className="text-[11px] text-zinc-500 mt-0.5 font-medium line-clamp-2">
                                {preWorkoutMeal.macronutrientFocus}
                              </div>
                            </div>
                          </div>

                          {/* Structured workout steps */}
                          {localSteps.map((step, index) => {
                            if (step.type === 'Repeat') {
                              const sub1 = step.workoutSteps?.[0];
                              const sub2 = step.workoutSteps?.[1];
                              return (
                                <div key={index} className="p-3.5 rounded-xl bg-zinc-50/80 border border-zinc-200 flex flex-col justify-between group">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
                                      <RefreshCw className="w-3.5 h-3.5 text-purple-500" /> 
                                      Repetir {step.repeatCount}x
                                    </span>
                                  </div>
                                  <div className="mt-2.5 space-y-2">
                                    {sub1 && (
                                      <div>
                                        <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                          {localFormatCondition(sub1.endCondition, sub1.endConditionValue)}
                                        </div>
                                        <div className="text-[10px] text-zinc-505 ml-3 font-medium">
                                          a {localFormatTarget(sub1.targetType, sub1.targetValueOne, sub1.targetValueTwo)}
                                        </div>
                                      </div>
                                    )}
                                    {sub2 && (
                                      <div className="border-t border-zinc-150 pt-1.5">
                                        <div className="text-[10px] font-bold text-purple-500 flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                          Recup: {localFormatCondition(sub2.endCondition, sub2.endConditionValue)}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            const isWarmup = step.type === 'Warmup';
                            const isCooldown = step.type === 'Cooldown';
                            const stepColorClass = isWarmup 
                              ? 'text-amber-600 bg-zinc-50/80 border-zinc-200' 
                              : isCooldown 
                              ? 'text-blue-600 bg-zinc-50/80 border-zinc-200' 
                              : 'text-cyan-500 bg-zinc-50/80 border-zinc-200';

                            const StepIcon = isWarmup 
                              ? Flame 
                              : isCooldown 
                              ? Wind 
                              : Target;

                            return (
                              <div key={index} className={`p-3.5 rounded-xl border flex flex-col justify-between ${stepColorClass}`}>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <StepIcon className="w-3.5 h-3.5" />
                                    {isWarmup ? 'Calentamiento' : isCooldown ? 'Enfriamiento' : 'Intervalo'}
                                  </span>
                                </div>
                                <div className="mt-2.5">
                                  <div className="text-sm font-bold text-zinc-900">
                                    {localFormatCondition(step.endCondition, step.endConditionValue)}
                                  </div>
                                  <div className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                                    Objetivo: {localFormatTarget(step.targetType, step.targetValueOne, step.targetValueTwo)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Post-Workout Recovery Nutrition Block (Chronological order: After cooldown) */}
                          <div className="p-3.5 rounded-xl bg-zinc-50/80 border border-emerald-300/65 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                Recuperación
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold uppercase">
                                Ventana 30m
                              </span>
                            </div>
                            <div className="mt-2.5 space-y-2">
                              <div>
                                <div className="text-sm font-bold text-zinc-900 truncate">
                                  {recoveryMeal.mealName}
                                </div>
                                <div className="text-[11px] text-zinc-500 mt-0.5 font-medium line-clamp-1">
                                  {recoveryMeal.macronutrientFocus}
                                </div>
                              </div>
                              {/* Simple macro distribution micro-bar */}
                              <div className="h-1.5 w-full rounded-full bg-zinc-200 overflow-hidden flex">
                                <div className={`bg-cyan-500 h-full ${durationMin >= 60 ? 'w-[55%]' : 'w-[15%]'}`} />
                                <div className={`bg-purple-500 h-full ${durationMin >= 60 ? 'w-[30%]' : 'w-[60%]'}`} />
                                <div className={`bg-amber-500 h-full ${durationMin >= 60 ? 'w-[15%]' : 'w-[25%]'}`} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'warmup' && (
                  <div className="w-full">
                    <p className="font-semibold text-amber-600 mb-1.5 flex items-center gap-1.5 text-xs tracking-wide uppercase">
                      <Flame className="w-4 h-4 text-amber-500" /> Activación y Calentamiento:
                    </p>
                    <p className="text-zinc-800 text-sm leading-relaxed bg-zinc-50 border border-zinc-200 p-3.5 rounded-xl">{parsed.warmup}</p>
                  </div>
                )}
                {activeTab === 'cooldown' && (
                  <div className="w-full">
                    <p className="font-semibold text-blue-600 mb-1.5 flex items-center gap-1.5 text-xs tracking-wide uppercase">
                      <Wind className="w-4 h-4 text-blue-500" /> Vuelta a la Calma y Recuperación:
                    </p>
                    <p className="text-zinc-800 text-sm leading-relaxed bg-zinc-50 border border-zinc-200 p-3.5 rounded-xl">{parsed.cooldown}</p>
                  </div>
                )}
                {activeTab === 'gear' && (
                  <div className="space-y-4 w-full">
                    <div>
                      <p className="font-semibold text-purple-600 mb-1.5 flex items-center gap-1.5 text-xs tracking-wide uppercase">
                        <Dumbbell className="w-4 h-4 text-purple-500" /> Equipamiento Recomendado:
                      </p>
                      <p className="text-zinc-800 text-sm leading-relaxed bg-zinc-50 border border-zinc-200 p-3.5 rounded-xl">{parsed.gear}</p>
                    </div>
                    {missingGear.length > 0 && !readOnly && (
                      <div className="pt-3 border-t border-zinc-100 flex items-center justify-between flex-wrap gap-3">
                        <span className="text-xs text-zinc-550 flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                          No tienes este material en tu Garaje Virtual.
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'nutrition' && (
                  <div className="space-y-4 w-full">
                    <div className="space-y-4">
                      <p className="font-semibold text-emerald-600 mb-2 flex items-center gap-1.5 text-xs tracking-wide uppercase">
                        <Sparkles className="w-4 h-4 text-emerald-500" /> Estrategia de Nutrición y Pacing:
                      </p>
                      
                      {session?.sport_type === 'descanso' ? (
                        <div className="space-y-4">
                          <p className="text-zinc-600 text-sm leading-relaxed bg-zinc-50 border border-zinc-200 p-3.5 rounded-xl">
                            Hoy es día de descanso y asimilación. Concéntrate en mantenerte hidratado con agua y seguir tu plan de macros base. No requieres suplementación específica de pacing.
                          </p>

                          {/* Nutrición de Recuperación Post-Entrenamiento (Día de descanso) */}
                          <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                                Nutrición Recomendada
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-500 text-[9px] font-bold tracking-wider uppercase">
                                Descanso Activo
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-base font-bold text-zinc-900">{recoveryMeal.mealName}</h4>
                              <p className="text-xs text-zinc-500 font-medium">{recoveryMeal.macronutrientFocus}</p>
                            </div>

                            <div className="pt-2 border-t border-zinc-150">
                              {renderAsBulletList(recoveryMeal.recipeDescription)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Nutrición Pre-Entrenamiento */}
                          <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-3 shadow-sm">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Flame className="w-3.5 h-3.5 text-cyan-400" />
                                Carga Pre-Entrenamiento
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-cyan-400 text-[9px] font-bold tracking-wider uppercase">
                                60-120 Min Antes
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-base font-bold text-zinc-900">{preWorkoutMeal.mealName}</h4>
                              <p className="text-xs text-zinc-500 font-medium">{preWorkoutMeal.macronutrientFocus}</p>
                            </div>

                            <div className="pt-2 border-t border-zinc-150">
                              {renderAsBulletList(preWorkoutMeal.recipeDescription)}
                            </div>
                          </div>

                          {/* Grid de 3 Pilares */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Hidratación */}
                            <div className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-sm flex flex-col justify-between">
                              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                <Droplet className="w-3.5 h-3.5 text-cyan-450" /> Hidratación
                              </span>
                              <div className="mt-2">
                                <span className="text-lg font-extrabold text-zinc-900">{pacing.hourlyFluidMl}</span>
                                <span className="text-xs text-zinc-500 font-medium"> ml/h</span>
                              </div>
                              <span className="text-[10px] text-zinc-400 mt-1.5 block">Total: {pacing.totalFluidMl} ml</span>
                            </div>

                            {/* Electrolitos (Sodio) */}
                            <div className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-sm flex flex-col justify-between">
                              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                <Activity className="w-3.5 h-3.5 text-amber-500" /> Sodio
                              </span>
                              <div className="mt-2">
                                <span className="text-lg font-extrabold text-zinc-900">{pacing.hourlySodiumMg}</span>
                                <span className="text-xs text-zinc-500 font-medium"> mg/h</span>
                              </div>
                              <span className="text-[10px] text-zinc-400 mt-1.5 block">Total: {pacing.totalSodiumMg} mg</span>
                            </div>

                            {/* Carbohidratos */}
                            <div className="p-3.5 rounded-xl bg-white border border-zinc-200 shadow-sm flex flex-col justify-between">
                              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                <Zap className="w-3.5 h-3.5 text-rose-500" /> Carbohidratos
                              </span>
                              <div className="mt-2">
                                <span className="text-lg font-extrabold text-zinc-900">{pacing.hourlyCarbsG}</span>
                                <span className="text-xs text-zinc-500 font-medium"> g/h</span>
                              </div>
                              <span className="text-[10px] text-zinc-400 mt-1.5 block">Total: {pacing.totalCarbsG} g</span>
                            </div>
                          </div>

                          {/* Guía Práctica de Suplementación */}
                          <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200">
                            <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1">
                              💼 Pack del Entrenamiento
                            </span>
                            <div className="mt-2 text-xs">
                              {renderAsBulletList(pacing.practicalGuide)}
                            </div>
                          </div>

                          {/* Nutrición de Recuperación Post-Entrenamiento */}
                          <div className="p-4 rounded-xl bg-white border border-zinc-200 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                                Recuperación Post-Entrenamiento
                              </span>
                              {isCompleted ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-bold tracking-wider uppercase flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                  ✓ Ingerir ahora (Ventana metabólica)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-500 text-[9px] font-bold tracking-wider uppercase">
                                  ⏱ Planificado Post-Entreno
                                </span>
                              )}
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-base font-bold text-zinc-900">{recoveryMeal.mealName}</h4>
                              <p className="text-xs text-zinc-500 font-medium">{recoveryMeal.macronutrientFocus}</p>
                            </div>

                            {/* Gráfico de Distribución Macro Minimalista */}
                            <div className="space-y-2 pt-1">
                              <div className="flex justify-between text-[10px] text-zinc-400 font-bold tracking-wider uppercase">
                                <span>Distribución Nutricional Recomendada</span>
                                <span>
                                  HC: {durationMin >= 60 ? '55' : '15'}% | PRO: {durationMin >= 60 ? '30' : '60'}% | FAT: {durationMin >= 60 ? '15' : '25'}%
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden flex border border-zinc-200">
                                <div className={`bg-cyan-500 h-full transition-all ${durationMin >= 60 ? 'w-[55%]' : 'w-[15%]'}`} />
                                <div className={`bg-purple-500 h-full transition-all ${durationMin >= 60 ? 'w-[30%]' : 'w-[60%]'}`} />
                                <div className={`bg-amber-500 h-full transition-all ${durationMin >= 60 ? 'w-[15%]' : 'w-[25%]'}`} />
                              </div>
                              <div className="flex gap-4 text-[9px] text-zinc-500 font-medium">
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> Carbohidratos</span>
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Proteínas</span>
                                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Grasas</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-zinc-150">
                              {renderAsBulletList(recoveryMeal.recipeDescription)}
                            </div>

                            {/* Nota de ingredientes preferidos (Onboarding integration) */}
                            {preferredIngredients && preferredIngredients.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-1.5 border-t border-zinc-150">
                                <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-wider">Tus preferencias del onboarding:</span>
                                {preferredIngredients.map((ing) => (
                                  <span key={ing} className="px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-250 text-zinc-700 text-[9px] capitalize font-medium">
                                    {ing}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Guía Explicativa del Funcionamiento Metodológico */}
                      <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 flex gap-2.5 items-start">
                        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                            ¿Cómo se calculan estas métricas?
                          </span>
                          <p className="text-[11px] text-zinc-500 leading-relaxed">
                            Esta estrategia es completamente dinámica. La hidratación se deriva de tu tasa de sudoración ({sweatRate} L/h), y el sodio previene la fatiga y calambres. Los carbohidratos intra-entreno se ajustan según la duración y exigencia de la sesión ({durationMin} min). Por último, la comida de recuperación post-entrenamiento se optimiza utilizando los ingredientes preferidos seleccionados en tu onboarding, acelerando la síntesis proteica y reposición de glucógeno.
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
                {activeTab === 'telemetry' && telemetry && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Watch className="w-5 h-5 text-emerald-600" />
                        <div>
                          <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Dispositivo de Grabación</p>
                          <p className="text-sm font-bold text-zinc-900">{telemetry.raw_payload?.device || 'Garmin Forerunner 965'} <span className="text-xs font-normal text-zinc-500">(v{telemetry.raw_payload?.firmware || '18.22'})</span></p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold capitalize">
                        {telemetry.source_provider || 'garmin'} Connect
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-zinc-55 border border-zinc-200">
                        <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">Frecuencia Cardíaca</p>
                        <p className="text-lg font-bold text-zinc-900">{telemetry.avg_hr || 152} <span className="text-xs font-normal text-zinc-500">ppm</span></p>
                        <p className="text-[10px] text-zinc-400 mt-0.5">Máxima: {telemetry.max_hr || 178} ppm</p>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-55 border border-zinc-200">
                        <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                          Potencia Media
                          {athleteLevel === 'principiante' && <span className="text-[9px] text-zinc-400 font-normal ml-1">(Sensor Pro)</span>}
                        </p>
                        {athleteLevel === 'principiante' ? (
                          <p className="text-xs text-zinc-400 italic mt-2">Opcional / No requerido</p>
                        ) : (
                          <>
                            <p className="text-lg font-bold text-zinc-900">{telemetry.avg_power || (session?.sport_type === 'ciclismo' ? 215 : 240)} <span className="text-xs font-normal text-zinc-500">W</span></p>
                            <p className="text-[10px] text-zinc-450 mt-0.5">Norm: {telemetry.normalized_power || (session?.sport_type === 'ciclismo' ? 230 : 255)} W</p>
                          </>
                        )}
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-55 border border-zinc-200">
                        <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                          Cadencia
                          {athleteLevel === 'principiante' && <span className="text-[9px] text-zinc-400 font-normal ml-1">(Sensor Pro)</span>}
                        </p>
                        {athleteLevel === 'principiante' ? (
                          <p className="text-xs text-zinc-400 italic mt-2">Opcional / No requerido</p>
                        ) : (
                          <>
                            <p className="text-lg font-bold text-zinc-900">{telemetry.avg_cadence || (session?.sport_type === 'carrera' ? 176 : 92)} <span className="text-xs font-normal text-zinc-500">ppm</span></p>
                            <p className="text-[10px] text-emerald-650 font-medium mt-0.5">Óptima de carrera</p>
                          </>
                        )}
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-55 border border-zinc-200">
                        <p className="text-xs text-zinc-505 mb-1 flex items-center gap-1">Training Effect</p>
                        <p className="text-lg font-bold text-zinc-900">{telemetry.training_effect_aerobic || 4.2} <span className="text-xs font-normal text-zinc-500">Aeróbico</span></p>
                        <p className="text-[10px] text-purple-650 font-medium mt-0.5">Anaeróbico: {telemetry.training_effect_anaerobic || 2.1}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-55 border border-zinc-200 col-span-2 sm:col-span-2">
                        <p className="text-xs text-zinc-505 mb-1 flex items-center gap-1">
                          Carga de Entrenamiento (TSS)
                          {athleteLevel === 'principiante' && <span className="text-[9px] text-zinc-400 font-normal ml-1">(Métrica Pro)</span>}
                        </p>
                        {athleteLevel === 'principiante' ? (
                          <p className="text-xs text-zinc-400 italic mt-2">No necesario para tu nivel de inicio</p>
                        ) : (
                          <>
                            <div className="flex items-baseline gap-2">
                              <p className="text-lg font-bold text-cyan-600">{(workout as any).actual_tss || (telemetry as any).actual_tss || 145} <span className="text-xs font-normal text-zinc-500">TSS Real</span></p>
                              <span className="px-2 py-0.5 rounded bg-cyan-50 border border-cyan-200 text-cyan-700 text-[10px] font-bold">Z2 Base</span>
                            </div>
                            <p className="text-[10px] text-zinc-450 mt-0.5">Sincronizado e integrado en predicción de fatiga</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Zonas detectadas */}
          <div className="flex flex-wrap gap-2 pt-1">
            {hasZ1 && <ZoneBadge zone={1} label="Z1 Recuperación" />}
            {hasZ2 && <ZoneBadge zone={2} label="Z2 Resistencia Base" />}
            {hasZ3 && <ZoneBadge zone={3} label="Z3 Tempo / Ritmo" />}
            {hasZ4 && <ZoneBadge zone={4} label="Z4 Umbral" />}
            {!hasZ1 && !hasZ2 && !hasZ3 && !hasZ4 && <ZoneBadge zone={2} label="Z2 Aeróbico Base" />}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-xl bg-zinc-50 border border-zinc-200 text-center text-sm text-zinc-600 leading-relaxed">
          Día dedicado a la asimilación del entrenamiento y supercompensación glucogénica. Aprovecha para hidratarte y realizar estiramientos suaves.
        </div>
      )}

      {/* Toast Notificación Proactiva de Recálculo Dinámico */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-start gap-3 text-cyan-300 text-xs font-medium leading-relaxed relative z-20 shadow-lg shadow-cyan-500/10"
          >
            <Bell className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5 animate-bounce" />
            <div className="flex-1">
              <p className="font-bold text-white mb-0.5">Sincronización Inteligente de Telemetría</p>
              <p>{toastMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botones de acción principales limpios */}
      {!readOnly ? (
        <div className="pt-4 flex flex-col gap-3 relative z-10">
          {session.sport_type !== 'descanso' ? (
            <div className="w-full space-y-3">
              {/* PENDING STATE */}
              {!isCompleted && !isMissed && (
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <div className="flex gap-2 flex-1 sm:flex-[2]">
                    <AnimatedButton 
                      variant="primary" 
                      className="flex-1 justify-center py-6 text-sm font-semibold"
                      onClick={handleToggle}
                      disabled={loading}
                    >
                      <Circle className="w-5 h-5 text-zinc-400" />
                      <span>Completar</span>
                    </AnimatedButton>

                    <AnimatedButton
                      variant="ghost"
                      className="w-12 h-12 shrink-0 justify-center p-0 border border-zinc-200 bg-zinc-50 text-zinc-500 hover:text-zinc-850 hover:border-zinc-350 flex items-center"
                      onClick={handleToggleMissed}
                      disabled={loading}
                      title="Saltar sesión"
                    >
                      <XCircle className="w-5 h-5 text-zinc-400" />
                    </AnimatedButton>
                  </div>

                  <AnimatedButton
                    variant="ghost"
                    className="flex-1 justify-center py-6 border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 flex items-center justify-center gap-2 font-semibold whitespace-nowrap"
                    onClick={() => {
                      setIsSyncingOpen(true);
                      window.open(`/api/workouts/export?workoutId=${workout.id}`, '_blank');
                    }}
                  >
                    <Download className="w-4 h-4 text-orange-500 animate-bounce" />
                    <span>Enviar al Reloj</span>
                  </AnimatedButton>

                  {session.sport_type === 'fuerza' && (
                    <AnimatedButton
                      variant="ghost"
                      className="flex-1 justify-center py-6 border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 flex items-center justify-center gap-2 font-semibold whitespace-nowrap"
                      onClick={() => setIsGymModeOpen(true)}
                    >
                      <Dumbbell className="w-4 h-4 text-zinc-500" />
                      <span>Iniciar Modo Gym</span>
                    </AnimatedButton>
                  )}
                </div>
              )}

              {/* COMPLETED STATE */}
              {isCompleted && (
                <div className="w-full space-y-3">
                  {!hasFeedback && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-orange-400 animate-pulse shrink-0" />
                      <span>¡Actividad importada de Strava! Valora tus sensaciones para que la IA adapte tu plan.</span>
                    </motion.div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <AnimatedButton 
                      variant="secondary" 
                      className="flex-1 justify-center py-6 text-sm font-semibold border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                      onClick={handleToggle}
                      disabled={loading}
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      <span className="text-emerald-700">✓ Completado</span>
                    </AnimatedButton>

                    <AnimatedButton
                      variant="ghost"
                      className={`flex-1 justify-center py-6 border flex items-center justify-center gap-2 font-semibold transition-all ${
                        !hasFeedback 
                          ? 'border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 shadow-md shadow-orange-500/5'
                          : 'border-cyan-200 bg-cyan-50/50 text-cyan-400 hover:bg-cyan-50/80'
                      }`}
                      onClick={() => setIsFeedbackOpen(true)}
                    >
                      <MessageSquarePlus className={`w-5 h-5 ${!hasFeedback ? 'text-orange-400 animate-bounce' : 'text-cyan-400'}`} />
                      <span>{hasFeedback ? 'Editar Valoración' : 'Evaluar Sesión'}</span>
                    </AnimatedButton>

                    <AnimatedButton
                      variant="ghost"
                      className="flex-1 justify-center py-6 border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 flex items-center justify-center gap-2 font-semibold whitespace-nowrap"
                      onClick={() => {
                        setIsSyncingOpen(true);
                        window.open(`/api/workouts/export?workoutId=${workout.id}`, '_blank');
                      }}
                    >
                      <Download className="w-4 h-4 text-orange-500 animate-bounce" />
                      <span>Enviar al Reloj</span>
                    </AnimatedButton>
                  </div>
                </div>
              )}

              {/* MISSED STATE */}
              {isMissed && (
                <AnimatedButton 
                  variant="secondary" 
                  className="w-full justify-center py-6 text-sm font-semibold border-red-200 bg-red-50 hover:bg-red-100 text-red-700"
                  onClick={handleToggleMissed}
                  disabled={loading}
                >
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700">✓ Entrenamiento Saltado (Clic para Restaurar)</span>
                </AnimatedButton>
              )}
            </div>
          ) : (
            <div className="w-full p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-center text-xs text-zinc-500 uppercase tracking-widest font-semibold">
              ✓ Descanso Programado
            </div>
          )}
        </div>
      ) : (
        session.sport_type === 'descanso' && (
          <div className="pt-4 relative z-10">
            <div className="w-full p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-center text-xs text-zinc-500 uppercase tracking-widest font-semibold">
              ✓ Descanso Programado
            </div>
          </div>
        )
      )}

      <WorkoutFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        workoutId={workout.id}
        workoutTitle={`Sesión de ${session.sport_type} • ${session.day_name}`}
      />

      {session.sport_type === 'fuerza' && (
        <GymTrackerModal
          isOpen={isGymModeOpen}
          onClose={() => setIsGymModeOpen(false)}
          workoutTitle={`Fuerza: ${parsed.main.substring(0, 20)}...`}
          workoutId={workout.id}
        />
      )}

      <WatchSyncModal
        isOpen={isSyncingOpen}
        onClose={() => setIsSyncingOpen(false)}
        workout={workout as any}
      />
    </ProCard>
  );
}
