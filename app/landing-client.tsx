'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Activity, Shield, Zap, TrendingUp, Download, Compass, Cpu, Sparkles, Check, ChevronRight, Play } from 'lucide-react';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';

export function LandingClient() {
  const router = useRouter();
  const [selectedSport, setSelectedSport] = React.useState<'ciclismo' | 'carrera' | 'natacion'>('ciclismo');
  const [mockFtp, setMockFtp] = React.useState(180);
  const [numAthletes, setNumAthletes] = React.useState(30);

  // TrainingPeaks charges $99/mo coach subscription + $9/mo per premium athlete
  const tpMonthlyCost = 99 + (numAthletes * 9);
  const triProMonthlyCost = 19; // flat €19
  const monthlySavings = tpMonthlyCost - triProMonthlyCost;
  const annualSavings = monthlySavings * 12;

  // Dynamic preview helper
  const getZoneRange = (sport: typeof selectedSport, ftp: number) => {
    if (sport === 'ciclismo') {
      return {
        Z1: `${Math.round(ftp * 0.3)} - ${Math.round(ftp * 0.55)}W`,
        Z2: `${Math.round(ftp * 0.56)} - ${Math.round(ftp * 0.75)}W`,
        Z3: `${Math.round(ftp * 0.76)} - ${Math.round(ftp * 0.9)}W`,
        Z4: `${Math.round(ftp * 0.91)} - ${Math.round(ftp * 1.05)}W`,
        Z5: `${Math.round(ftp * 1.06)} - ${Math.round(ftp * 1.2)}W`,
      };
    } else if (sport === 'carrera') {
      const pace = 330; // 05:30 in seconds
      return {
        Z1: '06:52 - 07:25 min/km',
        Z2: '06:09 - 06:49 min/km',
        Z3: '05:33 - 06:06 min/km',
        Z4: '05:13 - 05:30 min/km',
        Z5: '04:40 - 05:10 min/km',
      };
    } else {
      return {
        Z1: '02:20 - 02:30 min/100m',
        Z2: '02:10 - 02:19 min/100m',
        Z3: '02:05 - 02:09 min/100m',
        Z4: '02:00 - 02:04 min/100m',
        Z5: '01:50 - 01:59 min/100m',
      };
    }
  };

  const currentZones = getZoneRange(selectedSport, mockFtp);

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 overflow-x-hidden selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-zinc-950/60 border-b border-zinc-900/80 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.3)]">
              <Zap className="w-4 h-4 text-black stroke-[3]" />
            </div>
            <span className="text-lg font-black tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-500 uppercase">
              Triatlon Pro
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/login')} 
              className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Iniciar Sesión
            </button>
            <AnimatedButton 
              variant="primary"
              onClick={() => router.push('/login?mode=signup')}
              className="px-4 py-2 text-xs"
            >
              Comenzar Gratis
            </AnimatedButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
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

      {/* Bento Grid / Features */}
      <section className="bg-zinc-950 py-20 px-4 sm:px-8 border-y border-zinc-900/50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold">Todo lo que necesitas para entrenar a tu grupo</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Herramientas profesionales en español para gestionar la preparación de triatlón, ciclismo y running sin pagar de más.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* feature 1: Fisiología Interactiva */}
            <div className="md:col-span-2 relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-900/10 p-6 flex flex-col justify-between space-y-6">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Calculadora y Motor de Zonas Dinámicas</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Las zonas fisiológicas recalculan instantáneamente la potencia objetivo en ciclismo y el ritmo en natación/carrera. Compara cómo varían tus zonas en tiempo real:
                </p>
              </div>

              {/* Interactive block */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex gap-2">
                    {(['ciclismo', 'carrera', 'natacion'] as const).map(sport => (
                      <button
                        key={sport}
                        onClick={() => setSelectedSport(sport)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                          selectedSport === sport ? 'bg-cyan-500 text-black font-bold' : 'bg-zinc-900 text-zinc-400'
                        }`}
                      >
                        {sport === 'ciclismo' ? '🚴‍♂️ Bici' : sport === 'carrera' ? '🏃‍♂️ Correr' : '🏊‍♂️ Natación'}
                      </button>
                    ))}
                  </div>
                  {selectedSport === 'ciclismo' && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 uppercase font-semibold">Simular FTP:</span>
                      <input 
                        type="range" 
                        min="150" 
                        max="350" 
                        value={mockFtp} 
                        onChange={(e) => setMockFtp(parseInt(e.target.value))}
                        className="w-20 h-1 bg-zinc-800 rounded appearance-none accent-cyan-400 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-white w-8">{mockFtp}W</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-5 gap-1 text-[10px] text-center">
                  {Object.entries(currentZones).map(([zone, range]) => (
                    <div key={zone} className="bg-zinc-900/60 p-2 rounded border border-zinc-800/50">
                      <span className="block font-bold text-cyan-400">{zone}</span>
                      <span className="text-zinc-400 mt-1 block truncate">{range}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* feature 2: Telemetry & Devices */}
            <div className="rounded-2xl border border-zinc-900 bg-zinc-900/10 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Sincronización Directa de Relojes</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Conectamos con Garmin Connect y Strava. Descarga tu entrenamiento estructurado o deja que la IA detecte y asocie las sesiones realizadas en segundos de forma automática.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 flex flex-col items-center">
                  <span className="text-lg">🛰️</span>
                  <span className="font-semibold text-white mt-1">Garmin</span>
                  <span className="text-[9px] text-emerald-400 mt-0.5 font-bold">Auto-Sync</span>
                </div>
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 flex flex-col items-center">
                  <span className="text-lg">🏃‍♂️</span>
                  <span className="font-semibold text-white mt-1">Strava Bridge</span>
                  <span className="text-[9px] text-emerald-400 mt-0.5 font-bold">Conectado</span>
                </div>
              </div>
            </div>

            {/* feature 3: TCX Export */}
            <div className="rounded-2xl border border-zinc-900 bg-zinc-900/10 p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Download className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Exportación TCX de Series</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Exporta archivos `.TCX` con las fases estructuradas e intervalos listos para tu Apple Watch, Garmin o Wahoo. Sigue el ritmo y los vatios exactos con avisos sonoros de tu reloj.
                </p>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 text-[10px] text-zinc-500 font-mono space-y-1">
                <div>&lt;WorkoutStep&gt;</div>
                <div className="pl-3 text-cyan-400">&lt;Duration&gt;300s&lt;/Duration&gt;</div>
                <div className="pl-3 text-emerald-400">&lt;TargetPower&gt;{Math.round(mockFtp * 0.9)}W&lt;/TargetPower&gt;</div>
                <div>&lt;/WorkoutStep&gt;</div>
              </div>
            </div>

            {/* feature 4: Marketplace */}
            <div className="md:col-span-2 relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-900/10 p-6 flex flex-col justify-between space-y-6">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Compass className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white">Marketplace de Material & Wallapop Crawler</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  ¿Te falta un neopreno de gama alta, ruedas de carbono o una cabra de triatlón para tu gran prueba? Nuestro indexador rastrea Wallapop buscando chollos y ofertas técnicas adaptadas a la distancia de tu carrera.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🩱</span>
                    <div>
                      <span className="text-[11px] font-bold text-white block">Neopreno Orca Athlex</span>
                      <span className="text-[9px] text-zinc-500">Talla MT • Perfecto estado</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-400">140€</span>
                </div>
                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⭕</span>
                    <div>
                      <span className="text-[11px] font-bold text-white block">Ruedas Carbono 50mm</span>
                      <span className="text-[9px] text-zinc-500">Perfil Aero • Tubeless ready</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-amber-400">450€</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Competitor Savings Calculator */}
      <section className="py-20 px-4 sm:px-8 max-w-4xl mx-auto space-y-12 border-t border-zinc-900/50">
        <div className="text-center max-w-xl mx-auto space-y-4">
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full font-black uppercase tracking-wider">
            La ventaja del Euro y la tarifa plana
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold">¿Cuánto ahorras frente a TrainingPeaks?</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            TrainingPeaks está diseñado en dólares (USD), cobra por atleta premium y encarece la gestión de tu club. Calcula tu cuota plana con nosotros.
          </p>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-800/80 rounded-3xl p-6 sm:p-10 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-zinc-300 font-sans">Número de atletas en tu roster:</label>
              <span className="text-lg font-black text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-lg">
                {numAthletes} atletas
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              value={numAthletes}
              onChange={(e) => setNumAthletes(parseInt(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none accent-emerald-400 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-zinc-500">
              <span>5 atletas</span>
              <span>50 atletas</span>
              <span>100 atletas</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-zinc-900">
            <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-900 text-center space-y-1">
              <span className="text-xs text-zinc-500 block font-semibold uppercase">TrainingPeaks (USD)</span>
              <span className="text-2xl font-black text-zinc-400">
                ${tpMonthlyCost} <span className="text-xs text-zinc-500">/ mes</span>
              </span>
              <span className="text-[10px] text-zinc-600 block">
                $99 base + $9/atleta premium
              </span>
            </div>
            
            <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/20 text-center space-y-1 relative">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-black bg-emerald-400 text-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Tarifa Plana
              </div>
              <span className="text-xs text-emerald-400 block font-semibold uppercase">Triatlon Pro</span>
              <span className="text-2xl font-black text-white">
                19€ <span className="text-xs text-zinc-400">/ mes</span>
              </span>
              <span className="text-[10px] text-emerald-500 block font-bold">
                Atletas ilimitados • Soporte en Euro
              </span>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 p-5 rounded-2xl border border-cyan-500/20 text-center space-y-1">
              <span className="text-xs text-cyan-400 block font-semibold uppercase">Tu Ahorro Anual</span>
              <span className="text-2xl font-black text-emerald-400">
                ~{Math.round(annualSavings)}€ <span className="text-xs text-emerald-400/70">/ año</span>
              </span>
              <span className="text-[10px] text-zinc-400 block font-medium">
                Cambio de divisa + sin límite
              </span>
            </div>
          </div>

          <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-900/60 text-xs text-zinc-400 leading-relaxed text-center">
            🚀 <strong>Ventaja Europea:</strong> Además del ahorro económico de la tarifa plana, disfrutas de soporte y facturación en euros y plataforma completamente traducida al español para ti y tus atletas.
          </div>
        </div>
      </section>

      {/* Pricing / Plan options */}
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

      {/* Footer */}
      <footer className="bg-zinc-950/60 border-t border-zinc-900/80 py-12 px-4 sm:px-8 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-cyan-400 stroke-[3]" />
            </div>
            <span className="font-bold text-zinc-300">TRIATLON PRO</span>
          </div>
          <p>© {new Date().getFullYear()} Triatlon Pro Inc. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            <Link href="/terminos" className="hover:text-zinc-300">Términos</Link>
            <Link href="/privacidad" className="hover:text-zinc-300">Privacidad</Link>
            <Link href="/soporte" className="hover:text-zinc-300">Soporte</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
