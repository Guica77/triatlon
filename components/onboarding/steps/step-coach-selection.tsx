'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, ChevronLeft, Search, Loader2 } from 'lucide-react';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';

interface StepCoachSelectionProps {
  inviteCode: string;
  setInviteCode: (v: string) => void;
  onNext: () => void;
  onPrev: () => void;
  onSearchDirectory: () => void;
  loading?: boolean;
}

export function StepCoachSelection(props: StepCoachSelectionProps) {
  return (
    <motion.div key="step-coach" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
      <ProCard className="space-y-6">
        <div className="border-b border-zinc-800/80 pb-4">
          <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2"><UserPlus className="w-5 h-5 text-orange-400" /> Elección de Entrenador</h2>
          <p className="text-sm text-zinc-400 mt-1">Conéctate con tu entrenador o busca uno en nuestro directorio.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Option 1: Invite Code */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col items-center text-center space-y-4">
            <h3 className="text-sm font-bold text-zinc-100">Ya tengo un código</h3>
            <p className="text-xs text-zinc-400">Si tu entrenador te ha dado su código de invitación (Ej: GUILLEPRO), introdúcelo aquí.</p>
            
            <input 
              type="text" 
              value={props.inviteCode} 
              onChange={e => props.setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))} 
              placeholder="CÓDIGO DE ENTRENADOR" 
              className="w-full max-w-[200px] bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-cyan-400 focus:border-cyan-500 outline-none transition-all text-center font-bold tracking-widest uppercase" 
            />
            
            <AnimatedButton 
              variant="primary" 
              onClick={props.onNext} 
              disabled={!props.inviteCode.trim() || props.loading}
              className="w-full max-w-[200px] py-3 text-xs !bg-emerald-500 hover:!bg-emerald-400 !text-black"
            >
              {props.loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Vincular y Continuar'}
            </AnimatedButton>
          </div>

          {/* Option 2: Search Directory */}
          <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col items-center text-center space-y-4 justify-between">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-100">Busco un entrenador</h3>
              <p className="text-xs text-zinc-400">Entra a la aplicación y busca en nuestro directorio de entrenadores profesionales para encontrar el que mejor se adapte a ti.</p>
            </div>
            
            <AnimatedButton 
              variant="primary" 
              onClick={props.onSearchDirectory} 
              disabled={props.loading}
              className="w-full max-w-[200px] py-3 text-xs !bg-cyan-500 hover:!bg-cyan-400 !text-black flex items-center justify-center gap-2"
            >
              {props.loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
                <>
                  <Search className="w-3.5 h-3.5" /> Explorar Directorio
                </>
              )}
            </AnimatedButton>
          </div>

        </div>

        <div className="flex justify-between pt-4 border-t border-zinc-800/80 mt-4">
          <button onClick={props.onPrev} className="px-6 py-3 text-sm font-semibold text-zinc-400 hover:text-white transition flex items-center"><ChevronLeft className="w-4 h-4 mr-1" /> Atrás</button>
        </div>
      </ProCard>
    </motion.div>
  );
}
