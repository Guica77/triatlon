'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleWorkoutStatus, updateWorkoutStatus } from '@/app/dashboard/actions';
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
  ChevronRight
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
    training_sessions: {
      sport_type: string;
      duration_min: number;
      description: string;
      day_name: string;
      gear_needed?: string[] | null;
    };
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
  const isCompleted = status === 'completed';
  const isMissed = status === 'missed';

  const handleToggle = async () => {
    if (loading) return;
    setLoading(true);
    const prevStatus = status;
    const nextStatus = isCompleted ? 'pending' : 'completed';
    setStatus(nextStatus);

    try {
      await toggleWorkoutStatus(workout.id, prevStatus);
      router.refresh();
    } catch (e) {
      setStatus(prevStatus);
    } finally {
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
      <div key={index} className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-850 flex items-center justify-between flex-wrap gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-950 flex items-center justify-center border border-zinc-850">
            {renderStepIcon(step.type)}
          </div>
          <div>
            <p className="font-semibold text-white capitalize">
              {step.type === 'Warmup' ? 'Calentamiento' : step.type === 'Cooldown' ? 'Vuelta a la Calma' : 'Intervalo'}
            </p>
            <p className="text-[10px] sm:text-xs text-zinc-400">
              {formatCondition(step.endCondition, step.endConditionValue)}
            </p>
          </div>
        </div>
        <div>
          <span className="px-3 py-1 rounded-lg bg-zinc-950 text-zinc-300 font-bold border border-zinc-850 text-xs">
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
        <div className={`p-6 rounded-2xl bg-gradient-to-br border shadow-xl relative overflow-hidden ${sportBgColors[session.sport_type] || 'from-zinc-900 to-zinc-950 border-zinc-800'}`}>
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none ${sportGlows[session.sport_type] || 'bg-transparent'}`} />
          
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded bg-black/40 text-[9px] font-bold uppercase tracking-widest text-zinc-300 border border-zinc-800">
              {session.day_name}
            </span>
            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${sportTextColors[session.sport_type] || 'text-white'}`}>
              • {session.sport_type}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white capitalize leading-tight mb-4">
            {session.sport_type === 'fuerza' ? 'Fuerza y Acondicionamiento' : `Sesión de ${session.sport_type}`}
          </h2>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
            <div>
              <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Duración</p>
              <p className="text-base font-bold text-white mt-0.5">{session.duration_min} min</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Tipo</p>
              <p className="text-base font-bold text-white mt-0.5 capitalize">{session.sport_type}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Estado</p>
              <p className={`text-base font-bold mt-0.5 flex items-center gap-1 capitalize ${
                isCompleted ? 'text-green-400' : isMissed ? 'text-red-400' : 'text-amber-400'
              }`}>
                {isCompleted ? 'Completado' : isMissed ? 'Saltado' : 'Pendiente'}
              </p>
            </div>
          </div>
        </div>

        {/* Coaching Notes / Description */}
        <ProCard className="p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-550 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-cyan-400" />
            Notas del Entrenador
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed font-normal whitespace-pre-line">
            {adaptWorkoutDescription(session.description, session.sport_type, profile) || 'Sin notas descriptivas para este entrenamiento.'}
          </p>
        </ProCard>

        {/* Structured steps checklist */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Desglose Estructurado del Bloque
          </h3>
          
          <div className="space-y-3">
            {stepsList.length > 0 ? (
              stepsList.map((step, index) => renderStepCard(step, index))
            ) : (
              <ProCard className="p-6 text-center bg-zinc-950/20">
                <p className="text-sm text-zinc-400">Esta sesión no dispone de bloques de intervalos estructurados.</p>
                <p className="text-xs text-zinc-550 mt-1">Completa la sesión de forma continua basándote en la descripción.</p>
              </ProCard>
            )}
          </div>
        </div>

      </div>

      {/* Right Column (Sidebar details / zones / gear) */}
      <div className="space-y-6">
        
        {/* Actions panel */}
        <ProCard className="p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Acciones rápidas</h3>
          
          <div className="space-y-2">
            {!isCompleted && !isMissed && (
              <>
                <AnimatedButton 
                  variant="primary" 
                  className="w-full justify-center py-6 text-sm font-semibold shadow-lg shadow-cyan-500/10"
                  onClick={handleToggle}
                  disabled={loading}
                >
                  <Circle className="w-4 h-4 text-zinc-400" />
                  <span>Completar Entrenamiento</span>
                </AnimatedButton>

                <AnimatedButton
                  variant="ghost"
                  className="w-full justify-center py-6 border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                  onClick={handleToggleMissed}
                  disabled={loading}
                >
                  <XCircle className="w-4 h-4 text-zinc-500" />
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
                    <span className="text-zinc-300 font-medium">{gear}</span>
                    {hasGear ? (
                      <span className="text-[10px] text-green-400 font-semibold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">✓ En Garaje</span>
                    ) : (
                      <span className="text-[10px] text-orange-400 font-semibold bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">⚠️ Falta</span>
                    )}
                  </div>
                );
              })}

              {missingGear.length > 0 && (
                <div className="pt-3 border-t border-zinc-800">
                  <Link href={`/marketplace?search=${encodeURIComponent(missingGear[0])}`}>
                    <span className="w-full py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[11px] font-bold rounded-lg transition flex items-center justify-center gap-1 cursor-pointer">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Buscar Chollo local para {missingGear[0]}
                    </span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">No se especifica equipamiento especial.</p>
          )}
        </ProCard>

        {/* Physiological Zones guidance */}
        <ProCard className="p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Zonas de Intensidad</h3>
          <div className="space-y-3 pt-1 text-xs">
            <div className="flex items-start gap-2.5">
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-bold border border-zinc-700 text-[10px]">Z1</span>
              <div>
                <p className="font-semibold text-zinc-350">Recuperación Pasiva</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Fácil, conversación fluida. Ritmo regenerativo post-intervalos.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-bold border border-green-500/20 text-[10px]">Z2</span>
              <div>
                <p className="font-semibold text-zinc-300">Resistencia Aeróbica Base</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Esfuerzo moderado y sostenible. Base de la carga de volumen.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20 text-[10px]">Z3</span>
              <div>
                <p className="font-semibold text-zinc-300">Tempo / Ritmo Medio</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Exigente pero aeróbico. Ritmo de competición media distancia.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-bold border border-red-500/20 text-[10px]">Z4</span>
              <div>
                <p className="font-semibold text-zinc-300">Umbral Lactato / Series</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Zonas de series intensas. Mejora del VO2Máx y tolerancia al lactato.</p>
              </div>
            </div>
          </div>
        </ProCard>

      </div>

    </div>
  );
}
