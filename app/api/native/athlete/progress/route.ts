import { createClient } from '@/lib/supabase/server'
import {
  buildNativeAthleteProgress,
  nativeProgressDateRange,
  type NativeBiometricsRow,
  type NativeWorkoutRow,
} from '@/lib/native/athlete-progress'

const reply = (body: object, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' },
})

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  if (
    request.headers.get('x-triwavex-native') !== '1' ||
    (origin !== null && origin !== new URL(request.url).origin)
  ) {
    return reply({ error: 'Solicitud no permitida' }, 403)
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return reply({ error: 'Tu sesión ha caducado. Vuelve a iniciar sesión.' }, 401)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) return reply({ error: 'No se ha podido cargar el progreso.' }, 503)
    if (!profile || profile.role !== 'athlete') return reply({ error: 'Este contenido no está disponible.' }, 403)

    const range = nativeProgressDateRange()
    const { data: workouts, error: workoutsError } = await supabase
      .from('user_workouts')
      .select(`
        id,
        scheduled_date,
        completed_at,
        actual_tss,
        status,
        training_sessions(sport_type, duration_min, description),
        universal_telemetry(actual_distance_km, actual_duration_min, actual_tss)
      `)
      .eq('user_id', user.id)
      .gte('scheduled_date', range.start)
      .lte('scheduled_date', range.end)
      .order('scheduled_date', { ascending: true })

    if (workoutsError) return reply({ error: 'No se ha podido cargar el progreso.' }, 503)

    const { data: biometrics, error: biometricsError } = await supabase
      .from('user_biometrics')
      .select('date, readiness_score, hrv, sleep_hours, fatigue_rating')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (biometricsError) return reply({ error: 'No se ha podido cargar el progreso.' }, 503)

    return reply(buildNativeAthleteProgress({
      profile: { first_name: profile.first_name },
      workouts: (workouts ?? []) as NativeWorkoutRow[],
      biometrics: biometrics as NativeBiometricsRow | null,
    }))
  } catch {
    return reply({ error: 'Servicio no disponible.' }, 503)
  }
}
