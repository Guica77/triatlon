'use client';

import * as React from 'react';
import { AlertOctagon, RefreshCw, Home, Activity } from 'lucide-react';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col items-center justify-center p-4 selection:bg-cyan-500/20">
      <div className="absolute top-1/4 w-[300px] h-[300px] bg-rose-500/5 rounded-full blur-[100px] pointer-events-none" />

      <ProCard className="w-full max-w-md p-8 text-center space-y-6 bg-zinc-950/40 border-zinc-800/80 backdrop-blur-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center animate-bounce">
          <AlertOctagon className="w-8 h-8 text-rose-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white uppercase tracking-wider">¡Incidente en el Circuito!</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Se ha producido un error inesperado al procesar tus datos de entrenamiento. El equipo técnico ha sido notificado.
          </p>
        </div>

        {error.message && (
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-900 text-left">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold mb-1">Detalle del error:</span>
            <code className="text-xs text-rose-400/90 font-mono break-all line-clamp-3 block">
              {error.message}
            </code>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-3 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 text-xs font-semibold transition"
          >
            Inicio
          </button>
          
          <AnimatedButton
            variant="primary"
            onClick={reset}
            className="w-full py-3 text-xs font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-black animate-spin-slow" />
            Reintentar
          </AnimatedButton>
        </div>
      </ProCard>

      <div className="mt-8 flex items-center gap-1.5 text-[10px] text-zinc-600 uppercase tracking-widest font-semibold">
        <Activity className="w-3 h-3" />
        <span>Triatlon Pro Telemetry Boundary</span>
      </div>
    </div>
  );
}
