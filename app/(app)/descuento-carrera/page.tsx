import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock3, Percent, ShieldCheck, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { RaceProofForm } from '@/components/discounts/race-proof-form'

export const dynamic = 'force-dynamic'

type RequestRow = {
  id: string
  race_name: string
  race_date: string | null
  status: 'pending' | 'approved' | 'rejected'
  review_note: string | null
  apple_offer_code: string | null
  created_at: string
}

const statusCopy = {
  pending: { label: 'En revisión', Icon: Clock3 },
  approved: { label: 'Aprobado', Icon: CheckCircle2 },
  rejected: { label: 'Necesita corrección', Icon: XCircle },
} as const

export default async function RaceDiscountPage() {
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'athlete') redirect('/settings')

  const { data, error } = await supabase.from('athlete_race_discount_requests')
    .select('id,race_name,race_date,status,review_note,apple_offer_code,created_at')
    .eq('athlete_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)
  const requests = (data || []) as RequestRow[]
  const hasPending = requests.some(request => request.status === 'pending')

  return <div className="min-h-screen bg-bg-app">
    <main className="apple-athlete-content mx-auto max-w-2xl space-y-5 px-4 pb-24 pt-5 sm:px-6">
      <Link href="/settings" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-accent"><ArrowLeft className="h-4 w-4" />Perfil</Link>
      <header className="rounded-3xl border border-border-default bg-surface-card p-5 sm:p-7">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent"><Percent className="h-5 w-5" /></span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-text-primary">Descuento por competir</h1>
        <p className="mt-2 text-sm leading-relaxed text-text-secondary">Si ya estás inscrito en una carrera, envíanos el justificante. Revisaremos la solicitud manualmente; si se aprueba, recibirás aquí un código Apple válido para un mes con un 25% de descuento.</p>
        <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-text-muted"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />El archivo no es público y solo se usa para verificar la inscripción. El equipo autorizado podrá abrirlo mientras revisa tu solicitud.</p>
      </header>

      {!hasPending ? <section className="rounded-2xl border border-border-default bg-surface-card p-5 sm:p-6"><h2 className="mb-4 text-lg font-semibold text-text-primary">Solicitar el 25%</h2><RaceProofForm /></section> : <section className="rounded-2xl border border-border-default bg-surface-card p-5 text-sm text-text-secondary">Ya tienes una solicitud pendiente. Cuando terminemos de revisarla, podrás corregirla o enviar otra si hiciera falta.</section>}

      {error ? <p role="alert" className="rounded-xl bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">No se pudo cargar el historial de solicitudes. Prueba a actualizar la página.</p> : null}
      {requests.length ? <section className="space-y-3"><h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">Tus solicitudes</h2>{requests.map(request => {
        const { label, Icon } = statusCopy[request.status]
        return <article key={request.id} className="rounded-2xl border border-border-default bg-surface-card p-4 sm:p-5">
          <div className="flex items-start gap-3"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><div className="min-w-0 flex-1"><p className="font-semibold text-text-primary">{request.race_name}</p><p className="mt-1 text-sm text-text-secondary">{label}{request.race_date ? ` · ${new Date(`${request.race_date}T12:00:00`).toLocaleDateString('es-ES')}` : ''}</p>{request.review_note ? <p className="mt-3 rounded-xl bg-bg-hover p-3 text-sm text-text-secondary">{request.review_note}</p> : null}{request.status === 'approved' && request.apple_offer_code ? <div className="mt-3 rounded-xl bg-accent/10 p-3"><p className="text-sm font-semibold text-text-primary">Tu código de oferta Apple (25% durante un mes)</p><p className="mt-1 break-all font-mono text-lg font-bold tracking-wide text-accent">{request.apple_offer_code}</p><p className="mt-2 text-xs leading-relaxed text-text-secondary">En iPhone, abre Suscripción y elige canjear una oferta de Apple. El código se valida en App Store; se aplican las condiciones y renovación que Apple muestra antes de confirmar.</p><Link href="/settings?section=suscripcion" className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-white">Ir a Suscripción</Link></div> : null}</div></div>
        </article>
      })}</section> : null}
    </main>
  </div>
}
