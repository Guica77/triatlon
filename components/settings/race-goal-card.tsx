'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
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
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-white border border-zinc-200 shadow-sm relative overflow-hidden group h-full flex flex-col"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/10 transition-all duration-500" />
      
      <div className="relative z-10 flex flex-col h-full justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-md bg-cyan-50 text-cyan-600 text-[10px] font-black uppercase tracking-wider border border-cyan-100">
              Objetivo Actual
            </span>
          </div>
          <h3 className="text-2xl font-black text-zinc-900 tracking-tight leading-tight">{targetRaceName || planName || 'Carrera sin nombre'}</h3>
          
          <div className="flex flex-col gap-3 mt-5">
            <div className="flex items-center gap-2 text-zinc-800 text-sm font-medium bg-zinc-50 p-2.5 rounded-lg border border-zinc-200/80">
              <div className="w-8 h-8 rounded-md bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-cyan-600" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-450 uppercase tracking-wider font-bold">Fecha del Evento</p>
                <p className="font-semibold text-zinc-800">{targetRaceDate ? new Date(targetRaceDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Fecha por definir'}</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 bg-zinc-50 p-3 rounded-lg border border-zinc-200/80">
              <div className="flex items-center gap-2 text-zinc-800 text-sm font-medium">
                <div className="w-8 h-8 rounded-md bg-cyan-50 border border-cyan-100 flex items-center justify-center shrink-0">
                  <Target className="w-4 h-4 text-cyan-600" />
                </div>
                <div>
                  <p className="text-[10px] text-zinc-450 uppercase tracking-wider font-bold">Meta o Marca Total</p>
                  <p className="text-cyan-650 font-black">{targetFinishTime || 'Terminar / Disfrutar'}</p>
                </div>
              </div>
              
              {(targetSwimTime || targetBikeTime || targetRunTime) && (
                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-zinc-200 text-center">
                  <div className="bg-white p-1.5 rounded border border-zinc-200 shadow-sm">
                    <span className="text-[9px] text-zinc-450 uppercase font-bold block">Natación</span>
                    <span className="text-xs text-sky-600 font-bold block mt-0.5">{targetSwimTime || '--'}</span>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-zinc-200 shadow-sm">
                    <span className="text-[9px] text-zinc-450 uppercase font-bold block">Ciclismo</span>
                    <span className="text-xs text-emerald-600 font-bold block mt-0.5">{targetBikeTime || '--'}</span>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-zinc-200 shadow-sm">
                    <span className="text-[9px] text-zinc-450 uppercase font-bold block">Carrera</span>
                    <span className="text-xs text-rose-600 font-bold block mt-0.5">{targetRunTime || '--'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 mt-auto">
          <Link href="/onboarding">
            <button className="w-full py-3 rounded-xl bg-cyan-650 hover:bg-cyan-550 text-white text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md">
              <Trophy className="w-4 h-4" />
              Reconfigurar Plan y Objetivo
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
