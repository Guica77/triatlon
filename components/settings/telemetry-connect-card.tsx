'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { disconnectTelemetry, syncPacesFromStravaAction, pushWeekWorkoutsToGarminAction } from '@/app/settings/actions';
import { Watch, Link as LinkIcon, Info, Activity, ArrowRight, RefreshCw, UploadCloud } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';

interface TelemetryConnectCardProps {
  isConnected: boolean;
  provider?: string | null;
  lastSyncTime?: string | null;
}

export function TelemetryConnectCard({ isConnected, provider, lastSyncTime }: TelemetryConnectCardProps) {
  const [isDisconnecting, setIsDisconnecting] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isPushingWorkouts, setIsPushingWorkouts] = React.useState(false);

  const handleDisconnect = async () => {
    if (!confirm('¿Estás seguro de que quieres desconectar tu cuenta de Strava?')) return;
    setIsDisconnecting(true);
    try {
      await disconnectTelemetry('strava');
    } catch (e) {
      console.error(e);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSyncPaces = async () => {
    setIsSyncing(true);
    try {
      const res = await syncPacesFromStravaAction();
      if (res.error) {
        alert(res.error);
      } else {
        alert('Tus métricas fisiológicas y de ritmos se han recalculado exitosamente con tus actividades de Strava.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushWorkouts = async () => {
    setIsPushingWorkouts(true);
    try {
      const res = await pushWeekWorkoutsToGarminAction();
      if (res.error) {
        alert(res.error);
      } else {
        alert(`¡Éxito! Se han enviado ${res.count} entrenamientos estructurados a tu calendario de Garmin para la próxima semana. Deberías verlos en tu reloj en la próxima sincronización.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPushingWorkouts(false);
    }
  };

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

        <div className="flex-1 flex flex-col justify-between gap-4 relative z-10">
          <div className="bg-black/20 rounded-xl p-4 border border-orange-500/20">
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

          <div className="space-y-2">
            <button
              onClick={handlePushWorkouts}
              disabled={isPushingWorkouts || isSyncing || isDisconnecting}
              className="w-full py-2.5 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <UploadCloud className={`w-3.5 h-3.5 ${isPushingWorkouts ? 'animate-bounce' : ''}`} />
              {isPushingWorkouts ? 'Enviando a Garmin...' : 'Enviar Entrenos de la Semana a Garmin'}
            </button>

            <button
              onClick={handleSyncPaces}
              disabled={isSyncing || isDisconnecting || isPushingWorkouts}
              className="w-full py-2.5 text-xs font-bold rounded-xl bg-orange-500 hover:bg-orange-400 text-black flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Recalculando Ritmos...' : 'Recalcular Ritmos desde Strava'}
            </button>

            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting || isSyncing || isPushingWorkouts}
              className="w-full py-2 text-xs font-semibold rounded-xl bg-zinc-950/60 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-zinc-850 hover:border-red-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isDisconnecting ? 'Desconectando...' : 'Desconectar cuenta'}
            </button>
          </div>
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

      <div className="flex flex-col gap-2 mt-auto">
        <a href="/api/auth/telemetry/connect?provider=strava" className="block w-full">
          <AnimatedButton variant="primary" className="w-full py-2.5 text-xs !bg-[#FC4C02] hover:!bg-[#E34402] !text-white flex justify-center shadow-lg shadow-[#FC4C02]/10 font-bold border border-[#FC4C02]/30">
            <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
            Conectar Garmin (vía Strava)
          </AnimatedButton>
        </a>

        <a href="/api/auth/telemetry/connect?provider=strava" className="block w-full">
          <AnimatedButton variant="primary" className="w-full py-2.5 text-xs !bg-orange-650 hover:!bg-orange-600 !text-white flex justify-center shadow-lg shadow-orange-600/10 font-bold border border-orange-600/30">
            <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
            Conectar Coros/Suunto (vía Strava)
          </AnimatedButton>
        </a>
      </div>
    </div>
  );
}
