'use server';

import { createClient } from '@/lib/supabase/server';
import { unstable_cache } from 'next/cache';
import { createClient as createDirectClient } from '@supabase/supabase-js';

export interface PmcPoint {
  date: string;
  ctl: number; // Fitness (Carga Crónica - 42 días)
  atl: number; // Fatiga (Carga Aguda - 7 días)
  tsb: number; // Balance de Forma (CTL - ATL)
  swimDistance: number; // en metros
  bikeDistance: number; // en km
  runDistance: number; // en km
  isFuture?: boolean; // Modelado Predictivo
  plannedTss?: number; // Para cálculo de Compliance
  actualTss?: number; // Para cálculo de Compliance
  rpe?: number; // Rate of Perceived Exertion (1-10)
  feel?: number; // Sensaciones (1-5)
  prs?: string[]; // Personal Records / Picos de Rendimiento
}

export interface PacePowerPoint {
  date: string;
  ftp: number;
  runPaceSeconds: number;
  swimPaceSeconds: number;
}

export interface ZonePoint {
  zone: string;
  percentage: number;
  color: string;
  hours: number;
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
  weeklyDistance: {
    natacion: number; // metros
    ciclismo: number; // km
    carrera: number; // km
  };
  pacePowerHistory: PacePowerPoint[];
  hrZoneDistribution: ZonePoint[];
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
    
    const isWorkoutDay = i % 7 !== 0; // Descanso 1 día a la semana
    const pseudoRandom = Math.abs(Math.sin(i));
    const dailyTss = isWorkoutDay ? Math.floor(pseudoRandom * 60) + 40 : 0; // Entre 40 y 100 TSS

    let swimDistance = 0;
    let bikeDistance = 0;
    let runDistance = 0;

    if (isWorkoutDay) {
      if (i % 3 === 0) swimDistance = Math.round(1500 + pseudoRandom * 1500);
      else if (i % 3 === 1) bikeDistance = Math.round(30 + pseudoRandom * 50);
      else runDistance = Math.round(8 + pseudoRandom * 12);
    }

    // Fórmulas de Media Móvil Exponencial (EWMA)
    currentCtl = currentCtl + (dailyTss - currentCtl) * (1 / 42);
    currentAtl = currentAtl + (dailyTss - currentAtl) * (1 / 7);
    const currentTsb = currentCtl - currentAtl;

    points.push({
      date: d.toISOString().split('T')[0],
      ctl: Math.round(currentCtl),
      atl: Math.round(currentAtl),
      tsb: Math.round(currentTsb),
      swimDistance,
      bikeDistance,
      runDistance
    });
  }

  // Modelado Predictivo (Simulación +14 días)
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    
    // Asumimos un plan estándar para la simulación futura
    const isWorkoutDay = i % 7 !== 0; 
    const dailyTss = isWorkoutDay ? 65 : 0; 

    currentCtl = currentCtl + (dailyTss - currentCtl) * (1 / 42);
    currentAtl = currentAtl + (dailyTss - currentAtl) * (1 / 7);
    const currentTsb = currentCtl - currentAtl;

    points.push({
      date: d.toISOString().split('T')[0],
      ctl: Math.round(currentCtl),
      atl: Math.round(currentAtl),
      tsb: Math.round(currentTsb),
      swimDistance: 0,
      bikeDistance: 0,
      runDistance: 0,
      isFuture: true,
      plannedTss: dailyTss,
      actualTss: 0
    });
  }

  return points;
}

/**
 * Realiza la consulta directa y los cálculos para el dashboard.
 * Esta función no usa cookies y es segura de ejecutar dentro de unstable_cache.
 */
