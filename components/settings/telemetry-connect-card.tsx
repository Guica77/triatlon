'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { disconnectTelemetry, syncPacesFromStravaAction, pushWeekWorkoutsToGarminAction } from '@/app/(app)/settings/actions';
import { Watch, Link as LinkIcon, RefreshCw, UploadCloud, Heart, Check, X, Smartphone } from 'lucide-react';

interface TelemetryConnectCardProps {
  connectedProviders: string[];
  lastSyncTime?: string | null;
}

const PROVIDERS = [
  {
    id: 'strava',
    name: 'Strava',
    description: 'Actividades automáticas',
    iconColor: 'text-[#FC4C02]',
    isReal: true,
  },
  {
    id: 'garmin',
    name: 'Garmin Connect',
    description: 'Exporta entrenamientos',
    iconColor: 'text-sky-600',
    isReal: false,
  },
  {
    id: 'apple_health',
    name: 'Apple Health',
    description: 'Salud de iOS',
    iconColor: 'text-rose-500',
    isReal: false,
  },
  {
    id: 'wahoo',
    name: 'Wahoo Fitness',
    description: 'Sincroniza rodillo',
    iconColor: 'text-zinc-800',
    isReal: false,
  },
  {
    id: 'polar',
    name: 'Polar Flow',
    description: 'Recuperación y métricas',
    iconColor: 'text-red-600',
    isReal: false,
  },
  {
    id: 'coros',
    name: 'Coros',
    description: 'Planes adaptativos',
    iconColor: 'text-teal-600',
    isReal: false,
  },
  {
    id: 'suunto',
    name: 'Suunto',
    description: 'Rutas e historial',
    iconColor: 'text-blue-600',
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
    <div className="p-5 rounded-2xl bg-white border border-zinc-200 shadow-sm relative h-full flex flex-col group overflow-hidden justify-between">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <div>
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shadow-sm shrink-0">
            <Watch className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 leading-tight">Dispositivos y Telemetría</h3>
            <p className="text-[10px] sm:text-xs text-zinc-500 font-medium">Conecta tus relojes y sensores</p>
          </div>
        </div>

        {/* Scrollable list of providers */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[280px] custom-scrollbar mb-4">
          {PROVIDERS.map((prov) => {
            const isConnected = connectedProviders.includes(prov.id);

            return (
              <div 
                key={prov.id} 
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                  isConnected 
                    ? 'bg-green-50/40 border-green-200' 
                    : 'bg-zinc-50 border-zinc-200/80 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center ${prov.iconColor} shrink-0 shadow-sm`}>
                    {prov.id === 'apple_health' ? (
                      <Heart className="w-4 h-4 fill-current" />
                    ) : prov.id === 'apple_health' ? (
                      <Smartphone className="w-4 h-4" />
                    ) : (
                      <Watch className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-zinc-800 truncate">{prov.name}</span>
                      {isConnected && (
                        <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[8px] font-black border border-green-200 flex items-center gap-0.5 uppercase tracking-wider">
                          <Check className="w-2 h-2" /> Sí
                        </span>
                      )}
                      <span className={`px-1 py-0.5 rounded text-[7px] font-bold border uppercase tracking-wider ${
                        prov.isReal 
                          ? 'bg-cyan-50 text-cyan-700 border-cyan-150' 
                          : 'bg-amber-55 text-amber-700 border-amber-150'
                      }`}>
                        {prov.isReal ? 'OAuth' : 'Demo'}
                      </span>
                    </div>
                    <p className="text-[9px] text-zinc-500 font-medium truncate max-w-[110px] sm:max-w-[130px]">{prov.description}</p>
                  </div>
                </div>

                <div>
                  {isConnected ? (
                    <button
                      onClick={() => handleDisconnect(prov.id)}
                      disabled={!!isDisconnecting}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 border border-zinc-200 hover:border-red-200 transition-all cursor-pointer disabled:opacity-50"
                      title="Desconectar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <a 
                      href={`/api/auth/telemetry/connect?provider=${prov.id}`}
                      title={`Conectar con ${prov.name}`}
                      aria-label={`Conectar con ${prov.name}`}
                    >
                      <button
                        className="p-1.5 rounded-lg bg-white hover:bg-cyan-50 text-zinc-550 hover:text-cyan-600 border border-zinc-200 hover:border-cyan-200 transition-all cursor-pointer"
                        title={`Conectar con ${prov.name}`}
                        aria-label={`Conectar con ${prov.name}`}
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
      </div>

      {/* Conditionally rendered global actions */}
      {(isStravaConnected || isGarminConnected) && (
        <div className="pt-3 border-t border-zinc-200 space-y-2 mt-auto shrink-0">
          {isGarminConnected && (
            <button
              onClick={handlePushWorkouts}
              disabled={isPushingWorkouts || isSyncing || !!isDisconnecting}
              className="w-full py-2.5 text-[10px] sm:text-xs font-black rounded-xl bg-cyan-650 hover:bg-cyan-550 text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-md"
            >
              <UploadCloud className={`w-3.5 h-3.5 ${isPushingWorkouts ? 'animate-bounce' : ''}`} />
              {isPushingWorkouts ? 'Enviando...' : 'Enviar Entrenos a Garmin'}
            </button>
          )}

          {isStravaConnected && (
            <button
              onClick={handleSyncPaces}
              disabled={isSyncing || isPushingWorkouts || !!isDisconnecting}
              className="w-full py-2.5 text-[10px] sm:text-xs font-black rounded-xl bg-[#FC4C02] hover:bg-[#e34402] text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Recalculando...' : 'Recalcular Ritmos Strava'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
