'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { disconnectTelemetry, syncPacesFromStravaAction, pushWeekWorkoutsToGarminAction, saveGarminCredentialsAction } from '@/app/(app)/settings/actions';
import { Watch, Link as LinkIcon, RefreshCw, UploadCloud, Heart, Check, X, Smartphone, Loader2 } from 'lucide-react';

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
    iconColor: 'text-swim',
    isReal: false,
  },
  {
    id: 'apple_health',
    name: 'Apple Health',
    description: 'Salud de iOS',
    iconColor: 'text-run',
    isReal: false,
  },
  {
    id: 'wahoo',
    name: 'Wahoo Fitness',
    description: 'Sincroniza rodillo',
    iconColor: 'text-text-primary',
    isReal: false,
  },
  {
    id: 'polar',
    name: 'Polar Flow',
    description: 'Recuperación y métricas',
    iconColor: 'text-danger',
    isReal: false,
  },
  {
    id: 'coros',
    name: 'Coros',
    description: 'Planes adaptativos',
    iconColor: 'text-bike',
    isReal: false,
  },
  {
    id: 'suunto',
    name: 'Suunto',
    description: 'Rutas e historial',
    iconColor: 'text-swim',
    isReal: false,
  },
];

export function TelemetryConnectCard({ connectedProviders = [], lastSyncTime }: TelemetryConnectCardProps) {
  const [isDisconnecting, setIsDisconnecting] = React.useState<string | null>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isPushingWorkouts, setIsPushingWorkouts] = React.useState(false);
  const [isTestingGarmin, setIsTestingGarmin] = React.useState(false);
  
  const [showGarminModal, setShowGarminModal] = React.useState(false);
  const [garminEmail, setGarminEmail] = React.useState('');
  const [garminPassword, setGarminPassword] = React.useState('');
  const [isConnectingGarmin, setIsConnectingGarmin] = React.useState(false);

  const handleConnectGarmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!garminEmail || !garminPassword) return;
    
    setIsConnectingGarmin(true);
    try {
      const res = await saveGarminCredentialsAction(garminEmail, garminPassword);
      if (res.error) {
        alert(res.error);
      } else {
        setShowGarminModal(false);
        setGarminEmail('');
        setGarminPassword('');
      }
    } catch (e) {
      console.error(e);
      alert("Error inesperado al conectar.");
    } finally {
      setIsConnectingGarmin(false);
    }
  };

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

  const handleTestGarmin = async () => {
    setIsTestingGarmin(true);
    try {
      const { testGarminSyncLocalAction } = await import('@/app/(app)/settings/actions');
      const res = await testGarminSyncLocalAction() as any;
      if (res.error) {
        alert(res.error);
      } else {
        const data = (res as any).data;
        alert(`✅ Conexión exitosa con Garmin.\n\nSe han extraído decenas de métricas (Pasos, Fases de Sueño, Estrés, Calorías, etc).\n\nVe a la pestaña de 'Dashboard', pulsa 'Sincronizar Reloj' y luego 'Detalles' para ver el informe completo.`);
      }
    } catch (e) {
      console.error(e);
      alert("Hubo un error inesperado al probar la conexión con Garmin.");
    } finally {
      setIsTestingGarmin(false);
    }
  };

  const isStravaConnected = connectedProviders.includes('strava');
  const isGarminConnected = connectedProviders.includes('garmin');

  return (
    <div className="p-5 rounded-2xl bg-surface-card border border-border-default shadow-card relative h-full flex flex-col group overflow-hidden justify-between">
      <div className="absolute top-0 right-0 w-32 h-32 bg-swim/5 rounded-full blur-3xl pointer-events-none" />
      
      <div>
        <div className="flex items-center gap-3 mb-4 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-swim/10 border border-swim/20 flex items-center justify-center text-swim  shrink-0">
            <Watch className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-text-primary leading-tight">Dispositivos y Telemetría</h3>
            <p className="text-[10px] sm:text-xs text-text-secondary font-medium">Conecta tus relojes y sensores</p>
          </div>
        </div>

        {/* Scrollable list of providers */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[280px] custom-scrollbar mb-4">
          {PROVIDERS.map((prov) => {
            const isConnected = connectedProviders.includes(prov.id);

            return (
              <div 
                key={prov.id} 
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-[background-color,border-color,color,opacity,box-shadow] duration-150 ease-out ${
                  isConnected
                    ? 'bg-bike/10 border-bike/30'
                    : 'bg-surface-hover border-border-subtle/80 fine-hover:border-border-default'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-lg bg-surface-card border border-border-default flex items-center justify-center ${prov.iconColor} shrink-0 `}>
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
                      <span className="text-xs font-semibold text-text-primary truncate">{prov.name}</span>
                      {isConnected && (
                        <span className="px-1.5 py-0.5 rounded bg-bike/15 text-bike text-[8px] font-black border border-bike/30 flex items-center gap-0.5 uppercase tracking-wider">
                          <Check className="w-2 h-2" /> Sí
                        </span>
                      )}
                      <span className={`px-1 py-0.5 rounded text-[7px] font-bold border uppercase tracking-wider ${
                        prov.isReal 
                          ? 'bg-swim/10 text-swim border-swim/20' 
                          : 'bg-warning/10 text-warning border-warning/30'
                      }`}>
                        {prov.isReal ? 'OAuth' : 'Demo'}
                      </span>
                    </div>
                    <p className="text-[9px] text-text-secondary font-medium truncate max-w-[110px] sm:max-w-[130px]">{prov.description}</p>
                  </div>
                </div>

                <div>
                  {isConnected ? (
                    <button
                      onClick={() => handleDisconnect(prov.id)}
                      disabled={!!isDisconnecting}
                      className="min-h-10 min-w-10 p-1.5 rounded-lg text-text-muted fine-hover:text-danger fine-hover:bg-danger/10 border border-border-default fine-hover:border-danger/30 transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-out active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/50 disabled:opacity-50"
                      title="Desconectar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : prov.id === 'garmin' ? (
                      <button
                        onClick={() => setShowGarminModal(true)}
                        className="min-h-10 min-w-10 p-1.5 rounded-lg bg-surface-card fine-hover:bg-swim/10 text-text-secondary fine-hover:text-swim border border-border-default fine-hover:border-swim/30 transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-out active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-swim/50"
                        title={`Conectar con ${prov.name}`}
                        aria-label={`Conectar con ${prov.name}`}
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <a
                        href={`/api/auth/telemetry/connect?provider=${prov.id}`}
                        title={`Conectar con ${prov.name}`}
                        aria-label={`Conectar con ${prov.name}`}
                        className="inline-flex min-h-10 min-w-10 items-center justify-center p-1.5 rounded-lg bg-surface-card fine-hover:bg-swim/10 text-text-secondary fine-hover:text-swim border border-border-default fine-hover:border-swim/30 transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-out active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-swim/50"
                      >
                        <LinkIcon className="w-3.5 h-3.5" />
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
        <div className="pt-3 border-t border-border-default space-y-2 mt-auto shrink-0">
          {isGarminConnected && (
            <>
              <button
                onClick={handlePushWorkouts}
                disabled={isPushingWorkouts || isSyncing || !!isDisconnecting || isTestingGarmin}
                className="w-full min-h-11 py-2.5 text-[10px] sm:text-xs font-black rounded-xl bg-swim fine-hover:bg-swim/90 text-white flex items-center justify-center gap-1.5 transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-swim/50 disabled:opacity-50 cursor-pointer "
              >
                <UploadCloud className={`w-3.5 h-3.5 ${isPushingWorkouts ? 'animate-bounce' : ''}`} />
                {isPushingWorkouts ? 'Enviando...' : 'Enviar Entrenos a Garmin'}
              </button>
              
              <button
                onClick={handleTestGarmin}
                disabled={isPushingWorkouts || isSyncing || !!isDisconnecting || isTestingGarmin}
                className="w-full min-h-11 py-2.5 text-[10px] sm:text-xs font-black rounded-xl bg-surface-hover fine-hover:bg-surface-card text-text-primary flex items-center justify-center gap-1.5 transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-swim/50 disabled:opacity-50 cursor-pointer "
              >
                <Heart className={`w-3.5 h-3.5 ${isTestingGarmin ? 'animate-pulse' : ''}`} />
                {isTestingGarmin ? 'Extrayendo...' : 'Probar Extracción VFC (Local)'}
              </button>
            </>
          )}

          {isStravaConnected && (
            <button
              onClick={handleSyncPaces}
              disabled={isSyncing || isPushingWorkouts || !!isDisconnecting || isTestingGarmin}
              className="w-full min-h-11 py-2.5 text-[10px] sm:text-xs font-black rounded-xl bg-[#FC4C02] fine-hover:bg-[#e34402] text-white flex items-center justify-center gap-1.5 transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FC4C02]/50 disabled:opacity-50 cursor-pointer "
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Recalculando...' : 'Recalcular Ritmos Strava'}
            </button>
          )}
        </div>
      )}

      {/* Garmin Connection Modal */}
      {showGarminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-app/70 backdrop-blur-sm">
          <div className="bg-surface-card rounded-2xl shadow-elevated w-full max-w-sm overflow-hidden border border-border-default">
            <div className="p-5 border-b border-border-subtle flex items-center justify-between">
              <div className="flex items-center gap-2 text-swim">
                <Watch className="w-5 h-5" />
                <h3 className="font-bold text-text-primary">Conectar Garmin</h3>
              </div>
              <button 
                onClick={() => setShowGarminModal(false)}
                className="min-h-10 min-w-10 p-1.5 rounded-lg text-text-muted fine-hover:text-text-secondary fine-hover:bg-surface-hover transition-[background-color,color,opacity,transform] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-swim/50"
                title="Cerrar modal"
                aria-label="Cerrar modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleConnectGarmin} className="p-5 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Email de Garmin</label>
                  <input
                    type="email"
                    required
                    value={garminEmail}
                    onChange={(e) => setGarminEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-swim/40 focus:border-swim transition-[background-color,border-color,box-shadow,color] duration-150 ease-out bg-surface-hover focus:bg-surface-card"
                    placeholder="tu-email@ejemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={garminPassword}
                    onChange={(e) => setGarminPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border-default rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-swim/40 focus:border-swim transition-[background-color,border-color,box-shadow,color] duration-150 ease-out bg-surface-hover focus:bg-surface-card"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 text-[10px] sm:text-xs text-warning font-medium">
                Al usar la integración local (no oficial), almacenamos estas credenciales únicamente para poder extraer tu VFC y sueño diario en segundo plano.
              </div>
              
              <button
                type="submit"
                disabled={isConnectingGarmin || !garminEmail || !garminPassword}
                className="w-full min-h-11 py-2.5 font-bold rounded-xl bg-swim fine-hover:bg-swim/90 text-white flex items-center justify-center gap-2 transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-swim/50 disabled:opacity-50"
              >
                {isConnectingGarmin ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LinkIcon className="w-4 h-4" />
                )}
                {isConnectingGarmin ? 'Conectando...' : 'Conectar con Garmin'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
