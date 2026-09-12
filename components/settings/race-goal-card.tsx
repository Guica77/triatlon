'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface RaceGoalCardProps {
  planName: string;
  targetRaceName: string | null;
  targetRaceDate: string | null;
  targetFinishTime: string | null;
  targetSwimTime?: string | null;
  targetBikeTime?: string | null;
  targetRunTime?: string | null;
}

export function RaceGoalCard({ 
  planName, 
  targetRaceName, 
  targetRaceDate, 
  targetFinishTime,
  targetSwimTime,
  targetBikeTime,
  targetRunTime
}: RaceGoalCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-border-default bg-surface-card"
    >
      <div className="px-5 pb-3 pt-5">
        <p className="text-xs font-medium text-text-muted">Próximo objetivo</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight text-text-primary">{targetRaceName || planName || 'Carrera sin nombre'}</h2>
      </div>
      <div className="divide-y divide-border-subtle border-t border-border-subtle">
        <div className="flex items-center justify-between gap-4 px-5 py-3.5">
          <span className="text-sm text-text-secondary">Fecha</span>
          <span className="text-right text-sm font-medium text-text-primary" suppressHydrationWarning>{targetRaceDate ? new Date(targetRaceDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Por definir'}</span>
        </div>
        <div className="flex items-center justify-between gap-4 px-5 py-3.5">
          <span className="text-sm text-text-secondary">Objetivo</span>
          <span className="text-right text-sm font-medium text-text-primary">{targetFinishTime || 'Terminar y disfrutar'}</span>
        </div>
        {(targetSwimTime || targetBikeTime || targetRunTime) && (
          <div className="grid grid-cols-3 divide-x divide-border-subtle">
            <div className="px-3 py-3 text-center"><p className="text-xs text-text-muted">Nado</p><p className="mt-1 text-sm font-medium text-text-primary">{targetSwimTime || '—'}</p></div>
            <div className="px-3 py-3 text-center"><p className="text-xs text-text-muted">Bici</p><p className="mt-1 text-sm font-medium text-text-primary">{targetBikeTime || '—'}</p></div>
            <div className="px-3 py-3 text-center"><p className="text-xs text-text-muted">Carrera</p><p className="mt-1 text-sm font-medium text-text-primary">{targetRunTime || '—'}</p></div>
          </div>
        )}
      </div>
      <Link href="/onboarding" className="flex min-h-12 items-center justify-between px-5 text-sm font-medium text-accent transition-colors hover:bg-surface-hover">
        Editar objetivo
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </motion.div>
  );
}
