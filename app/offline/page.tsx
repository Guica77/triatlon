'use client';

import * as React from 'react';
import { WifiOff, RotateCw, HelpCircle, Activity } from 'lucide-react';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';

export default function OfflinePage() {
  const [checking, setChecking] = React.useState(false);

  const handleRetry = () => {
    setChecking(true);
    // Simulate checking connection
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        if (navigator.onLine) {
          window.location.href = '/';
        } else {
          setChecking(false);
        }
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-text-primary flex flex-col items-center justify-center p-4 selection:bg-swim/20">
      
      <ProCard className="w-full max-w-md p-8 text-center space-y-6 bg-bg-app/40 border-border-default/80 backdrop-blur-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-rose-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white uppercase tracking-wider">Sin Conexión a Internet</h1>
          <p className="text-sm text-text-muted leading-relaxed">
            Parece que has perdido la señal. Triatlon Pro requiere una conexión activa para recalcular tu fatiga y sincronizar tus series en tiempo real.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-bg-card/50 border border-border-default text-left space-y-2.5">
          <h3 className="text-xs font-semibold text-text-muted flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-swim" /> ¿Qué puedes hacer ahora?
          </h3>
          <ul className="text-xs text-text-muted space-y-1.5 list-disc pl-4">
            <li>Comprueba tu conexión Wi-Fi o red móvil.</li>
            <li>Si estás entrenando, tu reloj Garmin/Coros seguirá registrando la actividad sin problemas y la sincronizará cuando vuelvas a tener red.</li>
            <li>Pulsa el botón de abajo para reintentar cargar la app.</li>
          </ul>
        </div>

        <AnimatedButton 
          variant="primary" 
          onClick={handleRetry}
          disabled={checking}
          className="w-full py-3.5 text-xs font-bold"
        >
          {checking ? (
            <>
              <RotateCw className="w-4 h-4 mr-2 animate-spin text-black" />
              Comprobando Red...
            </>
          ) : (
            <>
              <RotateCw className="w-4 h-4 mr-2 text-black" />
              Reintentar Conexión
            </>
          )}
        </AnimatedButton>
      </ProCard>

      <div className="mt-8 flex items-center gap-1.5 text-[10px] text-text-secondary uppercase tracking-widest font-semibold">
        <Activity className="w-3 h-3" />
        <span>Triatlon Pro Offline Mode</span>
      </div>
    </div>
  );
}
