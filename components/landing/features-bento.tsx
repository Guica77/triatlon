'use client';

import * as React from 'react';
import { Activity, Cpu, Download, Compass, Calendar } from 'lucide-react';

export function FeaturesBento() {
  const [selectedSport, setSelectedSport] = React.useState<'ciclismo' | 'carrera' | 'natacion'>('ciclismo');
  const [mockFtp, setMockFtp] = React.useState(180);

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

          {/* feature 4: Planificador de Roster */}
          <div className="rounded-2xl border border-zinc-900 bg-zinc-900/10 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Planificador en Tiempo Real</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Planifica sesiones de intervalos y entrenamientos personalizados en segundos directamente en el calendario del atleta. Se actualiza al instante en su móvil.
              </p>
            </div>

            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 text-[10px] space-y-1.5">
              <div className="flex justify-between items-center text-zinc-500">
                <span>Martes • Ciclismo</span>
                <span className="text-orange-400 font-bold">60 min</span>
              </div>
              <div className="text-zinc-200 font-bold truncate">**Intervalos VO2Max**</div>
              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-orange-500" />
              </div>
            </div>
          </div>

          {/* feature 5: Marketplace */}
          <div className="rounded-2xl border border-zinc-900 bg-zinc-900/10 p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Compass className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Crawler de Material</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                ¿Te falta material para tu carrera? Nuestro indexador inteligente rastrea chollos técnicos de segunda mano (neoprenos, ruedas de perfil) en segundos.
              </p>
            </div>

            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5 truncate">
                <span>🩱</span>
                <div className="truncate">
                  <span className="font-bold text-white block truncate">Orca Athlex</span>
                  <span className="text-zinc-500 block">Talla MT</span>
                </div>
              </div>
              <span className="font-black text-amber-400 shrink-0">140€</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
