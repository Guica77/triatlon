/**
 * Utility for parsing paces and calculating personalized training zones
 * (Power zones for Cycling, Pace zones for Running and Swimming).
 */

export interface AthleteThresholds {
  ftp: number; // Watts
  swimPaceSec: number; // seconds per 100m
  runPaceSec: number; // seconds per km
}

/**
 * Parses a MM:SS pace string into total seconds.
 */
export function parsePaceToSeconds(paceStr: string | null | undefined, defaultSeconds: number): number {
  if (!paceStr) return defaultSeconds;
  const clean = paceStr.trim();
  const parts = clean.split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);
    if (!isNaN(mins) && !isNaN(secs)) {
      return mins * 60 + secs;
    }
  }
  return defaultSeconds;
}

/**
 * Formats total seconds into a MM:SS pace string.
 */
export function formatSecondsToPace(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export interface ZoneRange {
  name: string;
  min: number;
  max: number;
  formatted?: string;
}

export interface ProfileMetrics {
  current_ftp?: number | null;
  current_swim_pace?: string | null;
  current_run_pace?: string | null;
}

/**
 * Calculates cycling power zones based on FTP.
 */
export function getCyclingZones(ftp: number): Record<string, ZoneRange> {
  return {
    Z1: { name: 'Recuperación Activa', min: Math.round(ftp * 0.30), max: Math.round(ftp * 0.55) },
    Z2: { name: 'Resistencia Aeróbica', min: Math.round(ftp * 0.56), max: Math.round(ftp * 0.75) },
    Z3: { name: 'Tempo', min: Math.round(ftp * 0.76), max: Math.round(ftp * 0.90) },
    Z4: { name: 'Umbral Lactato', min: Math.round(ftp * 0.91), max: Math.round(ftp * 1.05) },
    Z5: { name: 'Capacidad Aeróbica (VO2max)', min: Math.round(ftp * 1.06), max: Math.round(ftp * 1.20) },
  };
}

/**
 * Calculates running pace zones based on threshold pace (seconds/km).
 * Note: Pace zones are inverse (faster pace = fewer seconds).
 */
export function getRunningZones(thresholdPaceSec: number): Record<string, ZoneRange> {
  // Multiply seconds to get slower paces for recovery/aerobic, divide for faster
  return {
    Z1: { name: 'Recuperación Activa', min: Math.round(thresholdPaceSec * 1.25), max: Math.round(thresholdPaceSec * 1.35) },
    Z2: { name: 'Resistencia Aeróbica', min: Math.round(thresholdPaceSec * 1.12), max: Math.round(thresholdPaceSec * 1.24) },
    Z3: { name: 'Tempo', min: Math.round(thresholdPaceSec * 1.01), max: Math.round(thresholdPaceSec * 1.11) },
    Z4: { name: 'Umbral Lactato', min: Math.round(thresholdPaceSec * 0.95), max: Math.round(thresholdPaceSec * 1.00) },
    Z5: { name: 'Capacidad Aeróbica (VO2max)', min: Math.round(thresholdPaceSec * 0.85), max: Math.round(thresholdPaceSec * 0.94) },
  };
}

/**
 * Calculates swimming pace zones based on threshold pace (seconds/100m).
 */
export function getSwimmingZones(thresholdPaceSec: number): Record<string, ZoneRange> {
  return {
    Z1: { name: 'Recuperación Activa', min: thresholdPaceSec + 20, max: thresholdPaceSec + 30 },
    Z2: { name: 'Ritmo Aeróbico / Endurance', min: thresholdPaceSec + 10, max: thresholdPaceSec + 19 },
    Z3: { name: 'Ritmo de Umbral (CSS)', min: thresholdPaceSec + 5, max: thresholdPaceSec + 9 },
    Z4: { name: 'Ritmo Crítico', min: thresholdPaceSec, max: thresholdPaceSec + 4 },
    Z5: { name: 'Ritmo de Competición Corta', min: thresholdPaceSec - 10, max: thresholdPaceSec - 1 },
  };
}

/**
 * Parses profile and adapts a generic workout description with specific target watts/paces.
 */
export function adaptWorkoutDescription(description: string, sportType: string, profile: ProfileMetrics | null | undefined): string {
  if (!description) return '';
  if (!profile) return description;

  const sport = (sportType || '').toLowerCase();
  
  if (sport === 'ciclismo') {
    const ftp = profile.current_ftp || 180;
    const zones = getCyclingZones(ftp);
    
    return description.replace(/\b(Z[1-5])\b/g, (match, zone) => {
      const zRange = zones[zone];
      if (zRange) {
        return `${zone} (${zRange.min}-${zRange.max}W)`;
      }
      return match;
    });
  } 
  
  if (sport === 'carrera') {
    const runPaceStr = profile.current_run_pace || '05:30';
    const thresholdPaceSec = parsePaceToSeconds(runPaceStr, 330);
    const zones = getRunningZones(thresholdPaceSec);
    
    return description.replace(/\b(Z[1-5])\b/g, (match, zone) => {
      const zRange = zones[zone];
      if (zRange) {
        // Since running zones: min pace value in seconds is faster (max speed), and max pace is slower,
        // we format max to min pace for intuitive user reading (e.g. 05:40 - 05:20)
        const formatMin = formatSecondsToPace(zRange.max);
        const formatMax = formatSecondsToPace(zRange.min);
        return `${zone} (${formatMin}-${formatMax} min/km)`;
      }
      return match;
    });
  }
  
  if (sport === 'natacion') {
    const swimPaceStr = profile.current_swim_pace || '02:00';
    const thresholdPaceSec = parsePaceToSeconds(swimPaceStr, 120);
    const zones = getSwimmingZones(thresholdPaceSec);
    
    return description.replace(/\b(Z[1-5])\b/g, (match, zone) => {
      const zRange = zones[zone];
      if (zRange) {
        const formatMin = formatSecondsToPace(zRange.min);
        const formatMax = formatSecondsToPace(zRange.max);
        return `${zone} (${formatMin}-${formatMax} min/100m)`;
      }
      return match;
    });
  }

  return description;
}
