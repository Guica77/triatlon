'use server'

import { checkAdminAccess } from '@/app/admin/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function configureCoachAppleProduct(form: FormData) {
  if (!(await checkAdminAccess())) throw new Error('No autorizado')

  const rawCapacity = form.get('capacity')
  const enabled = form.get('enabled') === 'true'
  if (typeof rawCapacity !== 'string' || !/^\d{2,10}$/.test(rawCapacity)) {
    throw new Error('La capacidad no es válida.')
  }
  const capacity = Number(rawCapacity)
  if (!Number.isSafeInteger(capacity) || capacity < 15 || capacity > 2_147_483_647 || (capacity - 10) % 5 !== 0) {
    throw new Error('Usa un tramo de 15 atletas en adelante, en bloques de 5.')
  }

  const db = createAdminClient() as any
  const { error } = await db.rpc('configure_native_apple_coach_product', {
    p_capacity: capacity,
    p_enabled: enabled,
  })
  if (error) throw new Error('No se pudo actualizar el catálogo de Apple.')
  revalidatePath('/admin/apple-products')
}
