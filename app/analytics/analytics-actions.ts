'use server';

import { createClient } from '@/lib/supabase/server';

export interface PmcPoint {
  date: string;
  ctl: number; // Fitness (Carga Crónica - 42 días)
  atl: number; // Fatiga (Carga Aguda - 7 días)
  tsb: number; // Balance de Forma (CTL - ATL)
}

export interface AnalyticsDashboardData {
  pmcData: PmcPoint[];
  currentCtl: number;
  currentAtl: number;
  currentTsb: number;
  weeklyTssActual: number;
  weeklyTssTarget: number;
  sportDistribution: {
    natacion: { tss: number; percentage: number };
    ciclismo: { tss: number; percentage: number };
    carrera: { tss: number; percentage: number };
  };
}

function calculateStravaActivityTss(activity: any, profile: any): number {
  const durationSec = activity.moving_time || activity.elapsed_time || 0;
  if (durationSec <= 0) return 0;

  const sportType = activity.type?.toLowerCase();
  const avgSpeed = activity.average_speed; // in m/s

  if (sportType === 'ride' || sportType === 'virtualride') {
    const ftp = Number(profile?.current_ftp) || 200; // default 200 W
    const watts = activity.average_watts || activity.max_watts * 0.6 || 150;
    const intensityFactor = watts / ftp;
    const tss = (durationSec * watts * intensityFactor) / (ftp * 3600) * 100;
    return Math.round(tss);
  }

  if (sportType === 'run') {
    let thresholdSpeed = 3.7; // default 3.7 m/s (~4:30 min/km)
    if (profile?.current_run_pace) {
      const parts = profile.current_run_pace.split(':');
      if (parts.length === 2) {
        const min = parseInt(parts[0], 10);
        const sec = parseInt(parts[1], 10);
        const totalSecPerKm = min * 60 + sec;
        if (totalSecPerKm > 0) {
          thresholdSpeed = 1000 / totalSecPerKm;
        }
      }
    }
    const intensityFactor = avgSpeed / thresholdSpeed;
    const tss = (durationSec * avgSpeed * intensityFactor) / (thresholdSpeed * 3600) * 100;
    return Math.round(tss);
  }

  if (sportType === 'swim') {
    let thresholdSpeed = 0.95; // default 0.95 m/s (~1:45 min/100m)
    if (profile?.current_swim_pace) {
      const parts = profile.current_swim_pace.split(':');
      if (parts.length === 2) {
        const min = parseInt(parts[0], 10);
        const sec = parseInt(parts[1], 10);
        const totalSecPer100m = min * 60 + sec;
        if (totalSecPer100m > 0) {
          thresholdSpeed = 100 / totalSecPer100m;
        }
      }
    }
    const intensityFactor = avgSpeed / thresholdSpeed;
    const tss = (durationSec * avgSpeed * intensityFactor) / (thresholdSpeed * 3600) * 100;
    return Math.round(tss);
  }

  const durationMin = durationSec / 60;
  return Math.round(durationMin * 0.75); // base Z2 stress
}

/**
 * Estima el TSS de una sesión basado en su duración y descripción de intensidad.
 */
function estimateTss(durationMin: number, description: string): number {
  if (!durationMin || durationMin <= 0) return 0;
  
  const desc = (description || '').toLowerCase();
  let intensityFactor = 0.75; // Por defecto / Z2

  if (desc.includes('zona 4') || desc.includes('z4') || desc.includes('series') || desc.includes('fuerte') || desc.includes('umbral')) {
    intensityFactor = 0.88;
  } else if (desc.includes('zona 3') || desc.includes('z3') || desc.includes('ritmo') || desc.includes('tempo')) {
    intensityFactor = 0.80;
  } else if (desc.includes('zona 1') || desc.includes('z1') || desc.includes('recuperación') || desc.includes('suave')) {
    intensityFactor = 0.65;
  }

  // Fórmula TSS = (duracion / 60) * (IF^2) * 100
  // Para simplificar y dar valores redondos realistas al usuario:
  const tss = (durationMin / 60) * Math.pow(intensityFactor, 2) * 100;
  return Math.round(tss);
}

