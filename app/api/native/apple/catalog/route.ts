import { createAdminClient } from '@/lib/supabase/admin'
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
    const session = await createClient()
    const { data: { user } } = await session.auth.getUser()
    if (!user) return reply({ error: 'Tu sesión ha caducado.' }, 401)

    const { data: profile, error: profileError } = await session
      .from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (profileError || !profile) return reply({ error: 'No se ha podido cargar tu perfil.' }, 503)
    if (profile.role !== 'athlete' && profile.role !== 'coach') return reply({ error: 'El tipo de cuenta no es válido.' }, 403)

    const admin = createAdminClient() as any
    const { data, error } = await admin.rpc('get_native_apple_product_catalog')
    if (error || !Array.isArray(data)) return reply({ error: 'No se ha podido cargar la tienda de Apple.' }, 503)

    const products = data
      .filter((product: { plan?: string }) => product.plan === profile.role)
      .map((product: { product_id: string; plan: string; coach_capacity: number | null }) => ({
        productID: product.product_id,
        role: product.plan,
        capacity: product.coach_capacity,
      }))
    return reply({ products })
  } catch {
    return reply({ error: 'Servicio no disponible.' }, 503)
  }
}
