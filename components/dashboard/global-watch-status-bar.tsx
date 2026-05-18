'use client';

import * as React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Watch } from 'lucide-react';
import { syncAllPendingWorkouts } from '@/app/telemetry/telemetry-actions';

interface GlobalWatchStatusBarProps {
  isConnected: boolean;
  provider?: string | null;
  lastSyncTime?: string | null;
}

export function GlobalWatchStatusBar({ isConnected, provider = 'garmin', lastSyncTime }: GlobalWatchStatusBarProps) {
  const [syncing, setSyncing] = React.useState(false);
  const [lastSync, setLastSync] = React.useState<string | null>(lastSyncTime || 'Hace unos instantes');
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const handleForceSync = async () => {
    if (syncing) return;
    setSyncing(true);
    setToastMessage(null);

    try {
      const res = await syncAllPendingWorkouts();
      setLastSync('Justo ahora');
      if (res?.success) {
        setToastMessage(res.message || 'Sincronizado correctamente');
      } else {
        setToastMessage(res?.error || 'Error en la sincronización');
      }
    } catch (err: any) {
      setToastMessage('Error de conexión al sincronizar');
    } finally {
      setSyncing(false);
      setTimeout(() => setToastMessage(null), 6000);
    }
  };

  if (!isConnected) {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-[#18181b] border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:border-zinc-700">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-orange-500">
            <Watch className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-zinc-100">Sin conexión a Strava</h4>
            <p className="text-xs text-zinc-400">Conecta tu cuenta de Strava para importar telemetría automáticamente de cualquier reloj (Garmin, Coros, Suunto)</p>
          </div>
        </div>
        <a 
          href="/api/auth/telemetry/connect?provider=strava"
          className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold transition-all shadow-lg shadow-orange-500/20 whitespace-nowrap"
        >
          Conectar Strava
        </a>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all hover:border-orange-500/30 relative overflow-hidden">
      <div className="flex items-center gap-3 text-center sm:text-left w-full sm:w-auto">
        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 relative">
          <Watch className="w-5 h-5 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-500 animate-ping" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-500" />
        </div>
        <div className="flex-grow">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <h4 className="text-sm font-semibold text-zinc-100 capitalize">
              {provider === 'strava' ? 'Strava Telemetría Activa' : 'Strava Telemetría Activa'}
            </h4>
            <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold border border-orange-500/30">
              Auto 24/7
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Sincronización de telemetría activa • Última act: <span className="text-zinc-300 font-medium">{lastSync}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap sm:flex-nowrap">
        {toastMessage && (
          <span className="text-xs text-green-400 font-medium flex items-center gap-1 animate-fade-in bg-green-500/10 px-3 py-1.5 rounded-xl border border-green-500/20 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> <span className="line-clamp-1">{toastMessage}</span>
          </span>
        )}
        <button
          onClick={handleForceSync}
          disabled={syncing}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-zinc-100 text-xs font-semibold transition-all flex items-center justify-center gap-2 border border-zinc-700/50 disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-green-400' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Forzar Sincronización'}
        </button>
      </div>
    </div>
  );
}
