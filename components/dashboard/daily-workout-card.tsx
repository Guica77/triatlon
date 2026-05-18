'use client';

import * as React from 'react';
import { toggleWorkoutStatus } from '@/app/dashboard/actions';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { ZoneBadge } from '@/components/ui/zone-badge';
import { CheckCircle2, Circle, Clock, Flame, MessageSquarePlus, Bell, Target, Sparkles, ShieldCheck, Dumbbell, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkoutFeedbackModal } from '@/components/feedback/workout-feedback-modal';
import { simulateWatchIngestion } from '@/app/telemetry/telemetry-actions';
import Link from 'next/link';

interface WorkoutCardProps {
  initialIsConnected?: boolean;
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
    };
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

export function DailyWorkoutCard({ workout, initialIsConnected = false }: WorkoutCardProps) {
  const [status, setStatus] = React.useState(workout.status);
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'main' | 'warmup' | 'cooldown' | 'gear'>('main');
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const session = workout.training_sessions;

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

  const isCompleted = status === 'completed';

  const sportBgGlow: Record<string, string> = {
    natacion: 'bg-[var(--color-swim)]/5',
    ciclismo: 'bg-[var(--color-bike)]/5',
    carrera: 'bg-[var(--color-run)]/5',
    brick: 'bg-amber-400/5',
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

  const desc = session.description || '';
  const parsed = parseWorkoutDescription(desc, session.sport_type);

  const hasZ1 = desc.includes('Zona 1') || desc.includes('Z1');
  const hasZ2 = desc.includes('Zona 2') || desc.includes('Z2') || desc.includes('suave') || desc.includes('fácil');
  const hasZ3 = desc.includes('Zona 3') || desc.includes('Z3') || desc.includes('ritmo') || desc.includes('crol');
  const hasZ4 = desc.includes('Zona 4') || desc.includes('Z4') || desc.includes('series') || desc.includes('fuerte');

  return (
    <ProCard className={`space-y-6 transition-all duration-300 relative overflow-hidden ${isCompleted ? 'border-zinc-800 bg-zinc-900/40 opacity-80' : ''}`}>
      
      {/* Esquina decorativa con el color del deporte */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none ${sportBgGlow[session.sport_type] || 'bg-transparent'}`} />

      {/* Cabecera Limpia */}
      <div className="flex justify-between items-start border-b border-[var(--color-border)] pb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`w-2 h-2 rounded-full ${session.sport_type === 'natacion' ? 'bg-[var(--color-swim)]' : session.sport_type === 'ciclismo' ? 'bg-[var(--color-bike)]' : session.sport_type === 'carrera' ? 'bg-[var(--color-run)]' : 'bg-amber-400'}`} />
            <p className="text-zinc-400 font-medium tracking-wider uppercase text-xs">
              {session.sport_type} • {session.day_name}
            </p>
            {workout.auto_adjusted && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                <Flame className="w-3 h-3" />
                <span>Reajustado por Fatiga</span>
              </span>
            )}
          </div>
          <h3 className="text-xl font-semibold text-zinc-50 capitalize">
            {session.sport_type === 'descanso' ? 'Día de Descanso Activo' : `Sesión de ${session.sport_type}`}
          </h3>
        </div>

        {session.duration_min > 0 && (
          <div className="text-right flex items-center gap-1.5 text-zinc-300 font-light">
            <Clock className="w-4 h-4 text-zinc-500" />
            <span className="text-2xl font-light text-zinc-50">{session.duration_min}</span>
            <span className="text-xs text-zinc-500">min</span>
          </div>
        )}
      </div>

      {/* Contenido Principal con Pestañas (Tabbed View) */}
      {session.sport_type !== 'descanso' ? (
        <div className="space-y-4 relative z-10">
          
          {/* Navegación de Pestañas */}
          <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2">
            <button
              onClick={() => setActiveTab('main')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'main' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            >
              <Target className="w-3.5 h-3.5" /> Bloque Principal
            </button>
            <button
              onClick={() => setActiveTab('warmup')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${activeTab === 'warmup' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Calentamiento (15')
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
          <div className="flex-1 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <AnimatedButton 
              variant={isCompleted ? "secondary" : "primary"} 
              className="flex-1 justify-center py-6 text-sm font-semibold shadow-lg shadow-cyan-500/10"
              onClick={handleToggle}
              disabled={loading}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-zinc-200">✓ Entrenamiento Completado (Sincronizado)</span>
                </>
              ) : (
                <>
                  <Circle className="w-5 h-5 text-zinc-400" />
                  <span>Marcar como Completado</span>
                </>
              )}
            </AnimatedButton>

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
    </ProCard>
  );
}
