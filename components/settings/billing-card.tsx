export function BillingCard({ status }: { status?: string | null }) {
  return <section className="h-full rounded-xl border border-border-default bg-bg-card p-5 space-y-3">
    <h3 className="text-sm font-bold text-text-primary">Acceso y suscripción</h3>
    <p className="text-sm text-text-secondary">Las compras y los cambios de plan aún no están disponibles en esta versión. No se realiza ningún cobro desde esta pantalla.</p>
    <p className="text-xs text-text-muted">Tu cuenta conserva su acceso actual. El estado de prueba {status || 'free'} no acredita una suscripción de pago.</p>
  </section>
}
