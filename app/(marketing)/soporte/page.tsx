'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, Send, CheckCircle2, Zap } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/animated-button';
import { ProCard } from '@/components/ui/pro-card';

export default function SupportPage() {
  const [email, setEmail] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simular envío de correo a soporte
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSubmitted(true);
    setLoading(false);
  };

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
      <main className="max-w-xl mx-auto px-6 pt-12 space-y-8 relative">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5" /> Ayuda & Soporte
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Centro de Soporte Técnico
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-md mx-auto">
            ¿Tienes problemas con la sincronización de Garmin/Strava o dudas sobre tu periodización? Escríbenos y un experto te atenderá.
          </p>
        </div>

        <ProCard className="border border-zinc-800/80 bg-[#121214]/65 backdrop-blur-md p-6 sm:p-8 rounded-3xl shadow-xl">
          {submitted ? (
            <div className="text-center py-8 space-y-4 animate-fade-in">
              <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">¡Mensaje Enviado con Éxito!</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                  Hemos registrado tu consulta técnica. Un entrenador de nuestro equipo se pondrá en contacto contigo en el correo <strong className="text-white font-medium">{email}</strong> en menos de 24 horas.
                </p>
              </div>
              <div className="pt-4">
                <AnimatedButton 
                  variant="secondary" 
                  onClick={() => { setSubmitted(false); setSubject(''); setMessage(''); }}
                  className="px-6 py-2.5 text-xs font-semibold"
                >
                  Enviar otro mensaje
                </AnimatedButton>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-medium">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                  className="w-full bg-[#18181b] border border-zinc-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-medium">Asunto / Categoría</label>
                <select 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  className="w-full bg-[#18181b] border border-zinc-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white outline-none transition-colors cursor-pointer"
                >
                  <option value="" disabled className="text-zinc-600 bg-zinc-900">Selecciona un tema...</option>
                  <option value="Garmin/Strava Sync" className="bg-zinc-900">Sincronización Garmin / Strava</option>
                  <option value="Training Plan" className="bg-zinc-900">Modificación de Zonas o Planes</option>
                  <option value="Subscription/Billing" className="bg-zinc-900">Suscripción y Cuenta Pro</option>
                  <option value="Other" className="bg-zinc-900">Otro problema técnico</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-zinc-400 font-medium">Descripción del problema</label>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe detalladamente qué sucede o cuál es tu consulta..."
                  rows={4}
                  required
                  className="w-full bg-[#18181b] border border-zinc-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white outline-none transition-colors resize-none"
                />
              </div>

              <div className="pt-2">
                <AnimatedButton 
                  variant="primary" 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3.5 text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/10 cursor-pointer"
                >
                  {loading ? 'Enviando...' : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Enviar Consulta Técnica
                    </>
                  )}
                </AnimatedButton>
              </div>
            </form>
          )}
        </ProCard>

        {/* Contact direct info */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-cyan-500" />
            <span>Email directo: support@triatlonpro.com</span>
          </div>
        </div>
      </main>
    </div>
  );
}