export async function fetchAndCalculateAnalytics(userId: string): Promise<AnalyticsDashboardData> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('fetchAndCalculateAnalytics: Supabase credentials missing');
      return getFallbackAnalyticsData();
    }

    const supabase = createDirectClient(supabaseUrl, supabaseServiceKey);

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
    const plannedTssByDate: Record<string, number> = {};
    const rpeByDate: Record<string, number> = {};
    const feelByDate: Record<string, number> = {};
    const dailyDistance: Record<string, { swim: number; bike: number; run: number }> = {};
    const sportTssCurrentWeek = {
      natacion: 0,
      ciclismo: 0,
      carrera: 0
    };
    const sportDistanceCurrentWeek = {
      natacion: 0, // metros
      ciclismo: 0, // km
      carrera: 0  // km
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

              const distMeters = act.distance || 0;
              const sport = (act.type || '').toLowerCase();
              const workoutDate = new Date(act.start_date);
              
              if (!dailyDistance[dateStr]) {
                dailyDistance[dateStr] = { swim: 0, bike: 0, run: 0 };
              }

              if (sport === 'swim') {
                dailyDistance[dateStr].swim += distMeters;
                if (workoutDate >= startOfCurrentWeek) {
                  sportDistanceCurrentWeek.natacion += distMeters;
                  sportTssCurrentWeek.natacion += tss;
                }
              } else if (sport === 'ride' || sport === 'virtualride') {
                const distKm = distMeters / 1000;
                dailyDistance[dateStr].bike += distKm;
                if (workoutDate >= startOfCurrentWeek) {
                  sportDistanceCurrentWeek.ciclismo += distKm;
                  sportTssCurrentWeek.ciclismo += tss;
                }
              } else if (sport === 'run') {
                const distKm = distMeters / 1000;
                dailyDistance[dateStr].run += distKm;
                if (workoutDate >= startOfCurrentWeek) {
                  sportDistanceCurrentWeek.carrera += distKm;
                  sportTssCurrentWeek.carrera += tss;
                }
              }
            });
          }
        }
      }
    }

    // 2. Fetch completed AND scheduled workouts from local database
    const { data: workouts } = await supabase
      .from('user_workouts')
      .select(`
        id,
        scheduled_date,
        completed_at,
        actual_tss,
        planned_tss,
        status,
        rpe,
        feel,
        training_sessions (
          id,
          sport_type,
          duration_min,
          description
        )
      `)
      .eq('user_id', userId)
      .in('status', ['completed', 'scheduled'])
      .order('scheduled_date', { ascending: true });

    if (workouts && workouts.length > 0) {
      hasRealData = true;
      workouts.forEach((w: any) => {
        if (!w.training_sessions) return;
        
        const isScheduled = w.status === 'scheduled';
        const dateRaw = isScheduled ? w.scheduled_date : (w.completed_at || w.scheduled_date);
        if (!dateRaw) return;
        
        const dateStr = dateRaw.split('T')[0];
        const session = w.training_sessions;
        
        // Use planned_tss for future workouts, actual_tss for completed
        let tss = 0;
        const pTss = w.planned_tss || estimateTss(session.duration_min, session.description);

        if (isScheduled) {
           tss = pTss;
        } else {
           tss = w.actual_tss || pTss;
        }

        // Keep highest if there is overlap on the same date
        tssByDate[dateStr] = Math.max(tssByDate[dateStr] || 0, tss);
        plannedTssByDate[dateStr] = Math.max(plannedTssByDate[dateStr] || 0, pTss);
        
        // Grab RPE and Feel if they exist
        if (w.rpe) rpeByDate[dateStr] = Math.max(rpeByDate[dateStr] || 0, w.rpe);
        if (w.feel) feelByDate[dateStr] = Math.max(feelByDate[dateStr] || 0, w.feel);

        const sport = (session.sport_type || '').toLowerCase();
        let estimatedDistance = 0;

        if (sport.includes('swim') || sport.includes('natación')) {
          estimatedDistance = (session.duration_min || 0) * 40; // metros
        } else if (sport.includes('bike') || sport.includes('ciclismo')) {
          estimatedDistance = (session.duration_min || 0) * 0.4; // km
        } else if (sport.includes('run') || sport.includes('carrera')) {
          estimatedDistance = (session.duration_min || 0) * 0.2; // km
        }

        if (!dailyDistance[dateStr]) {
          dailyDistance[dateStr] = { swim: 0, bike: 0, run: 0 };
        }

        const workoutDate = new Date(w.completed_at);
        if (sport.includes('swim') || sport.includes('natación')) {
          dailyDistance[dateStr].swim = Math.max(dailyDistance[dateStr].swim, estimatedDistance);
          if (workoutDate >= startOfCurrentWeek && !profile.strava_connected) {
            sportDistanceCurrentWeek.natacion += estimatedDistance;
            sportTssCurrentWeek.natacion += tss;
          }
        } else if (sport.includes('bike') || sport.includes('ciclismo')) {
          dailyDistance[dateStr].bike = Math.max(dailyDistance[dateStr].bike, estimatedDistance);
          if (workoutDate >= startOfCurrentWeek && !profile.strava_connected) {
            sportDistanceCurrentWeek.ciclismo += estimatedDistance;
            sportTssCurrentWeek.ciclismo += tss;
          }
        } else if (sport.includes('run') || sport.includes('carrera')) {
          dailyDistance[dateStr].run = Math.max(dailyDistance[dateStr].run, estimatedDistance);
          if (workoutDate >= startOfCurrentWeek && !profile.strava_connected) {
            sportDistanceCurrentWeek.carrera += estimatedDistance;
            sportTssCurrentWeek.carrera += tss;
          }
        }
      });
    }

    if (!hasRealData) {
      return getFallbackAnalyticsData();
    }

    // 3. Generate 90-day historical + 14-day future time series curves
    const pmcData: PmcPoint[] = [];
    let currentCtl = 25; // Base fitness starting point
    let currentAtl = 25;

    // Loop through past 90 days to Today, and +14 days into the future
    for (let i = 89; i >= -14; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dailyTss = tssByDate[dateStr] || 0;

      currentCtl = currentCtl + (dailyTss - currentCtl) * (1 / 42);
      currentAtl = currentAtl + (dailyTss - currentAtl) * (1 / 7);
      const currentTsb = currentCtl - currentAtl;

      const dist = dailyDistance[dateStr] || { swim: 0, bike: 0, run: 0 };
      const isFutureDate = i < 0;

      // Simulated PR logic: high TSS usually means hard races or max tests (for the MVP demo)
      const prs: string[] = [];
      if (!isFutureDate && dailyTss > 90) {
        if (dist.run > 15) prs.push('Medio Maratón (Ritmo)');
        else if (dist.run > 8) prs.push('10K (Mejor Marca)');
        else if (dist.run > 3) prs.push('5K (Mejor Marca)');
        else if (dist.bike > 50) prs.push('Potencia 20min (FTP Test)');
        else if (dist.swim > 1.5) prs.push('1000m Natación (CSS)');
        else prs.push('Pico de Potencia 5min');
      }

      pmcData.push({
        date: dateStr,
        ctl: Math.round(currentCtl),
        atl: Math.round(currentAtl),
        tsb: Math.round(currentTsb),
        swimDistance: isFutureDate ? 0 : Math.round(dist.swim),
        bikeDistance: isFutureDate ? 0 : Number(dist.bike.toFixed(1)),
        runDistance: isFutureDate ? 0 : Number(dist.run.toFixed(1)),
        isFuture: isFutureDate,
        actualTss: isFutureDate ? 0 : dailyTss,
        plannedTss: plannedTssByDate[dateStr] || dailyTss,
        rpe: isFutureDate ? undefined : rpeByDate[dateStr],
        feel: isFutureDate ? undefined : feelByDate[dateStr],
        prs: prs.length > 0 ? prs : undefined
      });
    }

    // El lastPoint para KPIs debe ser "Hoy" (índice donde i == 0)
    const todayIndex = pmcData.findIndex(p => p.date === now.toISOString().split('T')[0]) || (pmcData.length - 15);
    const todayPoint = pmcData[todayIndex > -1 ? todayIndex : pmcData.length - 15];
    const weeklyTssActual = sportTssCurrentWeek.natacion + sportTssCurrentWeek.ciclismo + sportTssCurrentWeek.carrera;
    const weeklyTssTarget = 450; 

    const totalCurrentTss = weeklyTssActual || 1;

    // Obtener datos de zonas
    let totalZ1 = 0, totalZ2 = 0, totalZ3 = 0, totalZ4 = 0, totalZ5 = 0;
    let hasZoneData = false;
    
    // Obtener telemetría de base de datos
    const { data: telemetryLogs } = await supabase
      .from('universal_telemetry')
      .select('created_at, avg_power, actual_duration_min, actual_distance_km, source_provider, hr_zones_summary')
      .eq('user_id', userId);

    if (telemetryLogs && telemetryLogs.length > 0) {
      telemetryLogs.forEach(log => {
        if (log.hr_zones_summary) {
          const summary = log.hr_zones_summary as any;
          if (summary.Z1 || summary.Z2 || summary.Z3 || summary.Z4 || summary.Z5) {
            hasZoneData = true;
            totalZ1 += Number(summary.Z1 || 0);
            totalZ2 += Number(summary.Z2 || 0);
            totalZ3 += Number(summary.Z3 || 0);
            totalZ4 += Number(summary.Z4 || 0);
            totalZ5 += Number(summary.Z5 || 0);
          }
        }
      });
    }

    let hrZoneDistribution: ZonePoint[] = [];
    if (hasZoneData) {
      const grandTotal = totalZ1 + totalZ2 + totalZ3 + totalZ4 + totalZ5 || 1;
      hrZoneDistribution = [
        { zone: 'Z1 - Recuperación', percentage: Math.round((totalZ1 / grandTotal) * 100), color: 'bg-zinc-650', hours: Number((totalZ1 / 3600).toFixed(1)) },
        { zone: 'Z2 - Aeróbico Base', percentage: Math.round((totalZ2 / grandTotal) * 100), color: 'bg-[var(--color-run)]', hours: Number((totalZ2 / 3600).toFixed(1)) },
        { zone: 'Z3 - Tempo', percentage: Math.round((totalZ3 / grandTotal) * 100), color: 'bg-amber-400', hours: Number((totalZ3 / 3600).toFixed(1)) },
        { zone: 'Z4 - Umbral Láctico', percentage: Math.round((totalZ4 / grandTotal) * 100), color: 'bg-orange-500', hours: Number((totalZ4 / 3600).toFixed(1)) },
        { zone: 'Z5 - VO2 Máx / Anaeróbico', percentage: Math.round((totalZ5 / grandTotal) * 100), color: 'bg-red-500', hours: Number((totalZ5 / 3600).toFixed(1)) }
      ];
    } else {
      hrZoneDistribution = generateSimulatedHrZoneDistribution(profile.level || 'intermedio');
    }

    // Calcular historial de ritmos y FTP
    const profileFtp = profile.current_ftp || 200;
    let profileRunSec = 300;
    if (profile.current_run_pace) {
      const parts = profile.current_run_pace.split(':');
      if (parts.length === 2) {
        profileRunSec = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      }
    }
    let profileSwimSec = 105;
    if (profile.current_swim_pace) {
      const parts = profile.current_swim_pace.split(':');
      if (parts.length === 2) {
        profileSwimSec = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      }
    }

    const pacePowerHistory = generatePacePowerHistory(profileFtp, profileRunSec, profileSwimSec);

    return {
      pmcData,
      currentCtl: todayPoint.ctl,
      currentAtl: todayPoint.atl,
      currentTsb: todayPoint.tsb,
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
      },
      weeklyDistance: {
        natacion: Math.round(sportDistanceCurrentWeek.natacion),
        ciclismo: Number(sportDistanceCurrentWeek.ciclismo.toFixed(1)),
        carrera: Number(sportDistanceCurrentWeek.carrera.toFixed(1))
      },
      pacePowerHistory,
      hrZoneDistribution
    };

  } catch (error) {
    console.error('Error in fetchAndCalculateAnalytics:', error);
    return getFallbackAnalyticsData();
  }
}

