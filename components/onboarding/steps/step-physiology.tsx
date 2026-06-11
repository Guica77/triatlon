'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';

interface StepPhysiologyProps {
  wantsCoach: boolean;
  setWantsCoach: (v: boolean) => void;
  currentFtp: string;
  setCurrentFtp: (v: string) => void;
  currentSwimPace: string;
  setCurrentSwimPace: (v: string) => void;
  currentRunPace: string;
  setCurrentRunPace: (v: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function StepPhysiology(props: StepPhysiologyProps) {
  return (
    <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
      <ProCard className="space-y-6">
        <div className="border-b border-zinc-800/80 pb-4">
          <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-400" /> Calibración Fisiológica</h2>
          <p className="text-sm text-zinc-400 mt-1">Introduce tus zonas actuales. Si no las sabes, las estimaremos automáticamente por IA.</p>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-medium text-zinc-400 block uppercase tracking-wider">Modalidad de Entrenamiento</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => props.setWantsCoach(false)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                !props.wantsCoach 
                  ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)] ring-1 ring-cyan-500' 
                  : 'bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-bold text-sm">IA Autónoma</span>
                {!props.wantsCoach && <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
              </div>
              <span className="text-[10px] opacity-80 font-medium">Planificación 100% generada por IA</span>
            </button>
            
            <button
              onClick={() => props.setWantsCoach(true)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                props.wantsCoach 
                  ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)] ring-1 ring-orange-500' 
                  : 'bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-bold text-sm">Entrenador Humano</span>
                {props.wantsCoach && <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />}
              </div>
              <span className="text-[10px] opacity-80 font-medium">Solicitar conexión con un Coach (Recomendado)</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-zinc-800/50">
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-2 uppercase tracking-wider">FTP Ciclismo (W)</label>
            <input type="number" placeholder="Ej. 250" value={props.currentFtp} onChange={e => props.setCurrentFtp(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:border-emerald-500 outline-none transition-all" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-2 uppercase tracking-wider">Ritmo Natación (/100m)</label>
            <input type="text" placeholder="Ej. 01:45" value={props.currentSwimPace} onChange={e => props.setCurrentSwimPace(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:border-emerald-500 outline-none transition-all" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-2 uppercase tracking-wider">Ritmo Carrera (/km)</label>
            <input type="text" placeholder="Ej. 04:30" value={props.currentRunPace} onChange={e => props.setCurrentRunPace(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:border-emerald-500 outline-none transition-all" />
          </div>
        </div>
        
        <div className="flex justify-between pt-4 border-t border-zinc-800/80">
          <button onClick={props.onPrev} className="px-6 py-3 text-sm font-semibold text-zinc-400 hover:text-white transition flex items-center"><ChevronLeft className="w-4 h-4 mr-1" /> Atrás</button>
          <AnimatedButton variant="primary" onClick={props.onNext} className="px-8 py-3 text-sm !bg-emerald-500 hover:!bg-emerald-400 !text-black shadow-emerald-500/20">
            Continuar <ChevronRight className="w-4 h-4 ml-1" />
          </AnimatedButton>
        </div>
      </ProCard>
    </motion.div>
  );
}
