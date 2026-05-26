'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { disconnectTelemetry, syncPacesFromStravaAction, pushWeekWorkoutsToGarminAction } from '@/app/settings/actions';
import { Watch, Link as LinkIcon, Info, Activity, RefreshCw, UploadCloud, Heart, Check, X, Smartphone } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';

interface TelemetryConnectCardProps {
  connectedProviders: string[];
  lastSyncTime?: string | null;
}

const PROVIDERS = [
  {
    id: 'strava',
    name: 'Strava',
    description: 'Puente universal de actividades',
    iconColor: 'text-[#FC4C02]',
    isReal: true,
  },
  {
    id: 'garmin',
    name: 'Garmin Connect',
    description: 'Exporta entrenos estructurados',
    iconColor: 'text-sky-400',
    isReal: false,
  },
  {
    id: 'apple_health',
    name: 'Apple Health',
    description: 'Datos de salud de iOS',
    iconColor: 'text-rose-500',
    isReal: false,
  },
  {
    id: 'wahoo',
    name: 'Wahoo Fitness',
    description: 'Sincroniza rodillo y sensores',
    iconColor: 'text-zinc-200',
    isReal: false,
  },
  {
    id: 'polar',
    name: 'Polar Flow',
    description: 'Métricas de recuperación',
    iconColor: 'text-red-500',
    isReal: false,
  },
  {
    id: 'coros',
    name: 'Coros',
    description: 'Carga planes de entrenamiento',
    iconColor: 'text-teal-400',
    isReal: false,
  },
  {
    id: 'suunto',
    name: 'Suunto',
    description: 'Importa rutas y entrenamientos',
    iconColor: 'text-blue-400',
    isReal: false,
  },
];

export function TelemetryConnectCard({ connectedProviders = [], lastSyncTime }: TelemetryConnectCardProps) {
  const [isDisconnecting, setIsDisconnecting] = React.useState<string | null>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isPushingWorkouts, setIsPushingWorkouts] = React.useState(false);

  const handleDisconnect = async (provider: string) => {
    if (!confirm(`¿Estás seguro de que quieres desconectar tu cuenta de ${provider}?`)) return;
    setIsDisconnecting(provider);
    try {
      await disconnectTelemetry(provider);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDisconnecting(null);
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

  const isStravaConnected = connectedProviders.includes('strava');
  const isGarminConnected = connectedProviders.includes('garmin');

  return (
    <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-900 to-[#18181b] border border-zinc-800 shadow-xl relative h-full flex flex-col group overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-orange-500 shadow-inner">
          <Watch className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-bold text-white leading-tight">Dispositivos y Telemetría</h3>
          <p className="text-[10px] sm:text-xs text-zinc-400">Sincroniza tus relojes deportivos y sensores</p>
        </div>
      </div>

      {/* Scrollable list of providers */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[320px] custom-scrollbar mb-4">
        {PROVIDERS.map((prov) => {
          const isConnected = connectedProviders.includes(prov.id);
          const isPendingDisconnect = isDisconnecting === prov.id;

          return (
            <div 
              key={prov.id} 
              className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                isConnected 
                  ? 'bg-zinc-900/80 border-green-500/20' 
                  : 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-750'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center ${prov.iconColor} shrink-0`}>
                  {prov.id === 'apple_health' ? (
                    <Heart className="w-4 h-4" />
                  ) : prov.id === 'apple_health' ? (
                    <Smartphone className="w-4 h-4" />
                  ) : (
                    <Watch className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white truncate">{prov.name}</span>
                    {isConnected && (
                      <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 text-[8px] font-bold border border-green-500/20 flex items-center gap-0.5 uppercase tracking-wider">
                        <Check className="w-2 h-2" /> Sí
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] text-zinc-400 truncate max-w-[130px] sm:max-w-[160px]">{prov.description}</p>
                </div>
              </div>

              <div>
                {isConnected ? (
                  <button
                    onClick={() => handleDisconnect(prov.id)}
                    disabled={!!isDisconnecting}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                    title="Desconectar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <a href={`/api/auth/telemetry/connect?provider=${prov.id}`}>
                    <button
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-orange-500/10 text-zinc-300 hover:text-orange-500 border border-zinc-700 hover:border-orange-500/20 transition-all cursor-pointer"
                      title="Conectar"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                    </button>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Conditionally rendered global actions */}
      {(isStravaConnected || isGarminConnected) && (
        <div className="pt-3 border-t border-zinc-800 space-y-2 mt-auto shrink-0">
          {isGarminConnected && (
            <button
              onClick={handlePushWorkouts}
              disabled={isPushingWorkouts || isSyncing || !!isDisconnecting}
              className="w-full py-2 text-[10px] sm:text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-cyan-500/10"
            >
              <UploadCloud className={`w-3.5 h-3.5 ${isPushingWorkouts ? 'animate-bounce' : ''}`} />
              {isPushingWorkouts ? 'Enviando...' : 'Enviar Entrenos de la Semana a Garmin'}
            </button>
          )}

          {isStravaConnected && (
            <button
              onClick={handleSyncPaces}
              disabled={isSyncing || isPushingWorkouts || !!isDisconnecting}
              className="w-full py-2 text-[10px] sm:text-xs font-bold rounded-xl bg-orange-500 hover:bg-orange-400 text-black flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Recalculando...' : 'Recalcular Ritmos desde Strava'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

