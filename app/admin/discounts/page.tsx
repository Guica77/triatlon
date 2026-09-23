import Link from 'next/link'
import { redirect } from 'next/navigation'
import { TicketPercent, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkAdminAccess } from '@/app/admin/actions'
import { createBaseDiscountCampaigns, createDiscountCampaign, updateDiscountCampaignOfferReference, updateDiscountCampaignStatus } from './actions'

export const dynamic = 'force-dynamic'

const coachCapacities = [10, 15, 20, 25, 30, 35, 40, 45, 50]
type Campaign = {
  id: string; title: string; code: string; membership: 'athlete' | 'coach'; product_identifier: string
  discount_percent: number; max_redemptions: number; redemption_count: number; starts_at: string
  ends_at: string | null; status: 'draft' | 'active' | 'paused' | 'expired'; app_store_offer_reference: string | null
}
const inputClass = 'w-full rounded-lg border border-border-default bg-bg-app px-3 py-2 text-sm text-text-primary outline-none focus:border-swim'

function productLabel(product: string) {
  if (product === 'com.triwavex.athlete.monthly') return 'Atleta · 5,99 €/mes'
  const tier = product === 'com.triwavex.coach.monthly' ? 10 : Number(product.split('.').at(-1))
  return `Entrenador · ${tier} plazas`
}

