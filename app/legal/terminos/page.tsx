import Link from 'next/link';

export const metadata = { title: 'Términos de uso | TriWaveX' };

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-bg-app px-5 py-12 text-text-primary">
      <article className="mx-auto max-w-2xl rounded-[28px] border border-border-default bg-surface-card p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-10">
        <p className="text-sm font-semibold text-accent">TriWaveX</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em]">Términos de uso</h1>
        <p className="mt-4 leading-relaxed text-text-secondary">Al utilizar TriWaveX aceptas estos términos y las condiciones de la plataforma desde la que hayas contratado la suscripción.</p>
        <div className="mt-8 space-y-7 text-sm leading-relaxed text-text-secondary">
          <section><h2 className="text-lg font-semibold text-text-primary">Servicio</h2><p className="mt-2">TriWaveX ofrece herramientas de planificación, seguimiento y comunicación deportiva para atletas y entrenadores. Las recomendaciones son orientativas y no constituyen atención médica.</p></section>
          <section><h2 className="text-lg font-semibold text-text-primary">Suscripciones</h2><p className="mt-2">Las suscripciones son mensuales y se renuevan automáticamente hasta su cancelación. El precio, los impuestos y cualquier prueba disponible se muestran antes de confirmar. Las compras en iPhone se gestionan mediante tu Apple ID; las compras web, mediante Stripe.</p></section>
          <section><h2 className="text-lg font-semibold text-text-primary">Cancelación</h2><p className="mt-2">Puedes cancelar desde App Store o desde el portal de suscripción web, según el canal de compra. Mantendrás el acceso durante el periodo ya pagado salvo reembolso o revocación aplicable.</p></section>
          <section><h2 className="text-lg font-semibold text-text-primary">Uso responsable</h2><p className="mt-2">Debes proporcionar información veraz, proteger tus credenciales y utilizar la comunicación con otros usuarios de forma respetuosa y legal.</p></section>
          <section><h2 className="text-lg font-semibold text-text-primary">Contacto</h2><a className="mt-2 inline-block font-semibold text-accent underline underline-offset-4" href="mailto:support@triwavex.com">support@triwavex.com</a></section>
        </div>
        <Link href="/legal/privacidad" className="mt-10 inline-flex min-h-11 items-center font-semibold text-accent">Ver privacidad →</Link>
      </article>
    </main>
  );
}