/**
 * Funciones de simulación y generación de datos auxiliares para analíticas
 */
function generatePacePowerHistory(ftp: number, runSec: number, swimSec: number): PacePowerPoint[] {
  const points: PacePowerPoint[] = [];
  const today = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 7);
    
    const progressFactor = (11 - i) / 11; // 0 en semana 1, 1 hoy
    const currentFtp = Math.round(ftp * (0.88 + progressFactor * 0.12) + Math.sin(i) * 3);
    const currentRunPace = Math.round(runSec * (1.12 - progressFactor * 0.12) + Math.cos(i) * 4);
    const currentSwimPace = Math.round(swimSec * (1.10 - progressFactor * 0.10) + Math.sin(i) * 2);

    points.push({
      date: d.toISOString().split('T')[0],
      ftp: currentFtp,
      runPaceSeconds: currentRunPace,
      swimPaceSeconds: currentSwimPace
    });
  }
  return points;
}

function generateSimulatedHrZoneDistribution(level: string): ZonePoint[] {
  const isBeginner = level === 'principiante';
  return [
    { zone: 'Z1 - Recuperación Activa', percentage: isBeginner ? 15 : 10, color: 'bg-zinc-650', hours: isBeginner ? 1.5 : 1.0 },
    { zone: 'Z2 - Resistencia Aeróbica', percentage: isBeginner ? 75 : 68, color: 'bg-[var(--color-run)]', hours: isBeginner ? 7.5 : 6.8 },
    { zone: 'Z3 - Tempo', percentage: isBeginner ? 7 : 12, color: 'bg-amber-400', hours: isBeginner ? 0.7 : 1.2 },
    { zone: 'Z4 - Umbral Láctico', percentage: isBeginner ? 2 : 7, color: 'bg-orange-500', hours: isBeginner ? 0.2 : 0.7 },
    { zone: 'Z5 - VO2 Máx / Anaeróbico', percentage: isBeginner ? 1 : 3, color: 'bg-red-500', hours: isBeginner ? 0.1 : 0.3 }
  ];
}