export default async function AdminDiscountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!(await checkAdminAccess())) redirect('/dashboard')

  const db = createAdminClient() as any
  const { data } = await db.from('admin_discount_campaigns')
    .select('id,title,code,membership,product_identifier,discount_percent,max_redemptions,redemption_count,starts_at,ends_at,status,app_store_offer_reference')
    .order('created_at', { ascending: false })
  const campaigns = (data || []) as Campaign[]
  const now = new Date()

  return <div className="min-h-screen bg-bg-app text-text-primary">
    <header className="border-b border-border-default bg-bg-elevated">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-swim text-white"><TicketPercent className="h-5 w-5" /></span><div><p className="text-sm font-bold">Descuentos TriWaveX</p><p className="text-xs text-text-muted">Panel privado · datos en vivo</p></div></div>
        <Link href="/admin" className="text-sm font-semibold text-swim">Volver al panel</Link>
      </div>
    </header>
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4">
        <div className="rounded-2xl border border-border-default bg-bg-card p-5">
          <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-bike" /><div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">Campañas privadas</h1>
            <p className="mt-1 text-sm text-text-muted">Estas referencias internas no son códigos Apple ni cambian el precio del iPhone. Crea cada oferta en App Store Connect y el cliente la canjea en la hoja segura de Apple.</p>
            <p className="mt-2 rounded-lg bg-bg-hover p-3 text-sm text-text-secondary"><strong>El 100%</strong> es un periodo gratis limitado, no una suscripción gratis para siempre. Apple muestra la duración y renovación antes de confirmar.</p>
            <form action={createBaseDiscountCampaigns} className="mt-4"><button className="rounded-lg border border-border-default px-3 py-2 text-sm font-bold text-text-primary">Preparar 30 campañas · 10 productos × 3 descuentos</button></form>
          </div></div>
        </div>
        {campaigns.length === 0 ? <div className="rounded-2xl border border-dashed border-border-default p-8 text-center text-sm text-text-muted">Prepara las campañas por producto y después vincula cada una a su oferta Apple.</div> : campaigns.map((campaign) => {
          const expired = campaign.ends_at && new Date(campaign.ends_at) < now
          return <article key={campaign.id} className="rounded-2xl border border-border-default bg-bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold">{campaign.title}</p><p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">Referencia interna · no canjeable</p><p className="font-mono text-sm text-swim">{campaign.code}</p><p className="mt-1 font-mono text-[11px] text-text-muted">{campaign.product_identifier} · {productLabel(campaign.product_identifier)}</p></div><span className="rounded-full bg-bg-hover px-3 py-1 text-xs font-bold">{expired ? 'caducada' : campaign.status}</span></div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4"><div><dt className="text-text-muted">Plan</dt><dd className="font-semibold">{campaign.membership === 'athlete' ? 'Atleta' : 'Entrenador'}</dd></div><div><dt className="text-text-muted">Oferta</dt><dd className="font-semibold">{campaign.discount_percent === 100 ? 'Gratis por periodo limitado' : `${campaign.discount_percent}%`}</dd></div><div><dt className="text-text-muted">Usos internos</dt><dd className="font-semibold">{campaign.redemption_count} / {campaign.max_redemptions}</dd></div><div><dt className="text-text-muted">Referencia ASC</dt><dd className="font-semibold">{campaign.app_store_offer_reference || 'Pendiente'}</dd></div></dl>
            <form action={updateDiscountCampaignOfferReference} className="mt-4 flex gap-2"><input type="hidden" name="id" value={campaign.id} /><input name="appStoreOfferReference" defaultValue={campaign.app_store_offer_reference ?? ''} maxLength={120} placeholder="Referencia de App Store Connect" aria-label="Referencia de oferta en App Store Connect" className={inputClass} /><button className="rounded-lg border border-border-default px-3 py-2 text-sm font-bold text-text-primary">Guardar referencia</button></form>
            <p className="mt-1 text-xs text-text-muted">La referencia es informativa, no comprueba Apple. El estado solo describe este panel.</p>
            <form action={updateDiscountCampaignStatus} className="mt-3 flex gap-2"><input type="hidden" name="id" value={campaign.id} /><select name="status" defaultValue={campaign.status} className={inputClass}><option value="draft">Borrador</option><option value="active">Activa (solo panel)</option><option value="paused">Pausada</option><option value="expired">Caducada</option></select><button className="rounded-lg bg-text-primary px-4 py-2 text-sm font-bold text-bg-app">Guardar estado</button></form>
          </article>
        })}
      </section>
      <aside className="h-fit rounded-2xl border border-border-default bg-bg-card p-5"><h2 className="text-lg font-bold">Nueva campaña</h2>
        <form action={createDiscountCampaign} className="mt-4 space-y-3">
          <input required name="title" placeholder="Nombre interno" className={inputClass} />
          <label className="block text-xs font-semibold">Referencia interna (no es un código Apple)<input required name="code" pattern="[A-Za-z0-9-]{4,32}" placeholder="Ej.: CLUB50" className={`${inputClass} mt-1`} /></label>
          <select name="membership" className={inputClass}><option value="athlete">Atleta</option><option value="coach">Entrenador</option></select>
          <label className="block text-xs font-semibold">Producto Apple<select name="productIdentifier" className={`${inputClass} mt-1`}><option value="com.triwavex.athlete.monthly">{productLabel('com.triwavex.athlete.monthly')}</option>{coachCapacities.map((capacity) => { const id = capacity === 10 ? 'com.triwavex.coach.monthly' : `com.triwavex.coach.monthly.${capacity}`; return <option key={id} value={id}>{productLabel(id)}</option> })}</select></label>
          <select name="discount" className={inputClass}><option value="25">25%</option><option value="50">50%</option><option value="100">100%</option></select>
          <input required name="maxRedemptions" type="number" min="1" max="100000" defaultValue="1" className={inputClass} />
          <label className="block text-xs font-semibold">Inicio<input required name="startsAt" type="datetime-local" defaultValue={new Date().toISOString().slice(0, 16)} className={`${inputClass} mt-1`} /></label>
          <label className="block text-xs font-semibold">Fin (opcional)<input name="endsAt" type="datetime-local" className={`${inputClass} mt-1`} /></label>
          <label className="block text-xs font-semibold">Nombre/referencia de oferta en App Store Connect<input name="appStoreOfferReference" placeholder="Pendiente de crear en Apple" className={`${inputClass} mt-1`} /></label>
          <button className="w-full rounded-lg bg-swim px-4 py-3 text-sm font-bold text-white">Crear campaña</button>
        </form>
      </aside>
    </main>
  </div>
}
