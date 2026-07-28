/**
 * Data Import System — Triatlon Pro
 *
 * Importa datos desde múltiples fuentes:
 * - TrainingPeaks (CSV/XML)
 * - Strava (API)
 * - Garmin Connect (API)
 * - Formato genérico (CSV)
 */

export interface ImportResult {
  success: boolean
  workoutsImported: number
  errors: string[]
  warnings: string[]
}

export interface ParsedWorkout {
  date: string
  sportType: string
  duration: number // minutes
  tss: number
  description?: string
  distance?: number // meters
  avgHR?: number
  avgPower?: number
  avgPace?: string
  calories?: number
}

// ============================================================
// TrainingPeaks CSV Import
// ============================================================

export function parseTrainingPeaksCSV(csvContent: string): ParsedWorkout[] {
  const lines = csvContent.split('\n')
  const workouts: ParsedWorkout[] = []

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const cols = parseCSVLine(line)
    if (cols.length < 5) continue

    // TrainingPeaks CSV format:
    // Date, Sport, Duration, TSS, Title, Description
    const date = cols[0]
    const sport = cols[1]?.toLowerCase() || ''
    const durationMin = parseFloat(cols[2]) || 0
    const tss = parseFloat(cols[3]) || 0
    const title = cols[4] || ''
    const description = cols[5] || ''

    const sportType = mapTPSportType(sport)

    workouts.push({
      date: normalizeDate(date),
      sportType,
      duration: durationMin,
      tss,
      description: `${title} ${description}`.trim(),
    })
  }

  return workouts
}

function mapTPSportType(tpSport: string): string {
  const s = tpSport.toLowerCase()
  if (s.includes('swim') || s.includes('natación') || s.includes('natacion')) return 'natacion'
  if (s.includes('bike') || s.includes('ride') || s.includes('ciclismo') || s.includes('cycling')) return 'ciclismo'
  if (s.includes('run') || s.includes('carrera') || s.includes('running')) return 'carrera'
  if (s.includes('brick')) return 'brick'
  if (s.includes('strength') || s.includes('fuerza') || s.includes('gym')) return 'fuerza'
  if (s.includes('rest') || s.includes('descanso') || s.includes('off')) return 'descanso'
  return 'ciclismo' // default
}

// ============================================================
// Generic CSV Import
// ============================================================

export function parseGenericCSV(csvContent: string): ParsedWorkout[] {
  const lines = csvContent.split('\n')
  const workouts: ParsedWorkout[] = []

  if (lines.length < 2) return workouts

  // Detect columns from header
  const header = lines[0].toLowerCase()
  const dateCol = findColumn(header, ['date', 'fecha', 'dia', 'day'])
  const sportCol = findColumn(header, ['sport', 'deporte', 'type', 'tipo', 'discipline'])
  const durationCol = findColumn(header, ['duration', 'duración', 'duracion', 'min', 'minutes', 'mins'])
  const tssCol = findColumn(header, ['tss', 'stress', 'carga'])
  const descCol = findColumn(header, ['description', 'descripción', 'descripcion', 'title', 'titulo', 'name'])

  if (dateCol === -1) return workouts

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const cols = parseCSVLine(line)

    workouts.push({
      date: normalizeDate(cols[dateCol] || ''),
      sportType: mapTPSportType(cols[sportCol] || 'ciclismo'),
      duration: parseFloat(cols[durationCol]) || 60,
      tss: parseFloat(cols[tssCol]) || Math.round(parseFloat(cols[durationCol] || '60') * 0.8),
      description: cols[descCol] || '',
    })
  }

  return workouts
}

