import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, Zap } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';

export const metadata = {
  title: 'Política de Privacidad - Triatlon Pro',
  description: 'Política de privacidad y tratamiento de datos de la plataforma de triatlón Triatlon Pro.',
};

export default function PrivacyPage() {
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" /> Confidencialidad
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
            Política de Privacidad
          </h1>
          <p className="text-zinc-500 text-xs">
            Última actualización: 26 de mayo de 2026
          </p>
        </div>

        <div className="border-t border-zinc-800/80 my-8" />

        <div className="space-y-8 text-sm leading-relaxed text-zinc-400">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Recopilación de Datos Deportivos y Perfil</h2>
            <p>
              Recopilamos información relacionada con su perfil físico de triatleta (como FTP, ritmos de natación y carrera, peso, edad y umbral cardíaco) y sus objetivos deportivos (fechas de carreras, tiempos objetivos) con el único propósito de calcular y ajustar algoritmos de entrenamiento dinámicos y zonas fisiológicas.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Integración de Telemetría (Garmin y Strava)</h2>
            <p>
              Si opta por conectar su cuenta con Garmin Connect o Strava mediante los protocolos oficiales OAuth 2.0, solicitaremos permisos para leer sus actividades deportivas (tiempo, distancia, potencia, FC, etc.) y/o escribir entrenamientos estructurados en su calendario de dispositivos. Estos datos se procesan automáticamente y nunca se venden ni comparten con anunciantes de terceros.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Seguridad y Almacenamiento</h2>
            <p>
              Toda la información del usuario se almacena de forma segura en las bases de datos de Supabase, encriptada en tránsito y con políticas de seguridad de base de datos a nivel de fila (RLS) estrictas para garantizar que solo usted pueda ver o modificar su historial deportivo, métricas de fatiga y entrenamientos.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Cookies y Análisis de Sesión</h2>
            <p>
              Utilizamos cookies esenciales y tokens de autenticación local para mantener su sesión activa de forma segura. No utilizamos rastreadores invasivos de comportamiento publicitario ni compartimos estadísticas personales de rendimiento con entidades comerciales ajenas a la plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Derechos del Usuario (GDPR / ARCO)</h2>
            <p>
              Como usuario, tiene derecho a acceder, rectificar, limitar el tratamiento o eliminar por completo sus datos de nuestra plataforma. Puede eliminar sus cuentas y todas las métricas de telemetría asociadas directamente desde el panel de ajustes o poniéndose en contacto con soporte técnico.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
