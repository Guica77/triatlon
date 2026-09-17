import { createClient } from '@/lib/supabase/server'
import { selectTrainingPlan } from '@/lib/training-plan-selection'

const reply = (body: object, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', 'Vary': 'Cookie' },
})

type OnboardingInput = {
  goal: string
  modality: 'triatlon' | 'carrera' | 'duatlon' | 'acuatlon' | 'acuabike'
  level: 'principiante' | 'intermedio' | 'avanzado'
  weeklyHours: number
  wantsCoach: boolean
  previousInjuries?: string
}

function inputFrom(value: unknown): OnboardingInput | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const modality = ['triatlon', 'carrera', 'duatlon', 'acuatlon', 'acuabike'].includes(raw.modality as string) ? raw.modality as OnboardingInput['modality'] : null
  const level = ['principiante', 'intermedio', 'avanzado'].includes(raw.level as string) ? raw.level as OnboardingInput['level'] : null
  const weeklyHours = typeof raw.weeklyHours === 'number' ? raw.weeklyHours : NaN
  if (!modality || !level || typeof raw.goal !== 'string' || raw.goal.trim().length < 2 || raw.goal.trim().length > 120 || !Number.isFinite(weeklyHours) || weeklyHours < 2 || weeklyHours > 30 || typeof raw.wantsCoach !== 'boolean') return null
  const injuries = typeof raw.previousInjuries === 'string' ? raw.previousInjuries.trim().slice(0, 1000) : undefined
  return { goal: raw.goal.trim(), modality, level, weeklyHours, wantsCoach: raw.wantsCoach, previousInjuries: injuries }
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (request.headers.get('x-triwavex-native') !== '1' ||
      request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json' ||
      (origin !== null && origin !== new URL(request.url).origin)) return reply({ error: 'Solicitud no permitida' }, 403)

  try {
    const body = await request.text()
    if (body.length > 8192) return reply({ error: 'Solicitud demasiado grande' }, 413)
    let value: unknown
    try { value = JSON.parse(body) } catch { return reply({ error: 'Solicitud inválida' }, 400) }
    const input = inputFrom(value)
    if (!input) return reply({ error: 'Revisa los datos de tu plan.' }, 400)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return reply({ error: 'Tu sesión ha caducado.' }, 401)
    const { data: plans } = await supabase.from('training_plans').select('*')
    const selectedPlan = selectTrainingPlan(plans, 'half', input.level)
    if (!selectedPlan) return reply({ error: 'No hay un plan compatible disponible todavía.' }, 409)

    const weeklyBand = input.weeklyHours <= 6 ? '4-6h' : input.weeklyHours <= 11 ? '7-10h' : '12+h'
    const { error: profileError } = await supabase.from('profiles').update({
      level: input.level,
      target_race_name: input.goal,
      target_race_distance: 'half',
      target_race_modality: input.modality,
      baseline_training_hours: weeklyBand,
      swim_weekly_hours: input.modality === 'carrera' || input.modality === 'duatlon' ? 0 : Math.max(1, Math.round(input.weeklyHours * 0.2)),
      bike_weekly_hours: input.modality === 'carrera' || input.modality === 'acuatlon' ? 0 : Math.max(1, Math.round(input.weeklyHours * 0.45)),
      run_weekly_hours: input.modality === 'acuabike' ? 0 : Math.max(1, Math.round(input.weeklyHours * 0.35)),
      previous_injuries: input.previousInjuries || null,
      active_plan_id: selectedPlan.id,
    }).eq('id', user.id)
    if (profileError) return reply({ error: 'No se ha podido guardar tu perfil.' }, 503)

    return reply({ success: true, destination: '/dashboard' })
  } catch {
    return reply({ error: 'Servicio no disponible' }, 503)
  }
}
