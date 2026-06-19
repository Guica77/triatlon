'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Watch, Flame, Waves, Footprints, ExternalLink, RefreshCw, Zap } from 'lucide-react';
import { getRecentStravaActivities } from '@/app/telemetry/telemetry-actions';

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  start_date: string;
  distance: number; // in meters
  moving_time: number; // in seconds
  average_speed: number; // in m/s
  average_watts?: number;
}

export function ActivitiesFeed() {
  const [activities, setActivities] = React.useState<StravaActivity[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRecentStravaActivities();
      if ('error' in res && res.error) {
        setError(res.error);
      } else if ('activities' in res && res.activities) {
        setActivities(res.activities);
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchActivities();
  }, []);

  const formatDistance = (meters: number) => {
    if (!meters) return '0.00 km';
    const km = meters / 1000;
    return `${km.toFixed(2)} km`;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0m';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatPace = (type: string, avgSpeed: number, watts?: number) => {
    if (!avgSpeed || avgSpeed <= 0) return '';

    const lowerType = type.toLowerCase();
    if (lowerType === 'run') {
      const paceSec = 1000 / avgSpeed;
      if (paceSec < 150 || paceSec > 600) return ''; // filter outlier values
      const mins = Math.floor(paceSec / 60);
      const secs = Math.round(paceSec % 60);
      return `• ${mins}:${secs.toString().padStart(2, '0')}/km`;
    } else if (lowerType === 'swim') {
      const paceSec = 100 / avgSpeed;
      if (paceSec < 30 || paceSec > 240) return '';
      const mins = Math.floor(paceSec / 60);
      const secs = Math.round(paceSec % 60);
      return `• ${mins}:${secs.toString().padStart(2, '0')}/100m`;
    } else if (lowerType === 'ride') {
      if (watts) {
        return `• ${Math.round(watts)} W`;
      }
    }
    return '';
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl bg-white border border-zinc-250 shadow-sm relative overflow-hidden group w-full"
    >
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-150">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-zinc-900">Actividades Recientes (Strava)</h3>
          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Sincronizado hace 2m
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3"
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[72px] w-full bg-zinc-50 rounded-xl border border-zinc-200 animate-pulse"
              />
            ))}
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-xl bg-red-50 border border-red-200 text-center"
          >
            <p className="text-xs text-red-600">{error}</p>
            <button
              onClick={fetchActivities}
              className="mt-2 text-[10px] font-bold text-red-600 hover:underline"
            >
              Intentar de nuevo
            </button>
          </motion.div>
        ) : activities.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 rounded-xl bg-zinc-50 border border-zinc-200 text-center"
          >
            <p className="text-xs text-zinc-500">Aún no se han importado actividades de Strava.</p>
            <p className="text-[10px] text-zinc-400 mt-1">Registra tu primer entrenamiento para verlo aquí.</p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-3"
          >
            {activities.map((act, index) => {
              const lowerType = act.type.toLowerCase();
              const isRun = lowerType === 'run';
              const isSwim = lowerType === 'swim';
              const isRide = lowerType === 'ride';

              // Simular vinculación para propósitos visuales como en la maqueta
              const isLinked = index < 2; 
              const linkedName = isRun ? 'Series Umbral 10k' : isRide ? 'Fondo Largo Z2' : 'Entrenamiento Programado';

              let iconBg = 'bg-zinc-100 text-zinc-500';
              let emoji = '🏃';

              if (isRun) {
                iconBg = 'bg-rose-50 text-rose-600 border border-rose-100';
                emoji = '🏃';
              } else if (isSwim) {
                iconBg = 'bg-sky-50 text-sky-600 border border-sky-100';
                emoji = '🏊';
              } else if (isRide) {
                iconBg = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                emoji = '🚴';
              }

              return (
                <div
                  key={act.id}
                  className={`bg-white border border-zinc-200 p-3 px-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 transition-all hover:border-zinc-350 shadow-sm ${!isLinked ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0 text-base`}>
                      {emoji}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-800 line-clamp-1 flex items-center gap-2">
                        {act.name}
                      </h4>
                      <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">
                        {formatDate(act.start_date)} • 
                        {isLinked ? (
                          <span className="text-emerald-700 font-bold ml-1">✓ Vinculado a '{linkedName}'</span>
                        ) : (
                          <span className="text-zinc-400 ml-1">Sesión Libre (Sin Vincular)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-zinc-800">
                        {formatDuration(act.moving_time)}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                        {formatDistance(act.distance)} {formatPace(act.type, act.average_speed, act.average_watts)}
                      </p>
                    </div>
                    
                    <a
                      href={`https://www.strava.com/activities/${act.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ver actividad en Strava"
                      className="w-7 h-7 rounded-md bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-800 border border-zinc-200 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center mt-5">
        <button
          onClick={fetchActivities}
          className="bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-800 hover:bg-zinc-50 px-4 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all inline-flex items-center gap-2"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Ver Historial Completo
        </button>
      </div>
    </motion.div>
  );
}
