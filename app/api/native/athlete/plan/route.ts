import { createClient } from '@/lib/supabase/server'
import { previewPlanMove } from '@/lib/adaptive-plan/server'
import { notifyCoachOfPlanRequest } from '@/lib/adaptive-plan/notifications'

const reply = (body: object, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' },
})

function permitted(request: Request, needsJSON = false) {
  const origin = request.headers.get('origin')
  return request.headers.get('x-triwavex-native') === '1' &&
    (!needsJSON || request.headers.get('content-type')?.split(';')[0].trim() === 'application/json') &&
    (origin === null || origin === new URL(request.url).origin)
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10)
}

function validDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`))
}

function validUUID(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function GET(request: Request) {
  if (!permitted(request)) return reply({ error: 'Solicitud no permitida' }, 403)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return reply({ error: 'Tu sesión ha caducado.' }, 401)

    const today = new Date()
    const start = new Date(today); start.setDate(start.getDate() - 21)
    const end = new Date(today); end.setDate(end.getDate() + 55)
    const [{ data: profile, error: profileError }, { data: workouts, error: workoutsError }] = await Promise.all([
      supabase.from('profiles').select('first_name,coach_id,target_race_name,training_plans(name)').eq('id', user.id).maybeSingle(),
      supabase.from('user_workouts')
        .select('id,scheduled_date,scheduled_slot,status,adjustment_reason,training_sessions(sport_type,duration_min,description,day_name)')
        .eq('user_id', user.id).gte('scheduled_date', isoDay(start)).lte('scheduled_date', isoDay(end))
        .order('scheduled_date', { ascending: true }).order('scheduled_slot', { ascending: true }),
    ])
    if (profileError || workoutsError || !profile) return reply({ error: 'No se ha podido cargar el plan.' }, 503)

    const trainingPlan = Array.isArray(profile.training_plans) ? profile.training_plans[0] : profile.training_plans
    return reply({
      athleteName: profile.first_name || 'Atleta',
      planName: trainingPlan?.name || profile.target_race_name || 'Plan de entrenamiento',
      readOnly: Boolean(profile.coach_id),
      workouts: (workouts || []).map(workout => {
        const session = Array.isArray(workout.training_sessions) ? workout.training_sessions[0] : workout.training_sessions
        return {
          id: workout.id, date: workout.scheduled_date, slot: workout.scheduled_slot || 'flexible', status: workout.status || 'pending',
          sport: session?.sport_type || 'descanso', durationMinutes: session?.duration_min || 0,
          title: session?.description || session?.day_name || 'Entrenamiento', detail: session?.description || null,
          lastChange: workout.adjustment_reason || null,
        }
      }),
      generatedAt: new Date().toISOString(),
    })
  } catch {
    return reply({ error: 'Servicio no disponible.' }, 503)
  }
}

export async function POST(request: Request) {
  if (!permitted(request, true)) return reply({ error: 'Solicitud no permitida' }, 403)
  const input = await request.json().catch(() => null) as {
    workoutId?: unknown
    targetDate?: unknown
    targetSlot?: unknown
    idempotencyKey?: unknown
  } | null
  if (!input || !validUUID(input.workoutId) || !validDate(input.targetDate) ||
      !['morning', 'evening', 'flexible'].includes(String(input.targetSlot)) || !validUUID(input.idempotencyKey)) {
    return reply({ error: 'Cambio no válido.' }, 400)
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return reply({ error: 'Tu sesión ha caducado.' }, 401)
  const result = await previewPlanMove({
    userId: user.id,
    idempotencyKey: input.idempotencyKey,
    intent: {
      kind: 'move',
      workoutId: input.workoutId,
      targetDate: input.targetDate,
      targetSlot: input.targetSlot as 'morning' | 'evening' | 'flexible',
    },
  })
  return 'error' in result ? reply({ error: result.error }, result.status) : reply(result.data)
}

export async function PUT(request: Request) {
  if (!permitted(request, true)) return reply({ error: 'Solicitud no permitida' }, 403)
  const input = await request.json().catch(() => null) as { proposalId?: unknown; action?: unknown } | null
  if (!input || !validUUID(input.proposalId)) return reply({ error: 'Propuesta no válida.' }, 400)
  const action = input.action === 'submit' ? 'submit' : input.action === 'confirm' ? 'confirm' : null
  if (!action) return reply({ error: 'Acción no válida.' }, 400)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return reply({ error: 'Tu sesión ha caducado.' }, 401)
  const rpc = supabase as unknown as {
    rpc(name: 'confirm_plan_adjustment' | 'submit_plan_adjustment_request', args: { proposal: string }): Promise<{ data: unknown; error: { code?: string; message: string } | null }>
  }
  const operation = action === 'submit' ? 'submit_plan_adjustment_request' : 'confirm_plan_adjustment'
  const { data, error } = await rpc.rpc(operation, { proposal: input.proposalId })
  if (error?.code === '40001') return reply({ error: 'El plan ha cambiado. Recalcula la propuesta.' }, 409)
  if (error?.code === '42501') return reply({ error: 'No tienes permiso para confirmar este cambio.' }, 403)
  if (error) return reply({ error: 'No se ha podido confirmar el cambio.' }, 409)
  if (action === 'submit' && data && typeof data === 'object' && 'coachId' in data && typeof data.coachId === 'string') {
    await notifyCoachOfPlanRequest(data.coachId)
  }
  return reply({ result: data })
}

export async function PATCH(request: Request) {
  if (!permitted(request, true)) return reply({ error: 'Solicitud no permitida' }, 403)
  try {
    const input = await request.json().catch(() => null) as { workoutId?: unknown; date?: unknown; status?: unknown } | null
    if (!input || typeof input.workoutId !== 'string' || input.workoutId.length > 80) return reply({ error: 'Cambio no válido.' }, 400)
    const hasStatus = input.status !== undefined
    if (input.date !== undefined || !hasStatus || !['pending', 'completed', 'missed'].includes(String(input.status))) return reply({ error: 'Cambio no válido.' }, 400)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return reply({ error: 'Tu sesión ha caducado.' }, 401)
    const [{ data: profile }, { data: workout, error: workoutError }] = await Promise.all([
      supabase.from('profiles').select('coach_id').eq('id', user.id).maybeSingle(),
      supabase.from('user_workouts').select('id,scheduled_date,status').eq('id', input.workoutId).eq('user_id', user.id).maybeSingle(),
    ])
    if (profile?.coach_id) return reply({ error: 'Este plan lo gestiona tu entrenador.' }, 409)
    if (workoutError || !workout) return reply({ error: 'Entrenamiento no encontrado.' }, 404)

    const update: {
      scheduled_date?: string
      adjustment_reason?: string
      status?: 'pending' | 'completed' | 'missed'
      completed_at?: string | null
    } = {}
    let explanation = 'El entrenamiento se ha actualizado.'
    let improvement = 'Tu calendario refleja mejor lo que vas a realizar.'
    let watchOut = 'Comprueba que el cambio encaja con tu recuperación.'
    if (hasStatus) {
      const nextStatus = input.status as 'pending' | 'completed' | 'missed'
      update.status = nextStatus
      update.completed_at = nextStatus === 'completed' ? new Date().toISOString() : null
      explanation = input.status === 'completed' ? 'La sesión se ha marcado como completada.' : input.status === 'missed' ? 'La sesión se ha marcado como no realizada.' : 'La sesión vuelve a estar pendiente.'
      improvement = input.status === 'completed' ? 'La carga realizada contará en tu progreso y próximos ajustes.' : 'El estado real ayuda a reajustar las siguientes sesiones.'
      watchOut = input.status === 'completed' ? 'Revisa que los datos del reloj se hayan sincronizado.' : 'El plan puede necesitar redistribuir la carga pendiente.'
    }
    if (Object.keys(update).length === 0) return reply({ workout, change: { explanation, improvement, watchOut } })
    const { data: saved, error } = await supabase.from('user_workouts').update(update).eq('id', workout.id).eq('user_id', user.id).select('id,scheduled_date,status').single()
    if (error || !saved) return reply({ error: 'No se ha podido guardar el cambio.' }, 503)
    return reply({ workout: { id: saved.id, date: saved.scheduled_date, status: saved.status }, change: { explanation, improvement, watchOut } })
  } catch {
    return reply({ error: 'Servicio no disponible.' }, 503)
  }
}
