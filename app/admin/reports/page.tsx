import { checkAdminAccess } from '@/app/admin/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { reviewReport } from './actions'
import { redirect } from 'next/navigation'

export default async function ReportsPage() {
  if (!(await checkAdminAccess())) redirect('/dashboard')
  const { data, error } = await (createAdminClient() as any).from('chat_reports').select('id, message_id, message_kind, reason, status, created_at').order('created_at',{ascending:false}).limit(100)
  const reports = await Promise.all((data || []).map(async (report:any) => {
    const { data: message } = await (createAdminClient() as any).from(report.message_kind === 'direct' ? 'chat_messages' : 'group_messages').select('message').eq('id',report.message_id).maybeSingle()
    return { ...report, text: message?.message || 'Mensaje retirado o no disponible' }
  }))
  return <main className="mx-auto max-w-3xl p-6 space-y-5">
    <h1 className="text-2xl font-bold">Denuncias del chat</h1>
    <p>Revisa los avisos y toma las medidas necesarias mediante el procedimiento de moderación. No se envían notificaciones externas automáticamente.</p>
    {error && <p role="alert">No se pudo cargar la cola de denuncias.</p>}
    {!error && !data?.length && <p>No hay denuncias registradas.</p>}
    {reports.map((report:any)=><article key={report.id} className="rounded-xl border p-4 space-y-2"><p><strong>Motivo:</strong> {report.reason}</p><blockquote className="border-l-2 pl-3 whitespace-pre-wrap">{report.text}</blockquote><p className="text-sm">{report.status} · {report.created_at} · {report.message_kind}</p><p className="text-xs">Referencia: {report.id}</p>{report.status === "open" && <form action={reviewReport} className="flex gap-4"><input type="hidden" name="id" value={report.id}/><button name="action" value="review" className="underline">Marcar revisada</button><button name="action" value="remove" className="underline">Retirar mensaje y cerrar</button></form>}</article>)}
  </main>
}