/**
 * Versión cacheada de la consulta de analíticas.
 */
const getCachedAnalyticsDashboardData = unstable_cache(
  async (userId: string) => {
    return fetchAndCalculateAnalytics(userId);
  },
  ['analytics-dashboard-data'],
  {
    revalidate: 300, // 5 minutos
    tags: ['analytics']
  }
);

/**
 * Obtiene y calcula los datos completos del dashboard de analíticas de forma optimizada.
 */
export async function getAnalyticsDashboardData(): Promise<AnalyticsDashboardData> {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    
    if (!authData?.user) {
      return getFallbackAnalyticsData();
    }

    return getCachedAnalyticsDashboardData(authData.user.id);
  } catch (error) {
    console.error('Error in getAnalyticsDashboardData:', error);
    return getFallbackAnalyticsData();
  }
}

/**
 * Devuelve datos simulados espectaculares cuando no hay conexión o falta histórico.
 */
function getFallbackAnalyticsData(level: string = 'intermedio'): AnalyticsDashboardData {
  const pmcData = generateSimulatedPmcData();
  const lastPoint = pmcData[pmcData.length - 1];

  return {
    pmcData,
    currentCtl: lastPoint.ctl, // here fallback doesn't matter much
    currentAtl: lastPoint.atl,
    currentTsb: lastPoint.tsb,
    weeklyTssActual: 385,
    weeklyTssTarget: 450,
    sportDistribution: {
      natacion: { tss: 75, percentage: 19 },
      ciclismo: { tss: 195, percentage: 51 },
      carrera: { tss: 115, percentage: 30 }
    },
    weeklyDistance: {
      natacion: 4500, // metros
      ciclismo: 120, // km
      carrera: 28 // km
    },
    pacePowerHistory: generatePacePowerHistory(220, 300, 105),
    hrZoneDistribution: generateSimulatedHrZoneDistribution(level)
  };
}
