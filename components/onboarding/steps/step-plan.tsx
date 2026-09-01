'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Trophy, Calendar, Flag, Dumbbell, Clock, Target, Zap, UserPlus, ChevronLeft, Loader2, Activity } from 'lucide-react';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';

const DISTANCE_LABELS: Record<string, string> = {
  sprint: 'Sprint',
  olimpico: 'Olímpico',
  half: 'Media (70.3)',
  full: 'Larga (Ironman)',
  '5k': '5K',
  '10k': '10K',
  medio_maraton: 'Media Maratón',
  maraton: 'Maratón',
  ultra: 'Ultra',
};

const MODALITY_LABELS: Record<string, string> = {
  triatlon: 'Triatlón',
  duatlon: 'Duatlón',
  acuatlon: 'Acuatlón',
  acuabike: 'Acuabike',
  cross: 'Cross',
  carrera: 'Running',
};

const LEVEL_LABELS: Record<string, string> = {
  principiante: 'Principiante',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

interface StepPlanProps {
  loading: boolean;
  summary: {
    raceName: string;
    raceDate: string | null;
    distance: string;
    modality: string;
    level: string;
    totalHours: number;
    targetTime: string;
  };
  inviteCode: string;
  setInviteCode: (v: string) => void;
  wantsCoach: boolean;
  setWantsCoach: (v: boolean) => void;
  onPrev: () => void;
  onSave: () => void;
  onConnect: (provider: 'strava' | 'garmin' | 'coros') => Promise<void>;
}

function SummaryItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-hover/50 border border-border-default">
      <div className="w-8 h-8 rounded-lg bg-surface-card border border-border-default flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold">{label}</p>
        <p className="text-sm font-bold text-text-primary truncate mt-0.5" title={value}>{value}</p>
      </div>
    </div>
  );
}

export function StepPlan(props: StepPlanProps) {
  const { summary } = props;
  const modalityLabel = MODALITY_LABELS[summary.modality] || summary.modality || 'Triatlón';

  const connectProviders: { id: 'strava' | 'garmin' | 'coros'; label: string; icon: string; hover: string }[] = [
    { id: 'garmin', label: 'Garmin', icon: '⌚', hover: 'hover:bg-swim/10 hover:border-swim/50 hover:ring-1 hover:ring-swim/50' },
    { id: 'strava', label: 'Strava', icon: '🔄', hover: 'hover:bg-coral-500/10 hover:border-coral-500/50 hover:ring-1 hover:ring-coral-500/50' },
    { id: 'coros', label: 'Coros', icon: '⏱️', hover: 'hover:bg-bike/10 hover:border-bike/50 hover:ring-1 hover:ring-bike/50' },
  ];

  return (
    <motion.div key="step-plan" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
      {/* Celebratory header */}
      <div className="text-center space-y-4 py-2">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }}
          className="w-20 h-20 rounded-full bg-coral-500/15 border-2 border-coral-500/40 flex items-center justify-center mx-auto"
        >
          <CheckCircle2 className="w-10 h-10 text-coral-500" />
        </motion.div>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-text-primary">¡Tu plan está listo!</h2>
          <p className="text-sm text-text-secondary font-medium mt-1.5 max-w-md mx-auto">
            La IA generará tu periodización al instante y verás tu primera semana de entrenamientos en el dashboard.
          </p>
        </div>
      </div>

      {/* Summary */}
      <ProCard className="bg-surface-card border border-border-default shadow-card">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <SummaryItem icon={<Trophy className="w-4 h-4 text-swim" />} label="Carrera" value={summary.raceName} />
          <SummaryItem icon={<Calendar className="w-4 h-4 text-swim" />} label="Fecha" value={summary.raceDate || 'Flexible'} />
          <SummaryItem icon={<Flag className="w-4 h-4 text-coral-500" />} label="Distancia" value={DISTANCE_LABELS[summary.distance] || summary.distance} />
          <SummaryItem icon={<Dumbbell className="w-4 h-4 text-bike" />} label="Nivel" value={LEVEL_LABELS[summary.level] || summary.level} />
          <SummaryItem icon={<Clock className="w-4 h-4 text-warning" />} label="Volumen" value={`${summary.totalHours}h/semana`} />
          <SummaryItem icon={<Target className="w-4 h-4 text-swim" />} label="Tiempo objetivo" value={summary.targetTime || '—'} />
        </div>
        <p className="text-[11px] text-text-muted font-medium mt-3 text-center">{modalityLabel} · Perfil guardado correctamente</p>
      </ProCard>

      {/* Optional connections */}
      <ProCard className="bg-surface-hover/30 border border-border-default">
        <div className="space-y-5">
          {/* Telemetry */}
          <div>
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Zap className="w-4 h-4 text-coral-500" /> Conecta tu reloj <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">(opcional)</span>
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              Sincroniza tus entrenamientos reales para que la IA ajuste tu plan cada día. Puedes hacerlo ahora o más tarde desde Ajustes.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-4">
              {connectProviders.map(provider => (
                <button
                  key={provider.id}
                  onClick={() => props.onConnect(provider.id)}
                  disabled={props.loading}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border border-border-default bg-surface-card transition-all group cursor-pointer ${provider.hover}`}
                >
                  <span className="text-2xl mb-2 block">{provider.icon}</span>
                  <span className="text-xs font-bold text-text-primary group-hover:text-swim transition-colors">{provider.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Coach (optional) */}
          <div className="border-t border-border-default pt-4">
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-bike" /> ¿Tienes un entrenador? <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">(opcional)</span>
            </h3>
            <input
              type="text"
              value={props.inviteCode}
              onChange={e => {
                const v = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '');
                props.setInviteCode(v);
                props.setWantsCoach(v.trim().length > 0);
              }}
              placeholder="CÓDIGO DE ENTRENADOR (opcional)"
              className="mt-3 w-full bg-surface-card border border-border-default rounded-xl px-4 py-3 text-sm text-swim placeholder-text-muted focus:bg-surface-card focus:border-bike focus:ring-1 focus:ring-bike outline-none transition-all font-bold tracking-widest uppercase"
            />
            <p className="text-xs text-text-muted mt-1.5">Si tu entrenador te dio un código, introdúcelo aquí y te vincularemos al guardar.</p>
          </div>
        </div>
      </ProCard>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-border-default">
        <button onClick={props.onPrev} className="px-6 py-3 text-sm font-semibold text-text-secondary hover:text-text-primary transition flex items-center cursor-pointer">
          <ChevronLeft className="w-4 h-4 mr-1" /> Atrás
        </button>
        <div className="flex flex-col items-end gap-1.5">
          <AnimatedButton variant="primary" onClick={props.onSave} disabled={props.loading} className="px-8 py-3 text-sm !bg-coral-500 hover:!bg-coral-600 !text-white min-w-[200px]">
            {props.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            {props.loading ? 'Generando plan...' : 'Crear mi plan'}
          </AnimatedButton>
          <button onClick={props.onSave} disabled={props.loading} className="text-xs font-semibold text-text-secondary hover:text-text-primary transition cursor-pointer disabled:opacity-50">
            Conectar más tarde
          </button>
        </div>
      </div>
    </motion.div>
  );
}
