'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ChevronRight, Play, TrendingUp } from 'lucide-react';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';

export function HeroSection() {
  const router = useRouter();

  return (
    <section className="relative pt-12 pb-20 px-4 sm:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs text-cyan-400 font-semibold shadow-inner">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Nueva versión: Motor Fisiológico v2.5</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-zinc-100">
          Plataforma Europea para Coaches de{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-emerald-400 to-sky-400">
            Triatlón, Ciclismo y Running.
          </span>
        </h1>

        <p className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
          La alternativa en euros y español a TrainingPeaks. Gestiona de 20 a 100+ atletas con alertas biométricas avanzadas (HRV/TSS), asignación de planes instantánea y chat directo desde una tarifa plana de 19€/mes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
          <AnimatedButton 
            variant="primary"
            onClick={() => router.push('/login?mode=signup')}
            className="w-full sm:w-auto px-8 py-4 text-sm font-bold shadow-[0_0_30px_rgba(34,211,238,0.2)]"
          >
            Empezar mi Plan Gratis <ChevronRight className="w-4 h-4 ml-1.5" />
          </AnimatedButton>
          <button 
            onClick={() => router.push('/login?mode=demo')}
            className="w-full sm:w-auto px-8 py-4 rounded-xl border border-zinc-800 bg-zinc-900/20 hover:bg-zinc-900/50 hover:border-zinc-700 text-sm font-semibold transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
            Ver Demostración
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6 pt-6 border-t border-zinc-900 text-center lg:text-left">
          <div>
            <p className="text-2xl sm:text-3xl font-black text-white">100%</p>
            <p className="text-xs text-zinc-500">Adaptativo</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-white">Garmin</p>
            <p className="text-xs text-zinc-500">y Strava Bridge</p>
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-black text-white">TCX</p>
            <p className="text-xs text-zinc-500">Exportación directa</p>
          </div>
        </div>
      </div>

      {/* Hero Interactive Widget (PMC Simulation) */}
      <div className="lg:col-span-5 relative w-full flex justify-center">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-2xl blur-lg opacity-25" />
        <ProCard className="relative w-full max-w-md p-6 bg-zinc-950/60 backdrop-blur-md border-zinc-800/80 space-y-6">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Analítica PMC de Rendimiento</span>
            </div>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full font-bold">LIVE SYNC</span>
          </div>

          {/* Simulated graph using beautiful SVGs */}
          <div className="h-44 w-full bg-zinc-950/80 rounded-xl relative overflow-hidden p-2 border border-zinc-900 flex flex-col justify-between">
            <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-full w-px bg-zinc-900/60" />
              ))}
            </div>
            
            {/* SVG Charts paths */}
            <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Glow shadows */}
              <defs>
                <linearGradient id="cyan-glow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Fill CTL area */}
              <path d="M 0 80 Q 20 60 40 45 T 80 30 T 100 25 L 100 100 L 0 100 Z" fill="url(#cyan-glow)" />

              {/* CTL line */}
              <path d="M 0 80 Q 20 60 40 45 T 80 30 T 100 25" fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />
              
              {/* ATL line (Fatigue) */}
              <path d="M 0 85 Q 15 50 30 75 T 60 20 T 100 15" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
              
              {/* TSB line (Stress Balance) */}
              <path d="M 0 50 Q 25 35 50 65 T 75 40 T 100 55" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" />
            </svg>

            <div className="flex justify-between items-center text-[9px] text-zinc-500 z-10">
              <span>01 May</span>
              <span>15 May</span>
              <span>26 May</span>
            </div>
          </div>

          {/* Metricas */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-zinc-900/50 p-2.5 rounded-lg text-center border border-zinc-900">
              <span className="text-[10px] text-zinc-500 block uppercase font-medium">CTL (Carga)</span>
              <span className="text-sm font-extrabold text-cyan-400">72</span>
              <span className="text-[9px] text-zinc-400 block mt-0.5">Óptimo</span>
            </div>
            <div className="bg-zinc-900/50 p-2.5 rounded-lg text-center border border-zinc-900">
              <span className="text-[10px] text-zinc-500 block uppercase font-medium">ATL (Fatiga)</span>
              <span className="text-sm font-extrabold text-rose-500">89</span>
              <span className="text-[9px] text-zinc-400 block mt-0.5">Elevada</span>
            </div>
            <div className="bg-zinc-900/50 p-2.5 rounded-lg text-center border border-zinc-900">
              <span className="text-[10px] text-zinc-500 block uppercase font-medium">TSB (Balance)</span>
              <span className="text-sm font-extrabold text-emerald-400">-17</span>
              <span className="text-[9px] text-zinc-400 block mt-0.5">Transición</span>
            </div>
          </div>

          <div className="bg-zinc-900/30 p-3 rounded-xl border border-zinc-900 text-xs text-zinc-400 leading-relaxed text-center">
            💡 <strong className="text-white">Estado recomendado:</strong> Estás en zona de supercompensación. Ideal para meter series cortas hoy.
          </div>
        </ProCard>
      </div>
    </section>
  );
}
