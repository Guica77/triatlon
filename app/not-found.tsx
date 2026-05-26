'use client';

import * as React from 'react';
import { Compass, ArrowRight, Activity } from 'lucide-react';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-4 selection:bg-cyan-500/20">
      <div className="absolute top-1/4 w-[300px] h-[300px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <ProCard className="w-full max-w-md p-8 text-center space-y-6 bg-zinc-950/40 border-zinc-800/80 backdrop-blur-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center animate-spin-slow">
          <Compass className="w-8 h-8 text-cyan-400" />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-black text-cyan-400 tracking-wider">ERROR 404</span>
          <h1 className="text-xl font-bold text-white uppercase tracking-wider">Fuera de Ruta</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Parece que te has desviado del track. La sesión o página que buscas no existe o ha sido movida a otro circuito.
          </p>
        </div>

        <AnimatedButton
          variant="primary"
          onClick={() => window.location.href = '/'}
          className="w-full py-3.5 text-xs font-bold"
        >
          Volver a la Ruta <ArrowRight className="w-4 h-4 ml-1.5 text-black" />
        </AnimatedButton>
      </ProCard>

      <div className="mt-8 flex items-center gap-1.5 text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">
        <Activity className="w-3 h-3" />
        <span>Triatlon Pro Navigation Guard</span>
      </div>
    </div>
  );
}
