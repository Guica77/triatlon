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
        <div className="p-5 rounded-2xl bg-bg-card border border-sport-swim/20 relative overflow-hidden group mb-6">
          <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-sport-swim/10 blur-3xl group-hover:bg-sport-swim/15 transition-all duration-500" />
          
          <div className="flex gap-4 items-start relative z-10">
            <div className="w-10 h-10 rounded-xl bg-sport-swim/15 border border-sport-swim/20 flex items-center justify-center text-sport-swim shrink-0 mt-0.5">
              <Target className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 w-full">
              <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                ¡Falta tu Objetivo Principal! 🎯
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed max-w-2xl">
                Has completado tu perfil fisiológico, pero aún no has definido la carrera que estás preparando. 
                Configura tu objetivo para que la IA asigne el volumen semanal adecuado y el plan óptimo.
              </p>
              <div className="pt-2">
                <AnimatedButton 
                  size="sm" 
                  onClick={() => setIsModalOpen(true)}
                  className="!bg-sport-swim hover:!bg-sport-swim !text-text-inverse text-[11px] font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1"
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
            className="text-xs text-text-muted hover:text-sport-swim flex items-center gap-1.5 py-1 px-2 -ml-2"
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
