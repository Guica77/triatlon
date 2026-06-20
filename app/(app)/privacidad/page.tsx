'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Lock, FileText, CheckCircle2 } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-zinc-50/50 pb-16">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-sm transition-all duration-300">
        <div className="px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <AnimatedButton variant="ghost" size="icon" className="w-9 h-9 text-zinc-450 hover:text-cyan-500 hover:bg-cyan-50 rounded-xl transition-all duration-200 border border-transparent hover:border-cyan-100">
                <ArrowLeft className="w-4 h-4" />
              </AnimatedButton>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-500 shadow-sm shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base font-bold text-zinc-850 tracking-tight">Política de Privacidad</h1>
                <p className="text-[10px] text-zinc-500 font-medium">Tratamiento de tus datos y telemetría</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 pt-8">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100 }}
          className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 shadow-xs space-y-6 text-zinc-700"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-150">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-500 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 uppercase tracking-wider">Tu Privacidad es Primero</h2>
              <p className="text-xs text-zinc-500">Última actualización: Junio de 2026</p>
            </div>
          </div>

          <div className="space-y-4 text-xs leading-relaxed">
            <p>
              En <strong>Triatlón Pro</strong> nos tomamos muy en serio la seguridad y el tratamiento de tus datos personales y deportivos. Esta política detalla cómo recopilamos, utilizamos y protegemos tu información.
            </p>

            <h3 className="text-sm font-bold text-zinc-900 pt-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 1. Datos que Recopilamos
            </h3>
            <p>
              Para poder estructurar y optimizar tus planes de entrenamiento de forma personalizada, procesamos la siguiente información:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-650">
              <li><strong>Datos de Perfil:</strong> Nombre, dirección de correo electrónico, nivel de experiencia y marcas objetivo de carreras.</li>
              <li><strong>Datos Fisiológicos:</strong> Zonas de frecuencia cardíaca, FTP de ciclismo, ritmos de natación y carrera a pie.</li>
              <li><strong>Datos de Telemetría:</strong> Sincronización a través de Strava o Garmin para analizar el volumen, intensidad e ingesta de entrenamientos completados.</li>
              <li><strong>Preferencias Nutricionales:</strong> Preferencias de alimentos e ingredientes, alergias e ingredientes no deseados.</li>
            </ul>

            <h3 className="text-sm font-bold text-zinc-900 pt-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 2. Uso de la Información
            </h3>
            <p>
              Tus datos son de tu exclusiva propiedad. Los usamos únicamente para:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-650">
              <li>Generar planes de entrenamiento periódicos personalizados mediante IA.</li>
              <li>Sincronizar tus relojes deportivos y actualizar el estado de forma y fatiga.</li>
              <li>Enviarte alertas y notificaciones push necesarias (ej. recordatorios de nutrición o mensajes de tu entrenador).</li>
            </ul>

            <h3 className="text-sm font-bold text-zinc-900 pt-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 3. Notificaciones y Ubicación
            </h3>
            <p>
              La app solicita acceso a Notificaciones Push del navegador únicamente para enviarte reportes sobre tus progresos de entrenamiento o mensajes de chat de tu entrenador. En cualquier momento puedes cambiar el estado de este permiso desde los ajustes de tu navegador.
            </p>

            <h3 className="text-sm font-bold text-zinc-900 pt-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 4. Tus Derechos
            </h3>
            <p>
              Puedes revocar en cualquier momento la conexión con plataformas de telemetría de terceros (Strava/Garmin) desde el panel de Ajustes de la aplicación. Si deseas eliminar tu cuenta o exportar tus datos deportivos, puedes contactar con nuestro soporte técnico.
            </p>
          </div>

          <div className="pt-6 border-t border-zinc-150 text-center">
            <Link href="/dashboard">
              <AnimatedButton variant="primary" className="!bg-zinc-900 hover:!bg-zinc-800 text-white font-bold px-6 py-2 rounded-xl text-xs cursor-pointer">
                Volver al Dashboard
              </AnimatedButton>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