function findColumn(header: string, keywords: string[]): number {
  const cols = header.split(',').map(c => c.trim().toLowerCase().replace(/"/g, ''))
  for (const kw of keywords) {
    const idx = cols.findIndex(c => c.includes(kw))
    if (idx !== -1) return idx
  }
  return -1
}

// ============================================================
// Strava API Import (client-side helper)
// ============================================================

export async function fetchStravaActivities(
  accessToken: string,
  after: number, // Unix timestamp
  before: number // Unix timestamp
): Promise<ParsedWorkout[]> {
  const workouts: ParsedWorkout[] = []

  let page = 1
  const perPage = 100

  while (true) {
    try {
      const res = await fetch(
        `https://www.strava.com/api/v3/athlete/activities?after=${after}&before=${before}&page=${page}&per_page=${perPage}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      )

      if (!res.ok) break
      const activities = await res.json()
      if (!activities || activities.length === 0) break

      for (const act of activities) {
        workouts.push({
          date: act.start_date_local?.split('T')[0] || '',
          sportType: mapStravaSportType(act.type),
          duration: Math.round((act.moving_time || 0) / 60),
          tss: estimateTSS(act),
          description: act.name || '',
          distance: act.distance,
          avgHR: act.average_heartrate,
          avgPower: act.average_watts,
          calories: act.calories,
        })
      }

      if (activities.length < perPage) break
      page++
    } catch {
      break
    }
  }

  return workouts
}

function mapStravaSportType(stravaType: string): string {
  const t = stravaType?.toLowerCase() || ''
  if (t === 'swim' || t === 'openwater') return 'natacion'
  if (t === 'ride' || t === 'virtualride' || t === 'mountainbikeride' || t === 'ebikeride') return 'ciclismo'
  if (t === 'run' || t === 'trailrun') return 'carrera'
  if (t === 'workout') return 'fuerza'
  return 'ciclismo'
}

function estimateTSS(activity: any): number {
  // Simple TSS estimation based on duration and type
  const durationMin = (activity.moving_time || 0) / 60
  const type = activity.type?.toLowerCase() || ''

  let intensity = 0.7 // default moderate
  if (activity.average_watts && activity.suggested_average_power) {
    intensity = Math.min(1.2, activity.average_watts / (activity.suggested_average_power || 200))
  }

  let tssPerMin = 0.7
  if (type === 'run') tssPerMin = 0.8
  else if (type === 'ride') tssPerMin = 0.7
  else if (type === 'swim') tssPerMin = 0.6

  return Math.round(durationMin * tssPerMin * intensity)
}

// ============================================================
// Import to Supabase
// ============================================================

export async function importWorkouts(
  workouts: ParsedWorkout[],
  userId: string
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    workoutsImported: 0,
    errors: [],
    warnings: [],
  }

  // Dynamic import to avoid server/client issues
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  for (const workout of workouts) {
    try {
      if (!workout.date || workout.duration <= 0) {
        result.warnings.push(`Saltado workout inválido: ${workout.date} - ${workout.sportType}`)
        continue
      }

      // Create training session
      const workoutDate = new Date(workout.date)
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

      const { data: session, error: sessionError } = await supabase
        .from('training_sessions')
        .insert({
          sport_type: workout.sportType,
          duration_min: workout.duration,
          description: workout.description || `Importado: ${workout.sportType}`,
          day_name: dayNames[workoutDate.getDay() + 1] || 'Lunes',
          week_number: Math.ceil((workoutDate.getTime() - new Date(workoutDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)),
        })
        .select('id')
        .single()

      if (sessionError || !session) {
        result.errors.push(`Error creando sesión: ${sessionError?.message}`)
        continue
      }

      // Create user workout
      const { error: workoutError } = await supabase
        .from('user_workouts')
        .insert({
          user_id: userId,
          session_id: session.id,
          scheduled_date: workout.date,
          status: 'completed',
          actual_tss: workout.tss,
        })

      if (workoutError) {
        result.errors.push(`Error creando workout: ${workoutError?.message}`)
        continue
      }

      result.workoutsImported++
    } catch (err: any) {
      result.errors.push(`Error inesperado: ${err.message}`)
    }
  }

  if (result.errors.length > 0) {
    result.success = false
  }

  return result
}

// ============================================================
// Helpers
// ============================================================

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function normalizeDate(dateStr: string): string {
  // Try various date formats
  const d = new Date(dateStr)
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0]
  }

  // Try DD/MM/YYYY
  const parts = dateStr.split(/[\/\-\.]/)
  if (parts.length === 3) {
    if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
    if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
  }

  return new Date().toISOString().split('T')[0]
}