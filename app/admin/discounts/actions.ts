'use server'

import { revalidatePath } from 'next/cache'
import { checkAdminAccess } from '@/app/admin/actions'
import { createAdminClient } from '@/lib/supabase/admin'

const DISCOUNT_LEVELS = new Set(['0', '25', '50', '100'])
const MEMBERSHIPS = new Set(['athlete', 'coach'])
const STATUSES = new Set(['draft', 'active', 'paused', 'expired'])

function formText(form: FormData, key: string, max: number) {
  const value = form.get(key)
  if (typeof value !== 'string') throw new Error('Solicitud inválida')
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > max) throw new Error('Solicitud inválida')
  return trimmed
}

export async function createDiscountCampaign(form: FormData) {
  if (!(await checkAdminAccess())) throw new Error('No autorizado')

  const title = formText(form, 'title', 80)
  const code = formText(form, 'code', 32).toUpperCase()
  const membership = formText(form, 'membership', 16)
  const discount = formText(form, 'discount', 3)
  const maxRedemptions = Number(formText(form, 'maxRedemptions', 6))
  const appStoreOfferReference = (form.get('appStoreOfferReference') as string | null)?.trim() || null
  const startsAt = formText(form, 'startsAt', 40)
  const endsAt = (form.get('endsAt') as string | null)?.trim() || null

  if (!/^[A-Z0-9-]{4,32}$/.test(code) || !MEMBERSHIPS.has(membership) || !DISCOUNT_LEVELS.has(discount)
    || !Number.isInteger(maxRedemptions) || maxRedemptions < 1 || maxRedemptions > 100000
    || Number.isNaN(Date.parse(startsAt)) || (endsAt && Number.isNaN(Date.parse(endsAt)))) {
    throw new Error('Revisa los datos de la campaña')
  }
  if (endsAt && new Date(endsAt) <= new Date(startsAt)) throw new Error('La fecha final debe ser posterior al inicio')

  const { createClient } = await import('@/lib/supabase/server')
  const sessionClient = await createClient()
  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user) throw new Error('No autorizado')

  const db = createAdminClient() as any
  const { error } = await db.from('admin_discount_campaigns').insert({
    title,
    code,
    membership,
    discount_percent: Number(discount),
    max_redemptions: maxRedemptions,
    starts_at: new Date(startsAt).toISOString(),
    ends_at: endsAt ? new Date(endsAt).toISOString() : null,
    app_store_offer_reference: appStoreOfferReference,
    created_by: user.id,
  })
  if (error) throw new Error(error.code === '23505' ? 'Ese código ya existe' : 'No se pudo guardar la campaña')
  revalidatePath('/admin/discounts')
}

export async function updateDiscountCampaignStatus(form: FormData) {
  if (!(await checkAdminAccess())) throw new Error('No autorizado')
  const id = formText(form, 'id', 36)
  const status = formText(form, 'status', 16)
  if (!/^[0-9a-f-]{36}$/i.test(id) || !STATUSES.has(status)) throw new Error('Solicitud inválida')
  const db = createAdminClient() as any
  const { error } = await db.from('admin_discount_campaigns').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error('No se pudo actualizar la campaña')
  revalidatePath('/admin/discounts')
}
