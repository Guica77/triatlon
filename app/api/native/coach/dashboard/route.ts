import { createClient } from '@/lib/supabase/server'

const reply = (body: object, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' },
})

function permitted(request: Request) {
  const origin = request.headers.get('origin')
  return request.headers.get('x-triwavex-native') === '1' &&
    (origin === null || origin === new URL(request.url).origin)
}

function dayString(date: Date) {
  return date.toISOString().slice(0, 10)
}

function isDay(value: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)))
}

export async function GET(request: Request) {
  if (!permitted(request)) return reply({ error: 'Solicitud no permitida' }, 403)

  const params = new URL(request.url).searchParams
  const todayParam = params.get('today')
  const weekStartParam = params.get('weekStart')
  const weekEndParam = params.get('weekEnd')
  if ((todayParam !== null && !isDay(todayParam)) ||
      (weekStartParam !== null && !isDay(weekStartParam)) ||
      (weekEndParam !== null && !isDay(weekEndParam))) {
    return reply({ error: 'Las fechas del resumen no son válidas.' }, 400)
  }
  const requestedWeekStart = weekStartParam || dayString(new Date(Date.now() - ((new Date().getUTCDay() + 6) % 7) * 86_400_000))
  const requestedWeekEnd = weekEndParam || dayString(new Date(Date.parse(`${requestedWeekStart}T12:00:00Z`) + 6 * 86_400_000))
  const weekDuration = Date.parse(`${requestedWeekEnd}T12:00:00Z`) - Date.parse(`${requestedWeekStart}T12:00:00Z`)
  if (weekDuration < 0 || weekDuration > 6 * 86_400_000) return reply({ error: 'El intervalo semanal no es válido.' }, 400)

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return reply({ error: 'Tu sesión ha caducado.' }, 401)

    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('role, first_name').eq('id', user.id).maybeSingle()
    if (profileError || !profile) return reply({ error: 'No se ha podido cargar el perfil.' }, 503)
    if (profile.role !== 'coach') return reply({ error: 'Esta pantalla es solo para entrenadores.' }, 403)

    const { data: links, error: linksError } = await supabase
      .from('coach_athletes').select('athlete_id, group_id, coach_groups(name)').eq('coach_id', user.id)
    if (linksError) return reply({ error: 'No se ha podido cargar tu equipo.' }, 503)
    const athleteIds = (links || []).map(link => link.athlete_id)
    if (athleteIds.length === 0) return reply({ coachName: profile.first_name || 'Entrenador', athletes: [] })

    const todayKey = todayParam || dayString(new Date())

    const [profiles, workouts] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name, training_plans(name)').in('id', athleteIds),
      supabase.from('user_workouts')
        .select('user_id, scheduled_date, status, training_sessions(sport_type, duration_min, description)')
        .in('user_id', athleteIds).gte('scheduled_date', requestedWeekStart).lte('scheduled_date', requestedWeekEnd),
    ])
    if (profiles.error || workouts.error) return reply({ error: 'No se ha podido cargar el resumen del equipo.' }, 503)

    const athletes = (profiles.data || []).map(athlete => {
      const sessions = (workouts.data || []).filter(workout => workout.user_id === athlete.id)
      const todayWorkout = sessions.find(workout => workout.scheduled_date === todayKey)
      const session = Array.isArray(todayWorkout?.training_sessions) ? todayWorkout.training_sessions[0] : todayWorkout?.training_sessions
      const trainingPlan = Array.isArray(athlete.training_plans) ? athlete.training_plans[0] : athlete.training_plans
      const group = links?.find(link => link.athlete_id === athlete.id)?.coach_groups
      const groupName = Array.isArray(group) ? group[0]?.name : group?.name
      return {
        id: athlete.id,
        name: [athlete.first_name, athlete.last_name].filter(Boolean).join(' ') || 'Atleta',
        planName: trainingPlan?.name || null,
        groupName: groupName || null,
        todayWorkout: session ? {
          sport: session.sport_type || 'Entrenamiento',
          title: session.description || session.sport_type || 'Entrenamiento',
          durationMinutes: session.duration_min || 0,
          status: todayWorkout?.status || 'pending',
        } : null,
        completedThisWeek: sessions.filter(workout => workout.status === 'completed').length,
        totalThisWeek: sessions.filter(workout => {
          const value = Array.isArray(workout.training_sessions) ? workout.training_sessions[0] : workout.training_sessions
          return value?.sport_type !== 'descanso'
        }).length,
      }
    })

    return reply({ coachName: profile.first_name || 'Entrenador', athletes })
  } catch {
    return reply({ error: 'Servicio no disponible.' }, 503)
  }
}