/**
 * Simula una curva de calibración PMC de 90 días para usuarios nuevos sin suficiente histórico.
 */
function generateSimulatedPmcData(): PmcPoint[] {
  const points: PmcPoint[] = [];
  const today = new Date();
  
  let currentCtl = 45;
  let currentAtl = 50;

  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    
    // Simular un entrenamiento realista cada ciertos días usando Math.sin para que sea 100% determinista (evita Hydration Error)
    const isWorkoutDay = i % 7 !== 0; // Descanso 1 día a la semana
    const pseudoRandom = Math.abs(Math.sin(i));
    const dailyTss = isWorkoutDay ? Math.floor(pseudoRandom * 60) + 40 : 0; // Entre 40 y 100 TSS

    // Fórmulas de Media Móvil Exponencial (EWMA)
    currentCtl = currentCtl + (dailyTss - currentCtl) * (1 / 42);
    currentAtl = currentAtl + (dailyTss - currentAtl) * (1 / 7);
    const currentTsb = currentCtl - currentAtl;

    points.push({
      date: d.toISOString().split('T')[0],
      ctl: Math.round(currentCtl),
      atl: Math.round(currentAtl),
      tsb: Math.round(currentTsb)
    });
  }

  return points;
}

/**
 * Obtiene y calcula los datos completos del dashboard de analíticas.
 */
