import { checkAdminAccess } from '@/app/admin/actions'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { configureCoachAppleProduct } from './actions'

export const dynamic = 'force-dynamic'

export default async function AppleProductsPage() {
  if (!(await checkAdminAccess())) redirect('/dashboard')
  const db = createAdminClient() as any
  const { data, error } = await db.rpc('get_native_apple_product_catalog')
  const products = Array.isArray(data) ? data.filter((product: { plan?: string }) => product.plan === 'coach') : []

  return <main className="mx-auto max-w-3xl space-y-6 p-6">
    <div className="space-y-2">
      <a href="/admin" className="text-sm text-swim">← Administración</a>
      <h1 className="text-2xl font-bold">Productos de entrenador · Apple</h1>
      <p className="text-sm text-text-muted">Solo los productos habilitados aquí y devueltos por StoreKit aparecerán como comprables en la app. Antes de habilitar un tramo, créalo y configúralo en App Store Connect.</p>
    </div>

    {error && <p role="alert" className="rounded-lg border border-red-500/30 p-4">No se pudo cargar el catálogo.</p>}
    {!error && products.length === 0 && <p className="rounded-lg border border-border-default p-4">No hay tramos de entrenador habilitados.</p>}
    {products.map((product: { product_id: string; coach_capacity: number }) => <article key={product.product_id} className="rounded-xl border border-border-default bg-bg-card p-4">
      <p className="font-semibold">Hasta {product.coach_capacity} atletas</p>
      <p className="break-all text-sm text-text-muted">{product.product_id}</p>
      <p className="mt-2 text-xs text-text-muted">El precio localizado lo devuelve Apple; esta pantalla no fija precios.</p>
    </article>)}

    <section className="space-y-4 rounded-xl border border-border-default bg-bg-card p-5">
      <h2 className="text-lg font-semibold">Habilitar o pausar un tramo</h2>
      <p className="text-sm text-text-muted">Introduce una capacidad de 15 o más en incrementos de 5 (por ejemplo, 55 o 100). Habilitarla en TriWaveX no crea el producto en Apple: si Apple aún no lo ofrece, no aparecerá en la app.</p>
      <form action={configureCoachAppleProduct} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <label className="grid gap-1 text-sm">Capacidad máxima de atletas
          <input name="capacity" type="number" min="15" step="5" required className="min-h-11 rounded-md border border-border-default bg-bg-app px-3" placeholder="55" />
        </label>
        <button name="enabled" value="true" className="min-h-11 rounded-md bg-swim px-4 font-semibold text-bg-app">Habilitar</button>
        <button name="enabled" value="false" className="min-h-11 rounded-md border border-border-default px-4">Pausar</button>
      </form>
    </section>
  </main>
}
