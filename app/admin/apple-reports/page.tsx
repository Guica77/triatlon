import { checkAdminAccess } from '@/app/admin/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { reconcileAppleReportCohort } from './actions'

export const dynamic = 'force-dynamic'

type PendingCohort = {
  entry_type: 'sale' | 'return'
  transaction_date: string
  product_id: string
  storefront: string
  customer_currency: string
  customer_price_milli: number
  units: number
  transaction_ids: string[]
}

export default async function AppleReportsPage() {
  if (!(await checkAdminAccess())) redirect('/dashboard')
  const db = createAdminClient() as any
  const { data, error } = await db.rpc('get_pending_apple_report_cohorts')
  const cohorts = Array.isArray(data) ? data as PendingCohort[] : []

  return <main className="mx-auto max-w-4xl space-y-6 p-6">
    <div className="space-y-2">
      <a href="/admin" className="text-sm text-swim">← Administración</a>
      <h1 className="text-2xl font-bold">Conciliar informes financieros de Apple</h1>
      <p className="text-sm text-text-muted">Apple paga a TriWaveX. Esta revisión registra solo el neto de un informe finalizado y reparte la mitad del neto conciliado entre los entrenadores atribuidos al comienzo de cada periodo.</p>
    </div>

    <div role="note" className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
      <p className="font-semibold">Revisión manual estricta</p>
      <p>Conciliar únicamente cuando el informe final de Apple confirma la misma fecha de transacción, producto, territorio, moneda del cliente, precio y número de unidades que el grupo. Si el informe no expone esas dimensiones o no coincide exactamente, no lo concilies: ese importe debe permanecer pendiente. El fichero se usa solo en esta solicitud para calcular y guardar su SHA-256 de auditoría; no se conserva ni se sube a Apple.</p>
      <p>Las devoluciones y reembolsos se registran como ajustes negativos independientes, asociados a los eventos de Apple y al entrenador atribuido al periodo original. Solo continúa si la fila final de Apple coincide exactamente y está marcada como devolución; si no, déjala pendiente.</p>
    </div>

    {error && <p role="alert" className="rounded-lg border border-red-500/30 p-4">No se pudieron cargar los grupos pendientes. Comprueba que la migración esté instalada.</p>}
    {!error && cohorts.length === 0 && <p className="rounded-xl border border-border-default p-5">No hay grupos de ventas que puedan compararse con el informe todavía. Los periodos sin territorio, moneda o precio verificable no se asignan automáticamente.</p>}

    {cohorts.map(cohort => <article key={`${cohort.entry_type}:${cohort.transaction_date}:${cohort.product_id}:${cohort.storefront}:${cohort.customer_currency}:${cohort.customer_price_milli}`} className="space-y-4 rounded-xl border border-border-default bg-bg-card p-5">
      <div>
        <h2 className="font-semibold">{cohort.entry_type === 'return' ? 'Devolución' : 'Venta'} · {cohort.transaction_date} · {cohort.storefront} · {cohort.units} unidad{cohort.units === 1 ? '' : 'es'}</h2>
        <p className="break-all text-xs text-text-muted">{cohort.product_id}</p>
        <p className="text-sm text-text-muted">Precio cliente: {cohort.customer_price_milli / 1000} {cohort.customer_currency} · No es el neto de Apple.</p>
      </div>
      <form action={reconcileAppleReportCohort} className="grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="entryType" value={cohort.entry_type} />
        <input type="hidden" name="transactionDate" value={cohort.transaction_date} />
        <input type="hidden" name="productID" value={cohort.product_id} />
        <input type="hidden" name="storefront" value={cohort.storefront} />
        <input type="hidden" name="customerCurrency" value={cohort.customer_currency} />
        <input type="hidden" name="customerPriceMilli" value={cohort.customer_price_milli} />
        <input type="hidden" name="reportUnits" value={cohort.units} />
        <input type="hidden" name="transactionIDs" value={JSON.stringify(cohort.transaction_ids)} />
        <label className="grid gap-1 text-sm">Referencia del informe final
          <input name="reportReference" required maxLength={200} className="min-h-11 rounded-md border border-border-default bg-bg-app px-3" placeholder="Nombre de fichero / referencia Apple" />
        </label>
        <label className="grid gap-1 text-sm">Periodo fiscal Apple (AAAA-MM)
          <input name="fiscalPeriod" required pattern="\d{4}-\d{2}" className="min-h-11 rounded-md border border-border-default bg-bg-app px-3" placeholder="2026-09" />
        </label>
        <label className="grid gap-1 text-sm">Moneda del neto Apple
          <input name="proceedsCurrency" required minLength={3} maxLength={3} pattern="[A-Z]{3}" className="min-h-11 rounded-md border border-border-default bg-bg-app px-3" placeholder="EUR" />
        </label>
        <label className="grid gap-1 text-sm">{cohort.entry_type === 'return' ? 'Neto devuelto Apple (negativo)' : 'Neto final del grupo (no el precio cliente)'}
          <input name="finalizedProceeds" required inputMode="decimal" pattern={cohort.entry_type === 'return' ? "-\\d{1,16}(\\.\\d{1,4})?" : "\\d{1,16}(\\.\\d{1,4})?"} className="min-h-11 rounded-md border border-border-default bg-bg-app px-3" placeholder={cohort.entry_type === 'return' ? '-7.42' : '7.42'} />
        </label>
        <label className="grid gap-1 text-sm sm:col-span-2">Fichero final de Apple (máx. 4 MB)
          <input name="reportFile" type="file" accept=".txt,.csv,.tsv" required className="min-h-11 rounded-md border border-border-default bg-bg-app px-3 py-2" />
        </label>
        <button className="min-h-11 rounded-md bg-swim px-4 font-semibold text-bg-app sm:col-span-2">Registrar grupo conciliado</button>
      </form>
    </article>)}
  </main>
}
