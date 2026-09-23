import { redirect } from 'next/navigation'
import { checkAdminAccess } from '@/app/admin/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { reviewRaceDiscountRequest } from '@/app/(app)/descuento-carrera/actions'

export const dynamic = 'force-dynamic'

export default async function AdminRaceDiscountsPage() {
  if (!(await checkAdminAccess())) redirect('/dashboard')
  const db = createAdminClient() as any
  const { data, error } = await db.from('athlete_race_discount_requests')
    .select('id,athlete_id,race_name,race_date,proof_object_path,status,review_note,created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  const rows = data || []
  const athleteIds = [...new Set(rows.map((row: any) => row.athlete_id))]
  const { data: profiles } = athleteIds.length
    ? await db.from('profiles').select('id,first_name,last_name,email').in('id', athleteIds)
    : { data: [] }
  const byAthlete = new Map((profiles || []).map((profile: any) => [profile.id, profile]))
  const entries = await Promise.all(rows.map(async (row: any) => {
    const { data: signed } = row.status === 'pending' && row.proof_object_path
      ? await db.storage.from('race-registration-proofs').createSignedUrl(row.proof_object_path, 300)
      : { data: null }
    return { ...row, athlete: byAthlete.get(row.athlete_id), proofUrl: signed?.signedUrl || null }
  }))
  const pending = entries.filter((entry: any) => entry.status === 'pending')
  const reviewed = entries.filter((entry: any) => entry.status !== 'pending')

  return <main className="mx-auto min-h-screen max-w-4xl space-y-6 bg-bg-app p-4 text-text-primary sm:p-8">
    <header><a href="/admin" className="text-sm font-medium text-swim">← Admin</a><h1 className="mt-3 text-2xl font-bold">Revisión de descuentos por carrera</h1><p className="mt-1 text-sm text-text-secondary">Las solicitudes usan el comprobante solo para verificar la inscripción. Para aprobar, hace falta un código de oferta único emitido por Apple y confirmar que la oferta es del 25% durante un mes.</p></header>
    {error ? <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700">No se pudo cargar la cola. Comprueba que la migración de descuentos por carrera está aplicada.</p> : null}
    <section className="space-y-3"><h2 className="text-lg font-semibold">Pendientes ({pending.length})</h2>
      {!error && pending.length === 0 ? <p className="rounded-xl border border-border-default bg-bg-card p-5 text-sm text-text-muted">No hay solicitudes pendientes.</p> : null}
      {pending.map((request: any) => <article key={request.id} className="space-y-4 rounded-2xl border border-border-default bg-bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{request.race_name}</h3><p className="mt-1 text-sm text-text-secondary">{request.athlete?.first_name || 'Atleta'} {request.athlete?.last_name || ''} · {request.athlete?.email || request.athlete_id}</p><p className="mt-1 text-xs text-text-muted">{request.race_date ? new Date(`${request.race_date}T12:00:00`).toLocaleDateString('es-ES') : 'Sin fecha indicada'} · recibida {new Date(request.created_at).toLocaleString('es-ES')}</p></div>{request.proofUrl ? <a href={request.proofUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center rounded-lg border border-border-default px-3 text-sm font-semibold text-swim">Abrir comprobante (5 min)</a> : <span className="text-sm text-text-muted">Comprobante no disponible</span>}</div>
        <form action={reviewRaceDiscountRequest} className="space-y-3 border-t border-border-default pt-4">
          <input type="hidden" name="id" value={request.id} />
          <label className="block text-sm font-medium">Código único generado por Apple (solo para aprobar)<input name="appleOfferCode" maxLength={64} pattern="[A-Za-z0-9-]{4,64}" placeholder="Código de oferta emitido en App Store Connect" className="mt-1.5 min-h-11 w-full rounded-lg border border-border-default bg-bg-app px-3 text-sm" /></label>
          <label className="flex items-start gap-2 text-sm text-text-secondary"><input type="checkbox" name="confirmedAppleOffer" className="mt-1" /><span>He comprobado en App Store Connect que el código corresponde al 25% durante un mes para la suscripción de atleta.</span></label>
          <label className="block text-sm font-medium">Nota para el atleta (obligatoria si rechazas)<textarea name="reviewNote" maxLength={500} rows={2} placeholder="Indica qué falta o confirma brevemente la revisión" className="mt-1.5 w-full rounded-lg border border-border-default bg-bg-app px-3 py-2 text-sm" /></label>
          <div className="flex flex-wrap gap-2"><button name="decision" value="approve" className="min-h-10 rounded-lg bg-swim px-4 text-sm font-semibold text-white">Aprobar y entregar código Apple</button><button name="decision" value="reject" className="min-h-10 rounded-lg border border-border-default px-4 text-sm font-semibold text-text-primary">Rechazar y pedir corrección</button></div>
        </form>
      </article>)}
    </section>
    <section className="space-y-3"><h2 className="text-lg font-semibold">Revisadas ({reviewed.length})</h2>{reviewed.map((request: any) => <article key={request.id} className="rounded-2xl border border-border-default bg-bg-card p-4"><p className="font-medium">{request.race_name} · {request.status === 'approved' ? 'Aprobada' : 'Rechazada'}</p><p className="mt-1 text-sm text-text-secondary">{request.athlete?.first_name || 'Atleta'} {request.athlete?.last_name || ''} · {request.review_note || 'Sin nota'}</p></article>)}</section>
  </main>
}
