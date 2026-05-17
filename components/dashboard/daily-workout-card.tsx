'use client';

import * as React from 'react';
import { toggleWorkoutStatus } from '@/app/dashboard/actions';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { ZoneBadge } from '@/components/ui/zone-badge';
import { CheckCircle2, Circle, Clock, ChevronDown, ChevronUp, Flame, MessageSquarePlus, RefreshCw, Bell, Watch, Send, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkoutFeedbackModal } from '@/components/feedback/workout-feedback-modal';
import { simulateWatchIngestion } from '@/app/telemetry/telemetry-actions';
import { connectDeviceProvider, pushWorkoutToDevice } from '@/app/telemetry/workout-push-actions';

interface WorkoutCardProps {
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

export function DailyWorkoutCard({ workout }: WorkoutCardProps) {
  const [status, setStatus] = React.useState(workout.status);
  const [loading, setLoading] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = React.useState(false);
  const [syncLoading, setSyncLoading] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [pushLoading, setPushLoading] = React.useState(false);
  const [pushSuccess, setPushSuccess] = React.useState(false);

  const session = workout.training_sessions;
  if (!session) return null;

  const isCompleted = status === 'completed';

  const sportColors: Record<string, string> = {
    natacion: 'text-[var(--color-swim)] border-[var(--color-swim)]',
    ciclismo: 'text-[var(--color-bike)] border-[var(--color-bike)]',
    carrera: 'text-[var(--color-run)] border-[var(--color-run)]',
    brick: 'text-amber-400 border-amber-400',
    descanso: 'text-zinc-500 border-zinc-500',
  };

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

  // Parsear descripción para extraer zonas si es posible o mostrar badges genéricos
  const desc = session.description || '';
  const hasZ1 = desc.includes('Zona 1') || desc.includes('Z1');
  const hasZ2 = desc.includes('Zona 2') || desc.includes('Z2') || desc.includes('suave') || desc.includes('fácil');
  const hasZ3 = desc.includes('Zona 3') || desc.includes('Z3') || desc.includes('ritmo') || desc.includes('crol');
  const hasZ4 = desc.includes('Zona 4') || desc.includes('Z4') || desc.includes('series') || desc.includes('fuerte');

  return (
    <ProCard className={`space-y-6 transition-all duration-300 ${isCompleted ? 'border-zinc-800 bg-zinc-900/40 opacity-70' : ''}`}>
      
      {/* Esquina decorativa con el color del deporte */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none ${sportBgGlow[session.sport_type] || 'bg-transparent'}`} />

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
          <h3 className="text-xl font-medium text-zinc-50 capitalize">
            {session.sport_type === 'descanso' ? 'Día de Descanso' : `Sesión de ${session.sport_type}`}
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

      <div className="space-y-4 relative z-10">
        <p className={`text-sm text-zinc-300 leading-relaxed font-normal ${expanded ? '' : 'line-clamp-2'}`}>
          {desc}
        </p>

        {/* Zonas detectadas */}
        {session.sport_type !== 'descanso' && (
          <div className="flex flex-wrap gap-2 pt-1">
            {hasZ1 && <ZoneBadge zone={1} label="Z1 Recuperación" />}
            {hasZ2 && <ZoneBadge zone={2} label="Z2 Resistencia Base" />}
            {hasZ3 && <ZoneBadge zone={3} label="Z3 Tempo / Ritmo" />}
            {hasZ4 && <ZoneBadge zone={4} label="Z4 Umbral" />}
            {!hasZ1 && !hasZ2 && !hasZ3 && !hasZ4 && <ZoneBadge zone={2} label="Z2 Aeróbico Base" />}
          </div>
        )}
      </div>

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

      {/* Botones de acción principales */}
      <div className="pt-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center relative z-10">
        {session.sport_type !== 'descanso' ? (
          <div className="flex-1 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <AnimatedButton 
              variant={isCompleted ? "secondary" : "primary"} 
              className="flex-1 justify-center py-6"
              onClick={handleToggle}
              disabled={loading || syncLoading}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-zinc-300">Completado</span>
                </>
              ) : (
                <>
                  <Circle className="w-5 h-5 text-zinc-400" />
                  <span>Marcar como Completado</span>
                </>
              )}
            </AnimatedButton>

            {!isCompleted ? (
              <AnimatedButton
                variant="ghost"
                className="py-6 border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 flex items-center justify-center gap-2"
                onClick={async () => {
                  if (syncLoading) return;
                  setSyncLoading(true);
                  const res = await simulateWatchIngestion(workout.id, session.sport_type);
                  setSyncLoading(false);
                  if (res?.success) {
                    setStatus('completed');
                    setToastMsg(res.message || 'Actividad sincronizada');
                  }
                }}
                disabled={syncLoading || loading}
              >
                <RefreshCw className={`w-5 h-5 ${syncLoading ? 'animate-spin' : ''}`} />
                <span>Sincronizar Reloj / Strava</span>
              </AnimatedButton>
            ) : (
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
          <div className="flex-1 p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center text-xs text-zinc-500 uppercase tracking-widest">
            Disfruta tu py-descanso
          </div>
        )}

        <AnimatedButton 
          variant="secondary" 
          size="icon"
          onClick={() => setExpanded(!expanded)}
          aria-label="Ver detalles"
          className="self-center"
        >
          {expanded ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
        </AnimatedButton>
      </div>

      {/* Sección de Exportación y Push a Relojes (Garmin / Strava / Coros) */}
      {session.sport_type !== 'descanso' && !isCompleted && (
        <div className="pt-2 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Watch className="w-4 h-4 text-purple-400" />
            <span>Sincronización Estructurada (Series & Potencia):</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!isConnected ? (
              <AnimatedButton
                variant="ghost"
                className="w-full sm:w-auto py-4 px-4 border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/50 flex items-center justify-center gap-2 text-xs"
                onClick={async () => {
                  const res = await connectDeviceProvider('garmin');
                  if (res?.success) {
                    setIsConnected(true);
                    setToastMsg(res.message || 'Garmin conectado');
                  }
                }}
              >
                <Watch className="w-4 h-4" />
                <span>Conectar con Garmin / Strava</span>
              </AnimatedButton>
            ) : pushSuccess ? (
              <span className="px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>⌚ Sincronizado con Garmin</span>
              </span>
            ) : (
              <AnimatedButton
                variant="ghost"
                className="w-full sm:w-auto py-4 px-4 border border-purple-500/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/50 flex items-center justify-center gap-2 text-xs"
                onClick={async () => {
                  if (pushLoading) return;
                  setPushLoading(true);
                  const res = await pushWorkoutToDevice(workout.id, 'garmin');
                  setPushLoading(false);
                  if (res?.success) {
                    setPushSuccess(true);
                    setToastMsg(res.message || 'Enviado a reloj');
                  } else if (res?.error) {
                    setToastMsg(res.error);
                  }
                }}
                disabled={pushLoading}
              >
                <Send className={`w-4 h-4 ${pushLoading ? 'animate-bounce' : ''}`} />
                <span>{pushLoading ? 'Enviando...' : 'Enviar a Reloj'}</span>
              </AnimatedButton>
            )}
          </div>
        </div>
      )}

      <WorkoutFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        workoutId={workout.id}
        workoutTitle={`Sesión de ${session.sport_type} • ${session.day_name}`}
      />
    </ProCard>
  );
}
