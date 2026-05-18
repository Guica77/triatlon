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
}

export function RaceGoalCard({ planName, targetRaceName, targetRaceDate, targetFinishTime }: RaceGoalCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-zinc-900 to-zinc-950 border border-cyan-500/30 shadow-2xl relative overflow-hidden group h-full flex flex-col"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all duration-500" />
      
      <div className="relative z-10 flex flex-col h-full justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-400 text-[10px] font-bold uppercase tracking-wider border border-cyan-500/30">
              Objetivo Actual
            </span>
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight leading-tight">{targetRaceName || planName || 'Carrera sin nombre'}</h3>
          
          <div className="flex flex-col gap-3 mt-5">
            <div className="flex items-center gap-2 text-zinc-300 text-sm font-medium bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/80">
              <div className="w-8 h-8 rounded-md bg-cyan-500/10 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Fecha del Evento</p>
                <p>{targetRaceDate ? new Date(targetRaceDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Fecha por definir'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-zinc-300 text-sm font-medium bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/80">
              <div className="w-8 h-8 rounded-md bg-cyan-500/10 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Meta o Marca</p>
                <p className="text-cyan-100 font-bold">{targetFinishTime || 'Terminar / Disfrutar'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 mt-auto">
          <Link href="/onboarding">
            <button className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/20">
              <Trophy className="w-4 h-4" />
              Reconfigurar Plan y Objetivo
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
