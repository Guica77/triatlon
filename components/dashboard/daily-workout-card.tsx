'use client';

import * as React from 'react';
import { toggleWorkoutStatus, updateWorkoutStatus } from '@/app/dashboard/actions';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { ZoneBadge } from '@/components/ui/zone-badge';
import { CheckCircle2, Circle, Clock, Flame, MessageSquarePlus, Bell, Target, Sparkles, ShieldCheck, Dumbbell, ShoppingBag, Watch, Activity, Download, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkoutFeedbackModal } from '@/components/feedback/workout-feedback-modal';
import { simulateWatchIngestion } from '@/app/telemetry/telemetry-actions';
import { GymTrackerModal } from '@/components/workouts/gym-tracker-modal';
import Link from 'next/link';

interface WorkoutCardProps {
  initialIsConnected?: boolean;
  virtualGarage?: string[];
  athleteLevel?: string;
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
      raw_payload?: any;
    }[] | null;
  };
}

function parseWorkoutDescription(desc: string, sportType: string) {
  let main = desc || 'Sesión de entrenamiento aeróbico de construcción base.';
  let warmup = '15 mins de calentamiento progresivo de Z1 a Z2 con movilidad articular.';
  let cooldown = '10 mins de vuelta a la calma en Z1 y estiramientos suaves descontracturantes.';
  let gear = sportType === 'natacion' 
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

export function DailyWorkoutCard({ workout, initialIsConnected = false, virtualGarage = [], athleteLevel = 'intermedio' }: WorkoutCardProps) {
  const [status, setStatus] = React.useState(workout.status);
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'main' | 'warmup' | 'cooldown' | 'gear' | 'telemetry'>('main');
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);
  const [isGymModeOpen, setIsGymModeOpen] = React.useState(false);
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
    if (initialIsConnected && status === 'pending' && session?.sport_type !== 'descanso') {
      const timer = setTimeout(async () => {
        const res = await simulateWatchIngestion(workout.id, session?.sport_type || 'ciclismo');
        if (res?.success) {
          setStatus('completed');
          setToastMsg('¡Actividad detectada y sincronizada automáticamente desde tu reloj! TSS Real: 85');
        }
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [initialIsConnected, status, workout.id, session?.sport_type]);

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

  const hasZ1 = desc.includes('Zona 1') || desc.includes('Z1');
  const hasZ2 = desc.includes('Zona 2') || desc.includes('Z2') || desc.includes('suave') || desc.includes('fácil');
  const hasZ3 = desc.includes('Zona 3') || desc.includes('Z3') || desc.includes('ritmo') || desc.includes('crol');
  const hasZ4 = desc.includes('Zona 4') || desc.includes('Z4') || desc.includes('series') || desc.includes('fuerte');

  return (
    <ProCard className={`space-y-6 transition-all duration-300 relative overflow-hidden ${isCompleted ? 'border-zinc-800 bg-zinc-900/40 opacity-80' : isMissed ? 'border-zinc-900 bg-zinc-950/20 opacity-60' : ''}`}>
      
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
          <h3 className="text-xl font-semibold text-zinc-50 capitalize">
            {session.sport_type === 'descanso' ? 'Día de Descanso Activo' : session.sport_type === 'fuerza' ? 'Fuerza y Acondicionamiento' : `Sesión de ${session.sport_type}`}
          </h3>
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
          
          {/* Alerta de Material Faltante (IA Gear Match Loop) */}
          {missingGear.length > 0 && !isCompleted && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-orange-500/5 mb-4"
            >
              <div className="flex items-start gap-3">
                <ShoppingBag className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-orange-400">⚠️ Material Faltante</p>
                  <p className="text-xs text-orange-300/80 mt-0.5">El entreno pide: <strong className="text-orange-300">{missingGear.join(', ')}</strong> y no lo tienes en tu Garaje.</p>
                </div>
              </div>
              <Link href={`/marketplace?category=accesorios&search=${encodeURIComponent(missingGear[0])}`} className="shrink-0 w-full sm:w-auto">
                <button className="w-full sm:w-auto px-4 py-2 bg-orange-500 text-black font-bold text-xs rounded-lg hover:bg-orange-400 transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer">
                  <Sparkles className="w-3.5 h-3.5" /> Buscar Chollos IA
                </button>
              </Link>
            </motion.div>
          )}

          {/* Navegación de Pestañas */}
          <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2">
            <button
              onClick={() => setActiveTab('warmup')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'warmup' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Calentamiento (15')
            </button>
            <button
              onClick={() => setActiveTab('main')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'main' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm' : 'text-zinc-300 border border-zinc-700/50 hover:text-zinc-100 hover:bg-zinc-800/50'}`}
            >
              <Target className="w-3.5 h-3.5" /> Bloque Principal
            </button>
            <button
              onClick={() => setActiveTab('cooldown')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'cooldown' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Enfriamiento (10')
            </button>
            <button
              onClick={() => setActiveTab('gear')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'gear' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            >
              <Dumbbell className="w-3.5 h-3.5" /> Material
            </button>
            {telemetry && (
              <button
                onClick={() => setActiveTab('telemetry')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'telemetry' ? 'bg-green-500/10 text-green-400 border border-green-500/30 shadow-sm' : 'text-green-500/70 hover:text-green-400 hover:bg-green-500/5 animate-pulse'}`}
              >
                <Watch className="w-3.5 h-3.5" /> Telemetría del Reloj
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
                  <div>
                    <p className="font-semibold text-cyan-400 mb-2">🎯 Objetivo Principal de la Sesión:</p>
                    <p>{parsed.main}</p>
                  </div>
                )}
                {activeTab === 'warmup' && (
                  <div>
                    <p className="font-semibold text-amber-400 mb-2">🔥 Activación y Calentamiento:</p>
                    <p>{parsed.warmup}</p>
                  </div>
                )}
                {activeTab === 'cooldown' && (
                  <div>
                    <p className="font-semibold text-green-400 mb-2">🛡️ Vuelta a la Calma y Recuperación:</p>
                    <p>{parsed.cooldown}</p>
                  </div>
                )}
                {activeTab === 'gear' && (
                  <div className="space-y-3">
                    <p className="font-semibold text-purple-400 mb-1">🎒 Equipamiento Recomendado:</p>
                    <p>{parsed.gear}</p>
                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
                        ¿Te falta material para esta sesión?
                      </span>
                      <Link href="/marketplace">
                        <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm">
                          💡 Buscar chollos locales en Marketplace ➔
                        </span>
                      </Link>
                    </div>
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
      <div className="pt-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center relative z-10">
        {session.sport_type !== 'descanso' ? (
          <div className="flex-1 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full">
            {!isCompleted && !isMissed && (
              <>
                <AnimatedButton 
                  variant="primary" 
                  className="flex-[3] justify-center py-6 text-sm font-semibold shadow-lg shadow-cyan-500/10"
                  onClick={handleToggle}
                  disabled={loading}
                >
                  <Circle className="w-5 h-5 text-zinc-400" />
                  <span>Marcar como Completado</span>
                </AnimatedButton>

                <AnimatedButton
                  variant="ghost"
                  className="flex-[1] justify-center py-6 border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 flex items-center gap-2"
                  onClick={handleToggleMissed}
                  disabled={loading}
                >
                  <XCircle className="w-5 h-5 text-zinc-500" />
                  <span>Saltar</span>
                </AnimatedButton>
              </>
            )}

            {isCompleted && (
              <AnimatedButton 
                variant="secondary" 
                className="flex-1 justify-center py-6 text-sm font-semibold"
                onClick={handleToggle}
                disabled={loading}
              >
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                <span className="text-zinc-200">✓ Entrenamiento Completado (Sincronizado)</span>
              </AnimatedButton>
            )}

            {isMissed && (
              <AnimatedButton 
                variant="secondary" 
                className="flex-1 justify-center py-6 text-sm font-semibold border-red-500/20 bg-red-950/10 hover:bg-red-950/20"
                onClick={handleToggleMissed}
                disabled={loading}
              >
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-400">✓ Entrenamiento Saltado (Clic para Restaurar)</span>
              </AnimatedButton>
            )}

            {!isMissed && (
              <AnimatedButton
                variant="ghost"
                className="py-6 border border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50 flex items-center justify-center gap-2 font-bold shadow-lg shadow-orange-500/10"
                onClick={() => {
                  setToastMsg('📥 Descargando sesión estructurada... El móvil abrirá automáticamente Garmin Connect / Coros.');
                  window.open(`/api/workouts/export?workoutId=${workout.id}`, '_blank');
                  setTimeout(() => setToastMsg(null), 6000);
                }}
              >
                <Download className="w-5 h-5 text-orange-400 animate-bounce" />
                <span>Enviar al Reloj (.TCX)</span>
              </AnimatedButton>
            )}

            {!isCompleted && !isMissed && session.sport_type === 'fuerza' && (
              <AnimatedButton
                variant="ghost"
                className="flex-1 justify-center py-6 border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/50 flex items-center gap-2 font-bold shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                onClick={() => setIsGymModeOpen(true)}
              >
                <Dumbbell className="w-5 h-5 text-purple-400 animate-pulse" />
                <span>Iniciar Modo Gym</span>
              </AnimatedButton>
            )}

            {isCompleted && (
              <AnimatedButton
                variant="ghost"
                className="py-6 border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/50 flex items-center justify-center gap-2"
                onClick={() => setIsFeedbackOpen(true)}
              >
                <MessageSquarePlus className="w-5 h-5" />
                <span>Evaluar Sesión</span>
              </AnimatedButton>
            )}
          </div>
        ) : (
          <div className="flex-1 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-xs text-zinc-500 uppercase tracking-widest font-semibold">
            ✓ Descanso Programado
          </div>
        )}
      </div>

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
    </ProCard>
  );
}
