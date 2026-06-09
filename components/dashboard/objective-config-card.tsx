'use client';

import * as React from 'react';
import { Target, ArrowRight } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { ObjectiveConfigModal } from './objective-config-modal';

interface ObjectiveConfigCardProps {
  targetRaceName?: string;
}

export function ObjectiveConfigCard({ targetRaceName }: ObjectiveConfigCardProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // If the target race name is configured (and not the default pending text), don't show the card
  // This could also be a toggle button in the header instead if it is configured.
  const isPending = !targetRaceName || targetRaceName === 'Objetivo Pendiente';

  return (
    <>
      {isPending ? (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/25 relative overflow-hidden group shadow-md shadow-cyan-950/20 mb-6">
          <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-cyan-500/10 blur-3xl group-hover:bg-cyan-500/15 transition-all duration-500" />
          
          <div className="flex gap-4 items-start relative z-10">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5 shadow-inner">
              <Target className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 w-full">
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                ¡Falta tu Objetivo Principal! 🎯
              </h3>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
                Has completado tu perfil fisiológico, pero aún no has definido la carrera que estás preparando. 
                Configura tu objetivo para que la IA asigne el volumen semanal adecuado y el plan óptimo.
              </p>
              <div className="pt-2">
                <AnimatedButton 
                  size="sm" 
                  onClick={() => setIsModalOpen(true)}
                  className="!bg-cyan-500 hover:!bg-cyan-400 !text-black text-[11px] font-semibold py-1.5 px-3 rounded-lg shadow-sm flex items-center gap-1"
                >
                  <span>Configurar Objetivo Ahora</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </AnimatedButton>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <AnimatedButton 
            variant="ghost"
            size="sm" 
            onClick={() => setIsModalOpen(true)}
            className="text-xs text-zinc-400 hover:text-cyan-400 flex items-center gap-1.5 py-1 px-2 -ml-2"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Actualizar Objetivo: {targetRaceName}</span>
          </AnimatedButton>
        </div>
      )}

      <ObjectiveConfigModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}
