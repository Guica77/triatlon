'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Wrench, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';

const VIRTUAL_GARAGE_ITEMS = [
  { id: 'Bici Carretera', label: 'Bici Carretera', icon: '🚴‍♂️', desc: 'Ruta' },
  { id: 'Cabra Triatlón', label: 'Cabra Triatlón', icon: '🚴‍♂️', desc: 'Aero TT' },
  { id: 'Neopreno', label: 'Neopreno', icon: '🩱', desc: 'Aguas Abiertas' },
  { id: 'Ruedas Carbono', label: 'Ruedas Carbono', icon: '⭕', desc: 'Perfil Aero' },
  { id: 'Potenciómetro', label: 'Potenciómetro', icon: '⚡', desc: 'Vatios' },
  { id: 'Casco Aero', label: 'Casco Aero', icon: '🪖', desc: 'TT MIPS' },
  { id: 'Palas de Natación', label: 'Palas Natación', icon: '🎒', desc: 'Fuerza' },
  { id: 'Aletas de Natación', label: 'Aletas Natación', icon: '🎒', desc: 'Técnica' },
];

interface StepGarageProps {
  virtualGarage: string[];
  toggleGear: (id: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function StepGarage(props: StepGarageProps) {
  return (
    <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
      <ProCard className="space-y-6">
        <div className="border-b border-zinc-800/80 pb-4">
          <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2"><Wrench className="w-5 h-5 text-amber-400" /> Garaje Virtual</h2>
          <p className="text-sm text-zinc-400 mt-1">Selecciona el material que ya posees. La IA usará esto para sugerirte chollos en entrenamientos donde te falte equipamiento.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {VIRTUAL_GARAGE_ITEMS.map(item => {
            const isSelected = props.virtualGarage.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => props.toggleGear(item.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                  isSelected 
                    ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] scale-105' 
                    : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-600'
                }`}
              >
                <span className="text-2xl mb-2 block">{item.icon}</span>
                <span className={`text-xs font-bold text-center block ${isSelected ? 'text-amber-400' : 'text-zinc-300'}`}>{item.label}</span>
                <span className="text-[10px] text-zinc-500 mt-1">{item.desc}</span>
                {isSelected && <div className="absolute top-2 right-2 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-black stroke-[3]" /></div>}
              </button>
            );
          })}
        </div>
        
        <div className="flex justify-between pt-4 border-t border-zinc-800/80">
          <button onClick={props.onPrev} className="px-6 py-3 text-sm font-semibold text-zinc-400 hover:text-white transition flex items-center"><ChevronLeft className="w-4 h-4 mr-1" /> Atrás</button>
          <AnimatedButton variant="primary" onClick={props.onNext} className="px-8 py-3 text-sm !bg-amber-500 hover:!bg-amber-400 !text-black shadow-amber-500/20">
            Continuar <ChevronRight className="w-4 h-4 ml-1" />
          </AnimatedButton>
        </div>
      </ProCard>
    </motion.div>
  );
}
