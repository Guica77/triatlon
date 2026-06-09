'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';

export function PricingCards() {
  const router = useRouter();

  return (
    <section className="py-20 px-4 sm:px-8 max-w-6xl mx-auto space-y-12">
      <div className="text-center max-w-xl mx-auto space-y-4">
        <h2 className="text-2xl sm:text-4xl font-extrabold">Planes sencillos, sin sorpresas</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Consigue la periodización perfecta. Empieza gratis hoy mismo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {/* Free Plan */}
        <ProCard className="bg-zinc-950/40 border-zinc-800/80 p-8 flex flex-col justify-between space-y-8">
          <div className="space-y-4">
            <span className="text-xs text-zinc-500 uppercase tracking-widest font-extrabold block">Básico</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-white">0€</span>
              <span className="text-xs text-zinc-500">/ mes</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Adecuado para triatletas principiantes que quieren registrar sus sesiones y ver su volumen semanal.
            </p>
            <ul className="space-y-2.5 text-xs text-zinc-300 pt-4">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>1 semana de entrenamientos planificados</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Cálculo básico de Zonas Fisiológicas</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Sincronización manual de actividades</span>
              </li>
            </ul>
          </div>

          <AnimatedButton 
            variant="ghost" 
            onClick={() => router.push('/login?mode=signup')}
            className="w-full py-3 text-xs"
          >
            Comenzar Plan Free
          </AnimatedButton>
        </ProCard>

        {/* Pro Plan */}
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-2xl blur opacity-30" />
          <ProCard className="relative bg-zinc-950 p-8 border-zinc-800/80 h-full flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-emerald-400 uppercase tracking-widest font-extrabold block">Recomendado</span>
                <span className="text-[10px] bg-gradient-to-r from-cyan-400 to-emerald-400 text-black px-2 py-0.5 rounded font-black">PRO</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">5€</span>
                <span className="text-xs text-zinc-500">/ mes</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Para triatletas comprometidos que buscan optimizar su rendimiento, controlar su fatiga y descargar structured workouts.
              </p>
              <ul className="space-y-2.5 text-xs text-zinc-300 pt-4">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-white">Planificación de semanas ilimitadas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Zonas fisiológicas dinámicas y adaptadas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Métricas avanzadas PMC (CTL, ATL, TSB)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Conexión y webhooks automáticos (Strava/Garmin)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Exportación estructurada de TCX ilimitada</span>
                </li>
              </ul>
            </div>

            <AnimatedButton 
              variant="primary"
              onClick={() => router.push('/login?mode=signup&plan=pro')}
              className="w-full py-3 text-xs"
            >
              Suscribirme a Pro Now
            </AnimatedButton>
          </ProCard>
        </div>

        {/* Coach Plan */}
        <div className="relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-30" />
          <ProCard className="relative bg-zinc-950 p-8 border-zinc-800/80 h-full flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-cyan-400 uppercase tracking-widest font-extrabold block">B2B Coach</span>
                <span className="text-[10px] bg-gradient-to-r from-emerald-400 to-cyan-400 text-black px-2 py-0.5 rounded font-black">COACH</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">19€</span>
                <span className="text-xs text-zinc-500">/ mes</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Para entrenadores y clubes de triatlón, ciclismo o running que gestionan múltiples atletas con dashboard y chat centralizado.
              </p>
              <ul className="space-y-2.5 text-xs text-zinc-300 pt-4">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="font-semibold text-white">Atletas ilimitados (sin coste por atleta)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Panel de roster para 20-30+ atletas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Alertas automáticas de biometría (HRV, fatiga, TSS)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Mensajería chat directo Coach-Atleta</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Soporte prioritario y analíticas avanzadas</span>
                </li>
              </ul>
            </div>

            <AnimatedButton 
              variant="primary"
              onClick={() => router.push('/login?mode=signup&plan=coach')}
              className="w-full py-3 text-xs !bg-cyan-500 hover:!bg-cyan-400 !text-black shadow-cyan-500/10 shadow-lg"
            >
              Suscribirme a Plan Entrenador
            </AnimatedButton>
          </ProCard>
        </div>
      </div>
    </section>
  );
}
