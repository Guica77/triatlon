'use client';

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Watch, Flame, Waves, Footprints, Bike, ExternalLink, RefreshCw, Zap } from 'lucide-react';
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
  const reduceMotion = useReducedMotion();

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
      initial={reduceMotion ? false : { opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-5 rounded-2xl bg-surface-card border border-border-subtle shadow-card relative overflow-hidden group w-full"
    >
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-text-primary">Actividades Recientes (Strava)</h3>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/20">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Sincronizado hace 2m
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            className="flex flex-col gap-3"
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[72px] w-full bg-surface-hover rounded-xl border border-border-default animate-pulse"
              />
            ))}
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-center"
          >
            <p className="text-xs text-danger">{error}</p>
            <button
              onClick={fetchActivities}
              className="mt-2 min-h-10 inline-flex items-center text-[10px] font-bold text-danger fine-hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/50 rounded-sm"
            >
              Intentar de nuevo
            </button>
          </motion.div>
        ) : activities.length === 0 ? (
          <motion.div
            key="empty"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-6 rounded-xl bg-surface-hover border border-border-default text-center"
          >
            <p className="text-xs text-text-secondary">Aún no se han importado actividades de Strava.</p>
            <p className="text-[10px] text-text-muted mt-1">Registra tu primer entrenamiento para verlo aquí.</p>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={reduceMotion ? false : { opacity: 0 }}
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

              let iconBg = 'bg-surface-hover text-text-secondary';
              let Icon = Footprints;

              if (isRun) {
                iconBg = 'bg-run/10 text-run border border-run/20';
                Icon = Footprints;
              } else if (isSwim) {
                iconBg = 'bg-swim/10 text-swim border border-swim/20';
                Icon = Waves;
              } else if (isRide) {
                iconBg = 'bg-bike/10 text-bike border border-bike/20';
                Icon = Bike;
              }

              return (
                <div
                  key={act.id}
                  className={`bg-surface-hover border border-border-default p-3 px-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 shadow-card ${!isLinked ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary line-clamp-1 flex items-center gap-2">
                        {act.name}
                      </h4>
                      <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-1">
                        {formatDate(act.start_date)} •
                        {isLinked ? (
                          <span className="text-bike font-bold ml-1">✓ Vinculado a '{linkedName}'</span>
                        ) : (
                          <span className="text-text-muted ml-1">Sesión Libre (Sin Vincular)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-text-primary">
                        {formatDuration(act.moving_time)}
                      </p>
                      <p className="text-[11px] text-text-secondary mt-0.5 font-medium">
                        {formatDistance(act.distance)} {formatPace(act.type, act.average_speed, act.average_watts)}
                      </p>
                    </div>

                    <a
                      href={`https://www.strava.com/activities/${act.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ver actividad en Strava"
                      className="min-h-10 min-w-10 rounded-md bg-surface-hover fine-hover:bg-border-default flex items-center justify-center text-text-secondary fine-hover:text-text-primary border border-border-default transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
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
          className="bg-surface-hover border border-border-default text-text-secondary fine-hover:text-text-primary fine-hover:bg-border-default px-4 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-out active:scale-[0.97] inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 items-center gap-2"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Ver Historial Completo
        </button>
      </div>
    </motion.div>
  );
}
