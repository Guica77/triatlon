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
      <ProCard className="space-y-6 bg-surface-card border border-border-default shadow-card">
        <div className="border-b border-border-default pb-4">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2"><Wrench className="w-5 h-5 text-coral-500" /> Garaje Virtual</h2>
          <p className="text-sm text-text-secondary mt-1">Selecciona el material que ya posees. La IA usará esto para sugerirte chollos en entrenamientos donde te falte equipamiento.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {VIRTUAL_GARAGE_ITEMS.map(item => {
            const isSelected = props.virtualGarage.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => props.toggleGear(item.id)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer relative ${
                  isSelected 
                    ? 'bg-coral-500/10 border-coral-500 text-coral-500 ring-1 ring-coral-500  scale-105 font-semibold' 
                    : 'bg-surface-hover/30 border-border-default text-text-secondary hover:border-border-default hover:bg-surface-hover'
                }`}
              >
                <span className="text-2xl mb-2 block">{item.icon}</span>
                <span className={`text-xs font-bold text-center block ${isSelected ? 'text-coral-500' : 'text-text-primary'}`}>{item.label}</span>
                <span className="text-[10px] text-text-secondary mt-1">{item.desc}</span>
                {isSelected && <div className="absolute top-2 right-2 w-4 h-4 bg-coral-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white stroke-[3]" /></div>}
              </button>
            );
          })}
        </div>
        
        <div className="flex justify-between pt-4 border-t border-border-default">
          <button onClick={props.onPrev} className="px-6 py-3 text-sm font-semibold text-text-secondary hover:text-text-primary transition flex items-center cursor-pointer"><ChevronLeft className="w-4 h-4 mr-1" /> Atrás</button>
          <AnimatedButton variant="primary" onClick={props.onNext} className="px-8 py-3 text-sm !bg-coral-500 hover:!bg-coral-600 !text-white ">
            Continuar <ChevronRight className="w-4 h-4 ml-1" />
          </AnimatedButton>
        </div>
      </ProCard>
    </motion.div>
  );
}
