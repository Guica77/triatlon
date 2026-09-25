import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const reply = (body: object, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' },
})

export async function GET(request: Request) {
  const origin = request.headers.get('origin')
  if (request.headers.get('x-triwavex-native') !== '1' ||
      (origin !== null && origin !== new URL(request.url).origin)) {
    return reply({ error: 'Solicitud no permitida.' }, 403)
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return reply({ error: 'Tu sesión ha caducado.' }, 401)

    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (profileError || !profile) return reply({ error: 'No se ha podido cargar tu perfil.' }, 503)
    if (profile.role !== 'coach') return reply({ error: 'Esta información es solo para entrenadores.' }, 403)

    // The SECURITY DEFINER RPC checks auth.uid() and returns only the caller's rows.
    const { data, error } = await (supabase as any).rpc('get_my_coach_earnings')
    if (error || !Array.isArray(data) || data.length !== 1) {
      return reply({ error: 'No se ha podido cargar el resumen de ingresos.' }, 503)
    }

    const result = data[0]
    return reply({
      pendingAppleReportCount: result.pending_apple_report_count,
      pendingRefundAdjustmentCount: result.pending_refund_adjustment_count,
      reconciledBalances: result.reconciled_balances,
      entries: result.entries,
    })
  } catch {
    return reply({ error: 'Servicio no disponible.' }, 503)
  }
}
