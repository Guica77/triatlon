'use server'

import { revalidatePath } from 'next/cache'
import { checkAdminAccess } from '@/app/admin/actions'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidRaceDate, normalizeRaceName, validateRaceProofFile } from '@/lib/race-discount-proof'

const BUCKET = 'race-registration-proofs'

export type RaceProofActionState = { success?: boolean; error?: string }

export async function submitRaceDiscountProof(_previousState: RaceProofActionState, formData: FormData): Promise<RaceProofActionState> {
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Inicia sesión para enviar la solicitud.' }

  const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profileError || profile?.role !== 'athlete') return { error: 'Esta promoción es solo para cuentas de atleta.' }

  const raceNameValue = formData.get('raceName')
  const raceDateValue = formData.get('raceDate')
  const proof = formData.get('proof')
  if (typeof raceNameValue !== 'string' || typeof raceDateValue !== 'string' || !(proof instanceof File)) {
    return { error: 'Indica la competición y adjunta un comprobante.' }
  }
  const raceName = normalizeRaceName(raceNameValue)
  if (!raceName) return { error: 'El nombre de la competición debe tener entre 2 y 120 caracteres.' }
  if (!isValidRaceDate(raceDateValue)) return { error: 'La fecha no parece válida. Déjala vacía si no aparece en el justificante.' }

  const bytes = new Uint8Array(await proof.arrayBuffer())
  const contentType = validateRaceProofFile(proof, bytes)
  if (!contentType) return { error: 'Sube una imagen JPG/PNG o un PDF auténtico de hasta 4 MB.' }

  const { data: existing, error: existingError } = await supabase
    .from('athlete_race_discount_requests')
    .select('id')
    .eq('athlete_id', user.id)
    .eq('status', 'pending')
    .maybeSingle()
  if (existingError) return { error: 'No se pudo comprobar tu solicitud anterior. Inténtalo más tarde.' }
  if (existing) return { error: 'Ya tienes una solicitud pendiente de revisión.' }

  const extension = contentType === 'image/jpeg' ? 'jpg' : contentType === 'image/png' ? 'png' : 'pdf'
  const objectPath = `${user.id}/${crypto.randomUUID()}.${extension}`
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(objectPath, bytes, {
    contentType,
    cacheControl: '0',
    upsert: false,
  })
  if (uploadError) {
    console.error('Race discount proof upload failed', uploadError)
    return { error: 'No se pudo subir el comprobante. Revisa tu conexión e inténtalo de nuevo.' }
  }

  const { error: insertError } = await supabase.from('athlete_race_discount_requests').insert({
    athlete_id: user.id,
    race_name: raceName,
    race_date: raceDateValue || null,
    proof_object_path: objectPath,
  })
  if (insertError) {
    await supabase.storage.from(BUCKET).remove([objectPath])
    if (insertError.code === '23505') return { error: 'Ya tienes una solicitud pendiente. Espera la revisión antes de enviar otra.' }
    console.error('Race discount proof record failed', insertError)
    return { error: 'El archivo se subió, pero no pudimos registrar la solicitud. Inténtalo de nuevo.' }
  }

  revalidatePath('/descuento-carrera')
  revalidatePath('/admin/race-discounts')
  return { success: true }
}

export async function reviewRaceDiscountRequest(formData: FormData) {
  if (!(await checkAdminAccess())) throw new Error('No autorizado')
  const id = formData.get('id')
  const decision = formData.get('decision')
  const reviewNote = formData.get('reviewNote')
  const appleOfferCode = formData.get('appleOfferCode')
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id) || !['approve', 'reject'].includes(String(decision))) {
    throw new Error('Solicitud inválida')
  }
  if (typeof reviewNote !== 'string' || reviewNote.trim().length > 500) throw new Error('La nota no puede superar 500 caracteres')

  const session = await createClient()
  const { data: { user } } = await session.auth.getUser()
  if (!user) throw new Error('No autorizado')
  const db = createAdminClient() as any
  const { data: request, error: requestError } = await db.from('athlete_race_discount_requests')
    .select('id,athlete_id,proof_object_path,status')
    .eq('id', id)
    .maybeSingle()
  if (requestError || !request || request.status !== 'pending') throw new Error('La solicitud ya se ha revisado o no existe')

  let update: Record<string, unknown>
  if (decision === 'approve') {
    if (formData.get('confirmedAppleOffer') !== 'on' || typeof appleOfferCode !== 'string' || !/^[A-Za-z0-9-]{4,64}$/.test(appleOfferCode.trim())) {
      throw new Error('Confirma el periodo de un mes y añade un código Apple real y único')
    }
    const now = new Date()
    const nowIso = now.toISOString()
    const { data: campaign, error: campaignError } = await db.from('admin_discount_campaigns')
      .select('id,starts_at,ends_at,app_store_offer_reference')
      .eq('membership', 'athlete')
      .eq('discount_percent', 25)
      .eq('status', 'active')
      .not('app_store_offer_reference', 'is', null)
      .lte('starts_at', nowIso)
    const validCampaign = (campaign || []).find((item: any) => item.app_store_offer_reference?.trim()
      && (!item.ends_at || new Date(item.ends_at) > now))
    if (campaignError || !validCampaign) throw new Error('Primero configura y activa la oferta de atletas 25% en App Store Connect y vincúlala en Descuentos.')
    update = { status: 'approved', apple_offer_code: appleOfferCode.trim(), review_note: reviewNote.trim() || null, reviewed_by: user.id, reviewed_at: nowIso, updated_at: nowIso }
  } else {
    if (!reviewNote.trim()) throw new Error('Explica brevemente qué falta en el comprobante para que el atleta pueda corregirlo.')
    const nowIso = new Date().toISOString()
    update = { status: 'rejected', review_note: reviewNote.trim(), reviewed_by: user.id, reviewed_at: nowIso, updated_at: nowIso }
  }

  const { data: updated, error: updateError } = await db.from('athlete_race_discount_requests')
    .update(update)
    .eq('id', id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()
  if (updateError || !updated) throw new Error('No se pudo guardar la revisión. Comprueba si otra revisión se adelantó.')

  // The proof is needed only while pending. Delete it after the reviewer has made a decision.
  const { error: deleteError } = await db.storage.from(BUCKET).remove([request.proof_object_path])
  if (deleteError) console.error('Reviewed race proof cleanup failed', deleteError)
  revalidatePath('/admin/race-discounts')
  revalidatePath('/descuento-carrera')
}
