'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Trophy, ArrowRight, Calendar, Target } from 'lucide-react';
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
      className="p-6 rounded-2xl bg-surface-card border border-border-default shadow-card relative overflow-hidden h-full flex flex-col"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-swim/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-full justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-md bg-swim/10 text-swim text-[10px] font-black uppercase tracking-wider border border-swim/20">
              Objetivo Actual
            </span>
          </div>
          <h3 className="text-2xl font-black text-text-primary tracking-tight leading-tight">{targetRaceName || planName || 'Carrera sin nombre'}</h3>
          
          <div className="flex flex-col gap-3 mt-5">
            <div className="flex items-center gap-2 text-text-primary text-sm font-medium bg-surface-hover p-2.5 rounded-lg border border-border-subtle/80">
              <div className="w-8 h-8 rounded-md bg-swim/10 border border-swim/20 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-swim" />
              </div>
              <div>
                <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Fecha del Evento</p>
                <p className="font-semibold text-text-primary" suppressHydrationWarning>{targetRaceDate ? new Date(targetRaceDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Fecha por definir'}</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 bg-surface-hover p-3 rounded-lg border border-border-subtle/80">
              <div className="flex items-center gap-2 text-text-primary text-sm font-medium">
                <div className="w-8 h-8 rounded-md bg-swim/10 border border-swim/20 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 text-swim" />
                </div>
                <div>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold">Meta o Marca Total</p>
                  <p className="text-swim font-black">{targetFinishTime || 'Terminar / Disfrutar'}</p>
                </div>
              </div>
              
              {(targetSwimTime || targetBikeTime || targetRunTime) && (
                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-border-default text-center">
                  <div className="bg-surface-card p-1.5 rounded border border-border-default ">
                    <span className="text-[9px] text-text-muted uppercase font-bold block">Natación</span>
                    <span className="text-xs text-swim font-bold block mt-0.5">{targetSwimTime || '--'}</span>
                  </div>
                  <div className="bg-surface-card p-1.5 rounded border border-border-default ">
                    <span className="text-[9px] text-text-muted uppercase font-bold block">Ciclismo</span>
                    <span className="text-xs text-bike font-bold block mt-0.5">{targetBikeTime || '--'}</span>
                  </div>
                  <div className="bg-surface-card p-1.5 rounded border border-border-default ">
                    <span className="text-[9px] text-text-muted uppercase font-bold block">Carrera</span>
                    <span className="text-xs text-run font-bold block mt-0.5">{targetRunTime || '--'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 mt-auto">
          <Link
            href="/onboarding"
            className="w-full min-h-11 py-3 rounded-xl bg-swim fine-hover:bg-swim/90 text-white text-xs font-extrabold transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-out active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-swim/50"
          >
            <Trophy className="w-4 h-4" />
            Reconfigurar Plan y Objetivo
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
