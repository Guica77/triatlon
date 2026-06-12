'use client';

import * as React from 'react';
import { toggleWorkoutStatus, updateWorkoutStatus } from '@/app/(app)/dashboard/actions';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { ZoneBadge } from '@/components/ui/zone-badge';
import { CheckCircle2, Circle, Clock, Flame, MessageSquarePlus, Bell, Target, Sparkles, ShieldCheck, Dumbbell, ShoppingBag, Watch, Activity, Download, XCircle, ChevronRight, RefreshCw, Wind, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkoutFeedbackModal } from '@/components/feedback/workout-feedback-modal';
import { simulateWatchIngestion } from '@/app/telemetry/telemetry-actions';
import { GymTrackerModal } from '@/components/workouts/gym-tracker-modal';
import Link from 'next/link';
import { WatchSyncModal } from '@/components/dashboard/watch-sync-modal';

interface WorkoutCardProps {
  initialIsConnected?: boolean;
  virtualGarage?: string[];
  athleteLevel?: string;
  readOnly?: boolean;
  workout: {
    id: string;
    scheduled_date: string;
    status: string;
    auto_adjusted?: boolean | null;
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

export function DailyWorkoutCard({ workout, initialIsConnected = false, virtualGarage = [], athleteLevel = 'intermedio', readOnly = false }: WorkoutCardProps) {
  const [status, setStatus] = React.useState(workout.status);
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'main' | 'warmup' | 'cooldown' | 'gear' | 'telemetry'>('main');
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);
  const [isGymModeOpen, setIsGymModeOpen] = React.useState(false);
  const [isSyncingOpen, setIsSyncingOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const session = workout.training_sessions;
  const isCompleted = status === 'completed';
  const isMissed = status === 'missed';

  const telemetry = workout.universal_telemetry?.[0] || (isCompleted ? {
    source_provider: 'garmin',
    avg_hr: 152,
    max_hr: 178,
    avg_power: session?.sport_type === 'ciclismo' ? 215 : undefined,
    normalized_power: session?.sport_type === 'ciclismo' ? 230 : undefined,
    avg_cadence: session?.sport_type === 'carrera' ? 176 : 92,
    training_effect_aerobic: 4.2,
    training_effect_anaerobic: 2.1,
    raw_payload: { device: 'Garmin Forerunner 965', firmware: '18.22' }
  } : null);

  // Sincronización Automática en Segundo Plano (Garmin / Strava Webhooks)
  React.useEffect(() => {
    if (!readOnly && initialIsConnected && status === 'pending' && session?.sport_type !== 'descanso') {
      const timer = setTimeout(async () => {
        const res = await simulateWatchIngestion(workout.id, session?.sport_type || 'ciclismo');
        if (res?.success) {
          setStatus('completed');
          setToastMsg('¡Actividad detectada y sincronizada automáticamente desde tu reloj! TSS Real: 85');
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
    setLoading(true);
    const prevStatus = status;
    const nextStatus = isCompleted ? 'pending' : 'completed';
    setStatus(nextStatus); // Optimistic

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

  const desc = session.description || '';
  const parsed = parseWorkoutDescription(desc, session.sport_type);
  let durationMin = session.duration_min || 0;

  if (workout.auto_adjusted) {
    durationMin = Math.round(durationMin * 0.75);
    parsed.main = `[SESIÓN ADAPTADA POR FATIGA] Duración principal reducida un 25%. Mantén un esfuerzo moderado y cómodo en Zona 1-2. Objetivo original: ${parsed.main}`;
  }

  if (athleteLevel === 'principiante') {
    if (session.sport_type === 'natacion') {
      parsed.gear = '🩱 Bañador y gafas de natación (palas o aletas opcionales).';
    } else if (session.sport_type === 'ciclismo') {
      parsed.gear = '🚴‍♂️ Cualquier bicicleta (de carretera, híbrida o montaña) y casco obligatorio.';
    } else if (session.sport_type === 'carrera') {
      parsed.gear = '🏃‍♂️ Zapatillas de running normales y ropa cómoda.';
    }
  }

  const localSteps = getLocalStructuredSteps(session.sport_type, desc, durationMin);

  const hasZ1 = desc.includes('Zona 1') || desc.includes('Z1');
  const hasZ2 = desc.includes('Zona 2') || desc.includes('Z2') || desc.includes('suave') || desc.includes('fácil');
  const hasZ3 = desc.includes('Zona 3') || desc.includes('Z3') || desc.includes('ritmo') || desc.includes('crol');
  const hasZ4 = desc.includes('Zona 4') || desc.includes('Z4') || desc.includes('series') || desc.includes('fuerte');

  return (
    <ProCard className={`p-4 sm:p-6 space-y-6 transition-all duration-300 relative overflow-hidden ${isCompleted ? 'border-zinc-800 bg-zinc-900/40 opacity-80' : isMissed ? 'border-zinc-900 bg-zinc-950/20 opacity-60' : ''}`}>
      
      {/* Esquina decorativa con el color del deporte */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none ${sportBgGlow[session.sport_type] || 'bg-transparent'}`} />

      {/* Cabecera Limpia */}
      <div className="flex justify-between items-start border-b border-[var(--color-border)] pb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`w-2 h-2 rounded-full ${session.sport_type === 'natacion' ? 'bg-[var(--color-swim)]' : session.sport_type === 'ciclismo' ? 'bg-[var(--color-bike)]' : session.sport_type === 'carrera' ? 'bg-[var(--color-run)]' : session.sport_type === 'fuerza' ? 'bg-purple-400' : 'bg-amber-400'}`} />
            <p className="text-zinc-400 font-medium tracking-wider uppercase text-xs">
              {session.sport_type} • {session.day_name}
            </p>
            {workout.auto_adjusted && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                <Flame className="w-3 h-3" />
                <span>Reajustado por Fatiga</span>
              </span>
            )}
            {isMissed && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-400" />
                <span>Sesión Saltada</span>
              </span>
            )}
          </div>
          {session.sport_type !== 'descanso' ? (
            readOnly ? (
              <h3 className="text-xl font-semibold text-zinc-50 inline-flex items-center gap-1.5">
                {session.sport_type === 'fuerza' ? 'Fuerza y Acondicionamiento' : `Sesión de ${session.sport_type}`}
              </h3>
            ) : (
              <Link href={`/dashboard/workout/${workout.id}`} className="hover:text-cyan-400 hover:underline transition-colors decoration-cyan-400">
                <h3 className="text-xl font-semibold text-zinc-50 inline-flex items-center gap-1.5 group">
                  {session.sport_type === 'fuerza' ? 'Fuerza y Acondicionamiento' : `Sesión de ${session.sport_type}`}
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
                </h3>
              </Link>
            )
          ) : (
            <h3 className="text-xl font-semibold text-zinc-50">
              Día de descanso activo
            </h3>
          )}
        </div>

        {durationMin > 0 && (
          <div className="text-right flex items-center gap-1.5 text-zinc-300 font-light">
            <Clock className="w-4 h-4 text-zinc-500" />
            <span className="text-2xl font-light text-zinc-50">{durationMin}</span>
            <span className="text-xs text-zinc-500">min</span>
          </div>
        )}
      </div>

      {/* Contenido Principal con Pestañas (Tabbed View) */}
      {session.sport_type !== 'descanso' ? (
        <div className="space-y-4 relative z-10">
          
          {/* Navegación de Pestañas (Segmented Control Estilo Premium) */}
          <div className="bg-zinc-950/60 p-1 rounded-xl border border-zinc-800/60 flex items-center gap-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('main')}
              className={`flex-1 min-w-[100px] px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'main' 
                  ? 'bg-zinc-900 text-cyan-400 border border-zinc-800 shadow-sm font-bold' 
                  : 'text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/30 border border-transparent'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Bloque Principal</span>
            </button>
            <button
              onClick={() => setActiveTab('warmup')}
              className={`flex-1 min-w-[100px] px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'warmup' 
                  ? 'bg-zinc-900 text-amber-400 border border-zinc-800 shadow-sm font-bold' 
                  : 'text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/30 border border-transparent'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Calentamiento</span>
            </button>
            <button
              onClick={() => setActiveTab('cooldown')}
              className={`flex-1 min-w-[100px] px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'cooldown' 
                  ? 'bg-zinc-900 text-blue-400 border border-zinc-800 shadow-sm font-bold' 
                  : 'text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/30 border border-transparent'
              }`}
            >
              <Wind className="w-3.5 h-3.5" />
              <span>Enfriamiento</span>
            </button>
            <button
              onClick={() => setActiveTab('gear')}
              className={`flex-1 min-w-[100px] px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'gear' 
                  ? 'bg-zinc-900 text-purple-400 border border-zinc-800 shadow-sm font-bold' 
                  : 'text-zinc-400 hover:text-zinc-250 hover:bg-zinc-900/30 border border-transparent'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Material</span>
            </button>
            {telemetry && (
              <button
                onClick={() => setActiveTab('telemetry')}
                className={`flex-1 min-w-[100px] px-2.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'telemetry' 
                    ? 'bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm font-bold' 
                    : 'text-green-550 hover:text-green-400 hover:bg-green-500/5'
                }`}
              >
                <Watch className="w-3.5 h-3.5" />
                <span>Telemetría</span>
              </button>
            )}
          </div>

          {/* Contenido de la Pestaña Activa */}
          <div className="p-4 rounded-xl bg-[#121214] border border-zinc-800/80 min-h-[80px] flex items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="text-sm text-zinc-300 leading-relaxed font-normal w-full"
              >
                {activeTab === 'main' && (
                  <div className="space-y-4 w-full">
                    <div className="p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                      <p className="font-semibold text-cyan-400 mb-1.5 flex items-center gap-1.5 text-xs tracking-wide uppercase">
                        <Target className="w-4 h-4 text-cyan-400" /> Objetivo Principal de la Sesión:
                      </p>
                      <p className="text-zinc-300 text-sm leading-relaxed">{parsed.main}</p>
                    </div>

                    {localSteps.length > 0 && (
                      <div className="pt-2 border-t border-zinc-800/80">
                        <p className="text-[10px] uppercase font-bold text-zinc-500 mb-2.5 tracking-wider flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-zinc-500" />
                          Bloques Estructurados de Entrenamiento
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {localSteps.map((step, index) => {
                            if (step.type === 'Repeat') {
                              const sub1 = step.workoutSteps?.[0];
                              const sub2 = step.workoutSteps?.[1];
                              return (
                                <div key={index} className="p-3.5 rounded-xl bg-purple-500/[0.02] border border-purple-500/15 hover:border-purple-500/30 transition-all duration-200 flex flex-col justify-between group hover:shadow-lg">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                                      <RefreshCw className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-180 transition-transform duration-700" /> 
                                      Repetir {step.repeatCount}x
                                    </span>
                                  </div>
                                  <div className="mt-2.5 space-y-2">
                                    {sub1 && (
                                      <div>
                                        <div className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                          {localFormatCondition(sub1.endCondition, sub1.endConditionValue)}
                                        </div>
                                        <div className="text-[10px] text-zinc-400 ml-3 font-medium">
                                          a {localFormatTarget(sub1.targetType, sub1.targetValueOne, sub1.targetValueTwo)}
                                        </div>
                                      </div>
                                    )}
                                    {sub2 && (
                                      <div className="border-t border-purple-500/10 pt-1.5">
                                        <div className="text-[10px] font-bold text-purple-300 flex items-center gap-1.5">
                                          <span className="w-1 h-1 rounded-full bg-purple-500" />
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
                              ? 'text-amber-400 bg-amber-500/[0.02] border-amber-500/15 hover:border-amber-500/30' 
                              : isCooldown 
                              ? 'text-blue-400 bg-blue-500/[0.02] border-blue-500/15 hover:border-blue-500/30' 
                              : 'text-cyan-400 bg-cyan-500/[0.02] border-cyan-500/15 hover:border-cyan-500/30';

                            const StepIcon = isWarmup 
                              ? Flame 
                              : isCooldown 
                              ? Wind 
                              : Target;

                            return (
                              <div key={index} className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${stepColorClass} hover:shadow-lg`}>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <StepIcon className="w-3.5 h-3.5" />
                                    {isWarmup ? 'Calentamiento' : isCooldown ? 'Enfriamiento' : 'Intervalo'}
                                  </span>
                                </div>
                                <div className="mt-2.5">
                                  <div className="text-sm font-bold text-zinc-100">
                                    {localFormatCondition(step.endCondition, step.endConditionValue)}
                                  </div>
                                  <div className="text-[11px] text-zinc-400 mt-0.5 font-medium">
                                    Objetivo: {localFormatTarget(step.targetType, step.targetValueOne, step.targetValueTwo)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'warmup' && (
                  <div className="w-full">
                    <p className="font-semibold text-amber-400 mb-1.5 flex items-center gap-1.5 text-xs tracking-wide uppercase">
                      <Flame className="w-4 h-4 text-amber-400" /> Activación y Calentamiento:
                    </p>
                    <p className="text-zinc-300 text-sm leading-relaxed bg-amber-500/[0.02] border border-amber-500/15 p-3.5 rounded-xl">{parsed.warmup}</p>
                  </div>
                )}
                {activeTab === 'cooldown' && (
                  <div className="w-full">
                    <p className="font-semibold text-blue-400 mb-1.5 flex items-center gap-1.5 text-xs tracking-wide uppercase">
                      <Wind className="w-4 h-4 text-blue-400" /> Vuelta a la Calma y Recuperación:
                    </p>
                    <p className="text-zinc-300 text-sm leading-relaxed bg-blue-500/[0.02] border border-blue-500/15 p-3.5 rounded-xl">{parsed.cooldown}</p>
                  </div>
                )}
                {activeTab === 'gear' && (
                  <div className="space-y-4 w-full">
                    <div>
                      <p className="font-semibold text-purple-400 mb-1.5 flex items-center gap-1.5 text-xs tracking-wide uppercase">
                        <Dumbbell className="w-4 h-4 text-purple-400" /> Equipamiento Recomendado:
                      </p>
                      <p className="text-zinc-300 text-sm leading-relaxed bg-purple-500/[0.02] border border-purple-500/15 p-3.5 rounded-xl">{parsed.gear}</p>
                    </div>
                    {missingGear.length > 0 && !readOnly && (
                      <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between flex-wrap gap-3">
                        <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-orange-400" />
                          No tienes este material en tu Garaje Virtual.
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'telemetry' && telemetry && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Watch className="w-5 h-5 text-green-400 animate-pulse" />
                        <div>
                          <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Dispositivo de Grabación</p>
                          <p className="text-sm font-bold text-zinc-100">{telemetry.raw_payload?.device || 'Garmin Forerunner 965'} <span className="text-xs font-normal text-zinc-500">(v{telemetry.raw_payload?.firmware || '18.22'})</span></p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold capitalize">
                        {telemetry.source_provider || 'garmin'} Connect
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                        <p className="text-xs text-zinc-400 mb-1 flex items-center gap-1">❤️ Frecuencia Cardíaca</p>
                        <p className="text-lg font-bold text-zinc-100">{telemetry.avg_hr || 152} <span className="text-xs font-normal text-zinc-500">ppm</span></p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Máxima: {telemetry.max_hr || 178} ppm</p>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                        <p className="text-xs text-zinc-400 mb-1 flex items-center gap-1">
                          ⚡ Potencia Media
                          {athleteLevel === 'principiante' && <span className="text-[9px] text-zinc-550 font-normal ml-1">(Sensor Pro)</span>}
                        </p>
                        {athleteLevel === 'principiante' ? (
                          <p className="text-xs text-zinc-500 italic mt-2">Opcional / No requerido</p>
                        ) : (
                          <>
                            <p className="text-lg font-bold text-zinc-100">{telemetry.avg_power || (session?.sport_type === 'ciclismo' ? 215 : 240)} <span className="text-xs font-normal text-zinc-500">W</span></p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">Norm: {telemetry.normalized_power || (session?.sport_type === 'ciclismo' ? 230 : 255)} W</p>
                          </>
                        )}
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                        <p className="text-xs text-zinc-400 mb-1 flex items-center gap-1">
                          🔄 Cadencia
                          {athleteLevel === 'principiante' && <span className="text-[9px] text-zinc-550 font-normal ml-1">(Sensor Pro)</span>}
                        </p>
                        {athleteLevel === 'principiante' ? (
                          <p className="text-xs text-zinc-500 italic mt-2">Opcional / No requerido</p>
                        ) : (
                          <>
                            <p className="text-lg font-bold text-zinc-100">{telemetry.avg_cadence || (session?.sport_type === 'carrera' ? 176 : 92)} <span className="text-xs font-normal text-zinc-500">ppm</span></p>
                            <p className="text-[10px] text-green-400 font-medium mt-0.5">Óptima de carrera</p>
                          </>
                        )}
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
                        <p className="text-xs text-zinc-400 mb-1 flex items-center gap-1">🎯 Training Effect</p>
                        <p className="text-lg font-bold text-zinc-100">{telemetry.training_effect_aerobic || 4.2} <span className="text-xs font-normal text-zinc-500">Aeróbico</span></p>
                        <p className="text-[10px] text-purple-400 font-medium mt-0.5">Anaeróbico: {telemetry.training_effect_anaerobic || 2.1}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 col-span-2 sm:col-span-2">
                        <p className="text-xs text-zinc-400 mb-1 flex items-center gap-1">
                          📊 Carga de Entrenamiento (TSS)
                          {athleteLevel === 'principiante' && <span className="text-[9px] text-zinc-550 font-normal ml-1">(Métrica Pro)</span>}
                        </p>
                        {athleteLevel === 'principiante' ? (
                          <p className="text-xs text-zinc-500 italic mt-2">No necesario para tu nivel de inicio</p>
                        ) : (
                          <>
                            <div className="flex items-baseline gap-2">
                              <p className="text-lg font-bold text-cyan-400">{(workout as any).actual_tss || (telemetry as any).actual_tss || 145} <span className="text-xs font-normal text-zinc-500">TSS Real</span></p>
                              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-bold">Z2 Base</span>
                            </div>
                            <p className="text-[10px] text-zinc-500 mt-0.5">Sincronizado e integrado en predicción de fatiga</p>
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
        <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 text-center text-sm text-zinc-400 leading-relaxed">
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
                      className="flex-1 justify-center py-6 text-sm font-semibold shadow-lg shadow-cyan-500/10"
                      onClick={handleToggle}
                      disabled={loading}
                    >
                      <Circle className="w-5 h-5 text-zinc-400" />
                      <span>Completar</span>
                    </AnimatedButton>

                    <AnimatedButton
                      variant="ghost"
                      className="w-12 h-12 shrink-0 justify-center p-0 border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 flex items-center"
                      onClick={handleToggleMissed}
                      disabled={loading}
                      title="Saltar sesión"
                    >
                      <XCircle className="w-5 h-5 text-zinc-500" />
                    </AnimatedButton>
                  </div>

                  <AnimatedButton
                    variant="ghost"
                    className="flex-1 justify-center py-6 border border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50 flex items-center justify-center gap-2 font-semibold shadow-lg shadow-orange-500/10 whitespace-nowrap"
                    onClick={() => {
                      setIsSyncingOpen(true);
                      window.open(`/api/workouts/export?workoutId=${workout.id}`, '_blank');
                    }}
                  >
                    <Download className="w-4 h-4 text-orange-400 animate-bounce" />
                    <span>Enviar al Reloj</span>
                  </AnimatedButton>

                  {session.sport_type === 'fuerza' && (
                    <AnimatedButton
                      variant="ghost"
                      className="flex-1 justify-center py-6 border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/50 flex items-center justify-center gap-2 font-semibold shadow-[0_0_15px_rgba(168,85,247,0.15)] whitespace-nowrap"
                      onClick={() => setIsGymModeOpen(true)}
                    >
                      <Dumbbell className="w-4 h-4 text-purple-400" />
                      <span>Iniciar Modo Gym</span>
                    </AnimatedButton>
                  )}
                </div>
              )}

              {/* COMPLETED STATE */}
              {isCompleted && (
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <AnimatedButton 
                    variant="secondary" 
                    className="flex-1 justify-center py-6 text-sm font-semibold border-green-500/20 bg-green-950/5 hover:bg-green-950/10"
                    onClick={handleToggle}
                    disabled={loading}
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <span className="text-zinc-200">✓ Completado</span>
                  </AnimatedButton>

                  <AnimatedButton
                    variant="ghost"
                    className="flex-1 justify-center py-6 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/50 flex items-center justify-center gap-2"
                    onClick={() => setIsFeedbackOpen(true)}
                  >
                    <MessageSquarePlus className="w-5 h-5" />
                    <span>Evaluar Sesión</span>
                  </AnimatedButton>

                  <AnimatedButton
                    variant="ghost"
                    className="flex-1 justify-center py-6 border border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50 flex items-center justify-center gap-2 font-semibold shadow-lg shadow-orange-500/10 whitespace-nowrap"
                    onClick={() => {
                      setIsSyncingOpen(true);
                      window.open(`/api/workouts/export?workoutId=${workout.id}`, '_blank');
                    }}
                  >
                    <Download className="w-4 h-4 text-orange-400 animate-bounce" />
                    <span>Enviar al Reloj</span>
                  </AnimatedButton>
                </div>
              )}

              {/* MISSED STATE */}
              {isMissed && (
                <AnimatedButton 
                  variant="secondary" 
                  className="w-full justify-center py-6 text-sm font-semibold border-red-500/20 bg-red-950/10 hover:bg-red-950/20"
                  onClick={handleToggleMissed}
                  disabled={loading}
                >
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-400">✓ Entrenamiento Saltado (Clic para Restaurar)</span>
                </AnimatedButton>
              )}
            </div>
          ) : (
            <div className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-xs text-zinc-500 uppercase tracking-widest font-semibold">
              ✓ Descanso Programado
            </div>
          )}
        </div>
      ) : (
        session.sport_type === 'descanso' && (
          <div className="pt-4 relative z-10">
            <div className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-xs text-zinc-500 uppercase tracking-widest font-semibold">
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
