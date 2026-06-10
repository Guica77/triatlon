import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Zap } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';

export const metadata = {
  title: 'Términos de Servicio - Triatlon Pro',
  description: 'Términos y condiciones de uso de la plataforma de triatlón de alto rendimiento Triatlon Pro.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-zinc-300 pb-24 font-sans selection:bg-cyan-500/30 selection:text-white">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 max-w-6xl mx-auto flex justify-between items-center w-full">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <Zap className="w-4 h-4 text-cyan-400 stroke-[3]" />
          </div>
          <span className="font-bold text-zinc-100 tracking-wider text-sm uppercase">Triatlon Pro</span>
        </Link>

        <Link href="/">
          <AnimatedButton variant="ghost" className="border border-zinc-800 flex items-center gap-2 px-4 py-2 text-xs shadow-sm bg-zinc-900/50 hover:bg-zinc-800">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Inicio</span>
          </AnimatedButton>
        </Link>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 pt-12 space-y-10 relative">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5" /> Aspectos Legales
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
            Términos de Servicio
          </h1>
          <p className="text-zinc-500 text-xs">
            Última actualización: 26 de mayo de 2026
          </p>
        </div>

        <div className="border-t border-zinc-800/80 my-8" />

        <div className="space-y-8 text-sm leading-relaxed text-zinc-400">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Aceptación de los Términos</h2>
            <p>
              Al acceder y utilizar la plataforma Triatlon Pro (en adelante, &quot;el Servicio&quot;), usted acepta quedar vinculado por estos Términos de Servicio. Si no está de acuerdo con alguno de los términos, no podrá utilizar el Servicio.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Descripción del Servicio</h2>
            <p>
              Triatlon Pro es una plataforma de software como servicio (SaaS) que proporciona planificación de entrenamiento adaptativo, cálculos de zonas de intensidad basados en FTP/ritmos y análisis de rendimiento y telemetría deportiva mediante sincronización opcional con dispositivos de terceros (como Garmin y Strava).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Cuenta de Usuario y Seguridad</h2>
            <p>
              Usted es responsable de mantener la confidencialidad de su contraseña y cuenta de acceso. Será plenamente responsable de todas las actividades que ocurran bajo su cuenta. Nos reservamos el derecho de rescindir cuentas que infrinjan derechos de terceros o incumplan estas normas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Planes y Pagos Simulados (Fase Beta)</h2>
            <p>
              Actualmente, el Servicio opera bajo una fase de prueba y demostración (Beta). Todos los pagos y transacciones de suscripción procesados dentro de la plataforma son **simulaciones con fines demostrativos** y no conllevan ningún cobro monetario real. El acceso al plan PRO se otorga de manera gratuita mediante pasarela ficticia.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Limitación de Responsabilidad Médica</h2>
            <p className="text-zinc-300 font-semibold bg-zinc-900/50 border border-zinc-850 p-4 rounded-2xl leading-relaxed">
              ⚠️ IMPORTANTE: El entrenamiento deportivo de resistencia de alto rendimiento conlleva riesgos físicos. Triatlon Pro proporciona planes adaptativos automáticos basados en algoritmos y telemetría, pero no constituye asesoramiento médico ni sustituye la supervisión de entrenadores humanos certificados o profesionales de la salud. Consulte a su médico antes de iniciar cualquier plan de entrenamiento intensivo.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">6. Modificaciones de los Términos</h2>
            <p>
              Nos reservamos el derecho de modificar o sustituir estos Términos en cualquier momento. La fecha de la última actualización se reflejará al inicio de este documento. Su uso continuado del Servicio constituirá la aceptación de los nuevos términos.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
