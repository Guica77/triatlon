import Link from 'next/link';

export const metadata = { title: 'Privacidad | TriWaveX' };

export default function PublicPrivacyPage() {
  return (
    <main className="min-h-screen bg-bg-app px-5 py-12 text-text-primary">
      <article className="mx-auto max-w-2xl rounded-[28px] border border-border-default bg-surface-card p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-10">
        <p className="text-sm font-semibold text-accent">TriWaveX</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em]">Privacidad</h1>
        <p className="mt-4 leading-relaxed text-text-secondary">Usamos tus datos de cuenta, entrenamiento, salud y comunicaciones únicamente para ofrecer y personalizar las funciones que solicitas. No vendemos datos personales ni utilizamos información de salud para publicidad.</p>
        <div className="mt-8 space-y-7 text-sm leading-relaxed text-text-secondary">
          <section><h2 className="text-lg font-semibold text-text-primary">Datos que utilizamos</h2><p className="mt-2">Identidad y contacto, objetivos deportivos, sesiones, métricas de rendimiento y recuperación, conexiones autorizadas y mensajes intercambiados con tu entrenador.</p></section>
          <section><h2 className="text-lg font-semibold text-text-primary">Tus decisiones</h2><p className="mt-2">Puedes retirar permisos, desconectar proveedores, exportar entrenamientos y solicitar la eliminación de la cuenta desde Perfil. Las suscripciones de Apple se gestionan también desde tu cuenta de App Store.</p></section>
          <section><h2 className="text-lg font-semibold text-text-primary">Salud y seguridad</h2><p className="mt-2">TriWaveX apoya la planificación deportiva, pero no sustituye el diagnóstico ni el consejo de un profesional sanitario.</p></section>
          <section><h2 className="text-lg font-semibold text-text-primary">Contacto</h2><a className="mt-2 inline-block font-semibold text-accent underline underline-offset-4" href="mailto:privacy@triwavex.com">privacy@triwavex.com</a></section>
        </div>
        <Link href="/legal/terminos" className="mt-10 inline-flex min-h-11 items-center font-semibold text-accent">Ver términos de uso →</Link>
      </article>
    </main>
  );
}
