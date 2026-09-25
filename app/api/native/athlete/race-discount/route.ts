import { createClient } from '@/lib/supabase/server'
import { isValidRaceDate, normalizeRaceName, validateRaceProofFile } from '@/lib/race-discount-proof'

export const runtime = 'nodejs'

const BUCKET = 'race-registration-proofs'
const MAX_MULTIPART_BYTES = 4 * 1024 * 1024 + 256 * 1024

const reply = (body: object, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store', Vary: 'Cookie' },
})

function nativeRequest(request: Request) {
  const origin = request.headers.get('origin')
  return request.headers.get('x-triwavex-native') === '1' &&
    (origin === null || origin === new URL(request.url).origin)
}

type AthleteAuth = { ok: true; supabase: any; user: { id: string } } | { ok: false; response: Response }

async function signedInAthlete(): Promise<AthleteAuth> {
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, response: reply({ error: 'Tu sesión ha caducado.' }, 401) }

  const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (error || !profile) return { ok: false, response: reply({ error: 'No se ha podido comprobar tu perfil.' }, 503) }
  if (profile.role !== 'athlete') return { ok: false, response: reply({ error: 'Esta promoción es solo para cuentas de atleta.' }, 403) }
  return { ok: true, supabase, user }
}

export async function GET(request: Request): Promise<Response> {
  if (!nativeRequest(request)) return reply({ error: 'Solicitud no permitida.' }, 403)

  try {
    const auth = await signedInAthlete()
    if (!auth.ok) return auth.response
    const { data, error } = await auth.supabase
      .from('athlete_race_discount_requests')
      .select('id,race_name,race_date,status,review_note,apple_offer_code,created_at,reviewed_at')
      .eq('athlete_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) return reply({ error: 'No se ha podido cargar el estado de la solicitud.' }, 503)

    if (!data) return reply({ request: null })
    return reply({ request: {
      id: data.id,
      raceName: data.race_name,
      raceDate: data.race_date,
      status: data.status,
      reviewNote: data.review_note,
      appleOfferCode: data.status === 'approved' ? data.apple_offer_code : null,
      createdAt: data.created_at,
      reviewedAt: data.reviewed_at,
    } })
  } catch {
    return reply({ error: 'Servicio no disponible.' }, 503)
  }
}

export async function POST(request: Request): Promise<Response> {
  if (!nativeRequest(request) || request.headers.get('content-type')?.split(';')[0] !== 'multipart/form-data') {
    return reply({ error: 'Solicitud no permitida.' }, 403)
  }
  const contentLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(contentLength) && contentLength > MAX_MULTIPART_BYTES) {
    return reply({ error: 'El justificante supera el límite de 4 MB.' }, 413)
  }

  try {
    const auth = await signedInAthlete()
    if (!auth.ok) return auth.response
    const form = await request.formData()
    const rawRaceName = form.get('raceName')
    const rawRaceDate = form.get('raceDate')
    const proof = form.get('proof')
    if (typeof rawRaceName !== 'string' || typeof rawRaceDate !== 'string' || !(proof instanceof File)) {
      return reply({ error: 'Indica la carrera, la fecha y adjunta una imagen o PDF.' }, 400)
    }
    const raceName = normalizeRaceName(rawRaceName)
    if (!raceName) return reply({ error: 'El nombre de la carrera debe tener entre 2 y 120 caracteres.' }, 400)
    if (!isValidRaceDate(rawRaceDate)) return reply({ error: 'La fecha no parece válida.' }, 400)
    if (proof.size > 4 * 1024 * 1024) return reply({ error: 'El justificante no puede superar 4 MB.' }, 413)

    const bytes = new Uint8Array(await proof.arrayBuffer())
    const contentType = validateRaceProofFile(proof, bytes)
    if (!contentType) return reply({ error: 'El archivo debe ser una imagen JPG/PNG o un PDF auténtico de hasta 4 MB.' }, 400)

    const { data: existing, error: existingError } = await auth.supabase
      .from('athlete_race_discount_requests')
      .select('id')
      .eq('athlete_id', auth.user.id)
      .eq('status', 'pending')
      .maybeSingle()
    if (existingError) return reply({ error: 'No se ha podido comprobar tu solicitud anterior.' }, 503)
    if (existing) return reply({ error: 'Ya tienes una solicitud pendiente. Espera a que la revisemos.' }, 409)

    const extension = contentType === 'image/jpeg' ? 'jpg' : contentType === 'image/png' ? 'png' : 'pdf'
    const objectPath = `${auth.user.id}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await auth.supabase.storage.from(BUCKET).upload(objectPath, bytes, {
      contentType,
      cacheControl: '0',
      upsert: false,
    })
    if (uploadError) return reply({ error: 'No se ha podido subir el justificante. Inténtalo de nuevo.' }, 503)

    const { error: insertError } = await auth.supabase.from('athlete_race_discount_requests').insert({
      athlete_id: auth.user.id,
      race_name: raceName,
      race_date: rawRaceDate || null,
      proof_object_path: objectPath,
      status: 'pending',
    })
    if (insertError) {
      await auth.supabase.storage.from(BUCKET).remove([objectPath])
      if (insertError.code === '23505') return reply({ error: 'Ya tienes una solicitud pendiente. Espera a que la revisemos.' }, 409)
      return reply({ error: 'No se ha podido registrar la solicitud. Inténtalo de nuevo.' }, 503)
    }

    return reply({ submitted: true }, 201)
  } catch {
    return reply({ error: 'No se ha podido enviar la solicitud. Revisa tu conexión e inténtalo de nuevo.' }, 503)
  }
}
