import Link from 'next/link';

export function BillingCard({ status }: { status?: string | null }) {
  const statusLabel = status === 'coach' ? 'Entrenador' : status === 'trial' ? 'Prueba' : status === 'active' ? 'Activa' : 'Sin suscripción activa';

  return <section className="h-full rounded-2xl border border-border-default bg-surface-card p-5 shadow-sm">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Acceso y suscripción</h3>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">Estado actual: <span className="font-medium text-text-primary">{statusLabel}</span></p>
      </div>
      <span className="shrink-0 rounded-full bg-surface-hover px-2.5 py-1 text-xs font-semibold text-text-secondary">Gestionar</span>
    </div>
    <p className="mt-4 text-sm leading-relaxed text-text-secondary">La gestión de acceso tiene su propia pantalla: no reinicia tu objetivo ni repite el onboarding.</p>
    <Link href="/settings?section=suscripcion" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-semibold text-white transition-transform duration-100 hover:brightness-95 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
      Ver opciones de plan
    </Link>
  </section>
}