export async function getAnalyticsDashboardData(): Promise<AnalyticsDashboardData> {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData?.user) {
      return getFallbackAnalyticsData();
    }

    const userId = authData.user.id;

    // Fetch user profile to read strava connection and thresholds
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) {
      return getFallbackAnalyticsData();
    }

    const tssByDate: Record<string, number> = {};
    const sportTssCurrentWeek = {
      natacion: 0,
      ciclismo: 0,
      carrera: 0
    };

    const now = new Date();
    const startOfCurrentWeek = new Date(now);
    startOfCurrentWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)); // Lunes
    startOfCurrentWeek.setHours(0, 0, 0, 0);

    let hasRealData = false;

    // 1. Fetch real historical activities from Strava if connected
    if (profile.strava_connected && profile.strava_auth_tokens) {
      const tokens = profile.strava_auth_tokens as any;
      let accessToken = tokens?.access_token;

      if (accessToken) {
        // Refresh token if expired
        if (tokens?.expires_at && tokens.expires_at < Date.now()) {
          const refreshResponse = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: process.env.STRAVA_CLIENT_ID,
              client_secret: process.env.STRAVA_CLIENT_SECRET,
              refresh_token: tokens.refresh_token,
              grant_type: 'refresh_token',
            }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            accessToken = refreshData.access_token;
            
            await supabase
              .from('profiles')
              .update({
                strava_auth_tokens: {
                  access_token: refreshData.access_token,
                  refresh_token: refreshData.refresh_token || tokens.refresh_token,
                  expires_at: refreshData.expires_at * 1000,
                }
              } as any)
              .eq('id', userId);
          }
        }

        // Fetch up to 80 activities to compute curves
        const stravaResponse = await fetch('https://www.strava.com/api/v3/athlete/activities?per_page=80', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (stravaResponse.ok) {
          const activities = await stravaResponse.json();
          if (Array.isArray(activities) && activities.length > 0) {
            hasRealData = true;
            activities.forEach((act: any) => {
              if (!act.start_date) return;
              const dateStr = act.start_date.split('T')[0];
              const tss = calculateStravaActivityTss(act, profile);

              tssByDate[dateStr] = (tssByDate[dateStr] || 0) + tss;

              // Aggregate current week distribution
              const workoutDate = new Date(act.start_date);
              if (workoutDate >= startOfCurrentWeek) {
                const sport = (act.type || '').toLowerCase();
                if (sport === 'swim') {
                  sportTssCurrentWeek.natacion += tss;
                } else if (sport === 'ride' || sport === 'virtualride') {
                  sportTssCurrentWeek.ciclismo += tss;
                } else if (sport === 'run') {
                  sportTssCurrentWeek.carrera += tss;
                }
              }
            });
          }
        }
      }
    }

    // 2. Fetch completed workouts from local database to complement
    const { data: workouts } = await supabase
      .from('user_workouts')
      .select(`
        id,
        completed_at,
        actual_tss,
        training_sessions (
          id,
          sport_type,
          duration_min,
          description
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true });

    if (workouts && workouts.length > 0) {
      hasRealData = true;
      workouts.forEach((w: any) => {
        if (!w.completed_at || !w.training_sessions) return;
        const dateStr = w.completed_at.split('T')[0];
        const session = w.training_sessions;
        const tss = w.actual_tss || estimateTss(session.duration_min, session.description);

        // Keep highest if there is overlap on the same date
        tssByDate[dateStr] = Math.max(tssByDate[dateStr] || 0, tss);

        // Aggregate current week distribution only if not connected to Strava
        const workoutDate = new Date(w.completed_at);
        if (workoutDate >= startOfCurrentWeek && !profile.strava_connected) {
          const sport = (session.sport_type || '').toLowerCase();
          if (sport.includes('swim') || sport.includes('natación')) {
            sportTssCurrentWeek.natacion += tss;
          } else if (sport.includes('bike') || sport.includes('ciclismo')) {
            sportTssCurrentWeek.ciclismo += tss;
          } else if (sport.includes('run') || sport.includes('carrera')) {
            sportTssCurrentWeek.carrera += tss;
          }
        }
      });
    }

    if (!hasRealData) {
      return getFallbackAnalyticsData();
    }

    // 3. Generate 90-day time series curves
    const pmcData: PmcPoint[] = [];
    let currentCtl = 25; // Base fitness starting point
    let currentAtl = 25;

    for (let i = 89; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dailyTss = tssByDate[dateStr] || 0;

      currentCtl = currentCtl + (dailyTss - currentCtl) * (1 / 42);
      currentAtl = currentAtl + (dailyTss - currentAtl) * (1 / 7);
      const currentTsb = currentCtl - currentAtl;

      pmcData.push({
        date: dateStr,
        ctl: Math.round(currentCtl),
        atl: Math.round(currentAtl),
        tsb: Math.round(currentTsb)
      });
    }

    const lastPoint = pmcData[pmcData.length - 1];
    const weeklyTssActual = sportTssCurrentWeek.natacion + sportTssCurrentWeek.ciclismo + sportTssCurrentWeek.carrera;
    const weeklyTssTarget = 450; 

    const totalCurrentTss = weeklyTssActual || 1;

    return {
      pmcData,
      currentCtl: lastPoint.ctl,
      currentAtl: lastPoint.atl,
      currentTsb: lastPoint.tsb,
      weeklyTssActual,
      weeklyTssTarget,
      sportDistribution: {
        natacion: {
          tss: sportTssCurrentWeek.natacion,
          percentage: Math.round((sportTssCurrentWeek.natacion / totalCurrentTss) * 100)
        },
        ciclismo: {
          tss: sportTssCurrentWeek.ciclismo,
          percentage: Math.round((sportTssCurrentWeek.ciclismo / totalCurrentTss) * 100)
        },
        carrera: {
          tss: sportTssCurrentWeek.carrera,
          percentage: Math.round((sportTssCurrentWeek.carrera / totalCurrentTss) * 100)
        }
      }
    };

  } catch (error) {
    console.error('Error in getAnalyticsDashboardData:', error);
    return getFallbackAnalyticsData();
  }
}

/**
 * Devuelve datos simulados espectaculares cuando no hay conexión o falta histórico.
 */
function getFallbackAnalyticsData(): AnalyticsDashboardData {
  const pmcData = generateSimulatedPmcData();
  const lastPoint = pmcData[pmcData.length - 1];

  return {
    pmcData,
    currentCtl: lastPoint.ctl,
    currentAtl: lastPoint.atl,
    currentTsb: lastPoint.tsb,
    weeklyTssActual: 385,
    weeklyTssTarget: 450,
    sportDistribution: {
      natacion: { tss: 75, percentage: 19 },
      ciclismo: { tss: 195, percentage: 51 },
      carrera: { tss: 115, percentage: 30 }
    }
  };
}
