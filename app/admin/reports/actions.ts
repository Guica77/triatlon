'use server'
import { checkAdminAccess } from '@/app/admin/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function reviewReport(form: FormData) {
  if (!(await checkAdminAccess())) throw new Error('No autorizado')
  const id = form.get('id')
  const action = form.get('action')
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id) || !['review','remove'].includes(String(action))) throw new Error('Solicitud inválida')
  const db = createAdminClient() as any
  const { data: report, error } = await db.from('chat_reports').select('message_id,message_kind').eq('id',id).single()
  if (error || !report) throw new Error('No se pudo consultar la denuncia')
  if (action === 'remove') {
    const result = await db.from(report.message_kind === 'direct' ? 'chat_messages' : 'group_messages').delete().eq('id',report.message_id)
    if (result.error) throw new Error('No se pudo retirar el mensaje')
  }
  const result = await db.from('chat_reports').update({status:'reviewed'}).eq('id',id)
  if (result.error) throw new Error('No se pudo guardar la revisión')
  revalidatePath('/admin/reports')
}
