import { createClient } from '@/lib/supabase/server'

const reply = (body: object, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' } })
const valid = (value: unknown, min: number, max: number) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max
type HealthInput = { date: string; sleepHours: number; hrv: number; restingHeartRate: number }

function isHealthInput(value: unknown): value is HealthInput {
  if (!value || typeof value !== 'object') return false
  const data = value as Record<string, unknown>
  return typeof data.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data.date) && valid(data.sleepHours, 0.1, 24) && valid(data.hrv, 1, 300) && valid(data.restingHeartRate, 20, 240)
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (request.headers.get('x-triwavex-native') !== '1' || request.headers.get('content-type')?.split(';')[0] !== 'application/json' || (origin !== null && origin !== new URL(request.url).origin)) return reply({ error: 'Solicitud no permitida' }, 403)
  try {
    const input: unknown = await request.json()
    if (!isHealthInput(input)) return reply({ error: 'Métricas inválidas.' }, 400)
    const data = input
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return reply({ error: 'Tu sesión ha caducado.' }, 401)
    const { error } = await supabase.from('user_biometrics').upsert({
      user_id: user.id, date: data.date, sleep_hours: data.sleepHours, hrv: Math.round(data.hrv), rhr: Math.round(data.restingHeartRate), source: 'apple_health', source_updated_at: new Date().toISOString(),
    } as never, { onConflict: 'user_id,date' })
    if (error) throw error
    return reply({ synced: true })
  } catch { return reply({ error: 'No se han podido guardar los datos de Salud.' }, 503) }
}
