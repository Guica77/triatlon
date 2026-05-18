'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Watch, Link as LinkIcon, Info, Activity, ArrowRight } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';

interface TelemetryConnectCardProps {
  isConnected: boolean;
  provider?: string | null;
  lastSyncTime?: string | null;
}

export function TelemetryConnectCard({ isConnected, provider, lastSyncTime }: TelemetryConnectCardProps) {
  if (isConnected) {
    return (
      <div className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/30 shadow-xl relative h-full flex flex-col group overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
            <Watch className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Reloj Conectado</h3>
            <p className="text-xs text-orange-200">Telemetría en tiempo real activa vía {provider || 'Strava'}</p>
          </div>
        </div>

        <div className="flex-1 bg-black/20 rounded-xl p-4 border border-orange-500/20 relative z-10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-zinc-400 font-medium">Estado del Sincronizador</span>
            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold border border-green-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Activo
            </span>
          </div>
          <p className="text-[11px] text-zinc-400">
            La IA está leyendo automáticamente tus entrenamientos. Última sincronización: <strong className="text-white">{lastSyncTime || 'Hoy'}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 to-[#18181b] border border-zinc-800 shadow-xl relative h-full flex flex-col group">
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-orange-500">
          <Watch className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white leading-tight">Sincroniza tu Reloj</h3>
          <p className="text-xs text-zinc-400">Paso vital para la Inteligencia Artificial</p>
        </div>
      </div>

      <div className="flex-1 space-y-4 mb-6">
        <p className="text-sm text-zinc-300 leading-relaxed">
          Para que la IA pueda adaptar tu entrenamiento y evitar lesiones, necesita leer tu pulso y fatiga real.
        </p>
        
        <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20 flex gap-3 items-start">
          <Info className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-orange-200/80 leading-relaxed">
            Utilizamos <strong>Strava</strong> como puente universal. Da igual si usas Garmin, Coros, Suunto o Apple Watch: conéctalo a través de Strava para que podamos leer los datos de forma segura.
          </p>
        </div>
      </div>

      <a href="/api/auth/telemetry/connect?provider=strava" className="block mt-auto">
        <AnimatedButton variant="primary" className="w-full py-3 text-sm !bg-[#FC4C02] hover:!bg-[#E34402] !text-white flex justify-center shadow-lg shadow-[#FC4C02]/20 font-bold border border-[#FC4C02]/50">
          <LinkIcon className="w-4 h-4 mr-2" />
          Conectar Reloj vía Strava
        </AnimatedButton>
      </a>
      
      <div className="mt-3 flex items-center justify-center gap-3 opacity-50">
        <span className="text-[10px] font-bold text-zinc-500">Garmin</span>
        <span className="text-[10px] font-bold text-zinc-500">•</span>
        <span className="text-[10px] font-bold text-zinc-500">Coros</span>
        <span className="text-[10px] font-bold text-zinc-500">•</span>
        <span className="text-[10px] font-bold text-zinc-500">Suunto</span>
      </div>
    </div>
  );
}
