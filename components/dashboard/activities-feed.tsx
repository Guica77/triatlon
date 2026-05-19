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
      className="p-6 rounded-2xl bg-zinc-950/40 border border-zinc-900 shadow-xl relative overflow-hidden group"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
            <Watch className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Últimas Actividades (Strava)</h3>
            <p className="text-[10px] text-zinc-500">Historial en tiempo real de tu reloj deportivo</p>
          </div>
        </div>
        <button
          onClick={fetchActivities}
          disabled={loading}
          className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-orange-400 hover:border-orange-500/30 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 w-full bg-zinc-900/40 rounded-xl border border-zinc-900/60 animate-pulse"
              />
            ))}
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-center"
          >
            <p className="text-xs text-red-400">{error}</p>
            <button
              onClick={fetchActivities}
              className="mt-2 text-[10px] font-bold text-red-400 hover:underline"
            >
              Intentar de nuevo
            </button>
          </motion.div>
        ) : activities.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 rounded-xl bg-zinc-900/10 border border-zinc-900/60 text-center"
          >
            <p className="text-xs text-zinc-500">Aún no se han importado actividades de Strava.</p>
            <p className="text-[10px] text-zinc-600 mt-1">Registra tu primer entrenamiento para verlo aquí.</p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {activities.map((act) => {
              const lowerType = act.type.toLowerCase();
              const isRun = lowerType === 'run';
              const isSwim = lowerType === 'swim';
              const isRide = lowerType === 'ride';

              // Icons & colors mapping
              let Icon = Flame;
              let iconBg = 'bg-zinc-900/60 text-zinc-400';
              let borderAccent = 'border-zinc-800/80';

              if (isRun) {
                Icon = Footprints;
                iconBg = 'bg-rose-500/10 text-rose-400';
                borderAccent = 'border-rose-500/10 hover:border-rose-500/30';
              } else if (isSwim) {
                Icon = Waves;
                iconBg = 'bg-sky-500/10 text-sky-400';
                borderAccent = 'border-sky-500/10 hover:border-sky-500/30';
              } else if (isRide) {
                Icon = Zap;
                iconBg = 'bg-amber-500/10 text-amber-400';
                borderAccent = 'border-amber-500/10 hover:border-amber-500/30';
              }

              return (
                <div
                  key={act.id}
                  className={`p-3.5 rounded-xl bg-zinc-900/30 border ${borderAccent} flex items-center justify-between transition-all hover:bg-zinc-900/50`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200 line-clamp-1">{act.name}</h4>
                      <p className="text-[9px] text-zinc-500 mt-0.5">
                        {formatDate(act.start_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs font-extrabold text-zinc-300">
                        {formatDuration(act.moving_time)}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 font-medium">
                        {formatDistance(act.distance)} {formatPace(act.type, act.average_speed, act.average_watts)}
                      </p>
                    </div>
                    
                    <a
                      href={`https://www.strava.com/activities/${act.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-md bg-zinc-900 hover:bg-zinc-850 flex items-center justify-center text-zinc-500 hover:text-zinc-300 border border-zinc-800 transition-colors"
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
    </motion.div>
  );
}
