'use client';

import * as React from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';

/**
 * global-error.tsx — captura errores del layout raíz (app/layout.tsx) que
 * NO cubre app/error.tsx. Debe renderizar <html> y <body> propios.
 * Muestra el digest para poder rastrearlo en los logs de Vercel.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Unhandled global error:', error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-[#09090b] text-text-primary flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md p-8 text-center space-y-6 bg-zinc-900/60 border border-white/10 rounded-3xl backdrop-blur-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <AlertOctagon className="w-8 h-8 text-rose-400" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-white uppercase tracking-wider">¡Incidente en el Circuito!</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Se ha producido un error inesperado. El equipo técnico ha sido notificado.
            </p>
          </div>

          {error.digest && (
            <div className="p-2.5 bg-zinc-900 rounded-lg border border-white/10 text-left">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold mb-1">Código de error (digest):</span>
              <code className="text-sm text-amber-300 font-mono font-bold select-all">{error.digest}</code>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-3 rounded-xl border border-white/10 hover:border-white/20 bg-zinc-900/50 text-xs font-semibold transition"
            >
              <Home className="w-3.5 h-3.5 inline mr-1.5" />
              Inicio
            </button>
            <AnimatedButton
              variant="primary"
              onClick={reset}
              className="w-full py-3 text-xs font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-black" />
              Reintentar
            </AnimatedButton>
          </div>
        </div>
      </body>
    </html>
  );
}
