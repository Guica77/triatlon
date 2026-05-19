'use client';

import * as React from 'react';
import { PmcPoint } from '@/app/analytics/analytics-actions';
import { ProCard } from '@/components/ui/pro-card';
import { HelpCircle } from 'lucide-react';

interface PerformanceChartCardProps {
  pmcData: PmcPoint[];
  currentCtl: number;
  currentAtl: number;
  currentTsb: number;
}

export function PerformanceChartCard({
  pmcData,
  currentCtl,
  currentAtl,
  currentTsb,
}: PerformanceChartCardProps) {
  const [timeRange, setTimeRange] = React.useState<number>(30); // 30, 60 o 90 días
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [activeHelp, setActiveHelp] = React.useState<'ctl' | 'atl' | 'tsb' | null>(null);
  const [showVolume, setShowVolume] = React.useState(true);
  const [visibleLines, setVisibleLines] = React.useState({
    ctl: true,
    atl: true,
    tsb: true,
    swim: true,
    bike: true,
    run: true,
  });

  const toggleLine = (lineKey: keyof typeof visibleLines) => {
    setVisibleLines((prev) => ({
      ...prev,
      [lineKey]: !prev[lineKey],
    }));
  };

  const toggleAllVolume = () => {
    const nextShow = !showVolume;
    setShowVolume(nextShow);
    setVisibleLines((prev) => ({
      ...prev,
      swim: nextShow,
      bike: nextShow,
      run: nextShow,
    }));
  };

  const height = 240;
  const width = 800;

  // Filtrar datos según el rango seleccionado
  const filteredData = React.useMemo(() => {
    if (!pmcData || pmcData.length === 0) return [];
    return pmcData.slice(-timeRange);
  }, [pmcData, timeRange]);

  // Encontrar valores máximos para escalar el SVG correctamente
  const maxVal = React.useMemo(() => {
    if (filteredData.length === 0) return 100;
    let max = 10;
    filteredData.forEach((d) => {
      if (d.ctl > max) max = d.ctl;
      if (d.atl > max) max = d.atl;
      if (Math.abs(d.tsb) > max) max = Math.abs(d.tsb);
    });
    return max * 1.2; // 20% de margen superior
  }, [filteredData]);

  // Encontrar máximos de distancia para calcular coordenadas del hover y curvas
  const { maxSwim, maxBike, maxRun } = React.useMemo(() => {
    let swim = 1000;
    let bike = 10;
    let run = 5;
    filteredData.forEach((d) => {
      if (d.swimDistance && d.swimDistance > swim) swim = d.swimDistance;
      if (d.bikeDistance && d.bikeDistance > bike) bike = d.bikeDistance;
      if (d.runDistance && d.runDistance > run) run = d.runDistance;
    });
    return { maxSwim: swim, maxBike: bike, maxRun: run };
  }, [filteredData]);

  // Generar puntos SVG para las líneas
  const { ctlPoints, atlPoints, tsbPoints, swimPoints, bikePoints, runPoints } = React.useMemo(() => {
    if (filteredData.length === 0) return { ctlPoints: '', atlPoints: '', tsbPoints: '', swimPoints: '', bikePoints: '', runPoints: '' };

    const step = width / (filteredData.length - 1 || 1);

    let ctlStr = '';
    let atlStr = '';
    let tsbStr = '';
    let swimStr = '';
    let bikeStr = '';
    let runStr = '';

    filteredData.forEach((d, index) => {
      const x = index * step;
      const yCtl = height - (d.ctl / maxVal) * height;
      const yAtl = height - (d.atl / maxVal) * height;
      const yTsb = height * 0.7 - (d.tsb / maxVal) * (height * 0.5);

      const ySwim = height - ((d.swimDistance || 0) / maxSwim) * (height * 0.4);
      const yBike = height - ((d.bikeDistance || 0) / maxBike) * (height * 0.4);
      const yRun = height - ((d.runDistance || 0) / maxRun) * (height * 0.4);

      ctlStr += `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${yCtl.toFixed(1)} `;
      atlStr += `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${yAtl.toFixed(1)} `;
      tsbStr += `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${yTsb.toFixed(1)} `;

      swimStr += `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${ySwim.toFixed(1)} `;
      bikeStr += `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${yBike.toFixed(1)} `;
      runStr += `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${yRun.toFixed(1)} `;
    });

    return { 
      ctlPoints: ctlStr, 
      atlPoints: atlStr, 
      tsbPoints: tsbStr, 
      swimPoints: swimStr, 
      bikePoints: bikeStr, 
      runPoints: runStr 
    };
  }, [filteredData, maxVal, maxSwim, maxBike, maxRun]);

  // Manejo de Interacción del Cursor
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (filteredData.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const index = Math.min(
      Math.max(Math.round(xPct * (filteredData.length - 1)), 0),
      filteredData.length - 1
    );
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  // Calcular Coordenadas del Punto Seleccionado
  const step = width / (filteredData.length - 1 || 1);
  const hoverX = hoveredIndex !== null ? hoveredIndex * step : 0;
  const activePoint = hoveredIndex !== null ? filteredData[hoveredIndex] : null;

  const hoverCtlY = activePoint ? height - (activePoint.ctl / maxVal) * height : 0;
  const hoverAtlY = activePoint ? height - (activePoint.atl / maxVal) * height : 0;
  const hoverTsbY = activePoint ? height * 0.7 - (activePoint.tsb / maxVal) * (height * 0.5) : 0;

  const hoverSwimY = activePoint ? height - ((activePoint.swimDistance || 0) / maxSwim) * (height * 0.4) : 0;
  const hoverBikeY = activePoint ? height - ((activePoint.bikeDistance || 0) / maxBike) * (height * 0.4) : 0;
  const hoverRunY = activePoint ? height - ((activePoint.runDistance || 0) / maxRun) * (height * 0.4) : 0;

  // Valores a mostrar (Dinámicos si el cursor está encima)
  const displayCtl = activePoint ? activePoint.ctl : currentCtl;
  const displayAtl = activePoint ? activePoint.atl : currentAtl;
  const displayTsb = activePoint ? activePoint.tsb : currentTsb;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <ProCard className="flex flex-col justify-between space-y-6 md:col-span-2">
      {/* Encabezado y Selectores */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--color-border)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Gestión de Rendimiento (PMC)
            </h2>
          </div>
          <h3 className="text-2xl font-light text-zinc-50 mt-1">
            Evolución de Fitness & Fatiga
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle de Volumen */}
          <button
            onClick={toggleAllVolume}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
              showVolume
                ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-400'
                : 'bg-zinc-900/80 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${showVolume ? 'bg-cyan-450 animate-pulse' : 'bg-zinc-600'}`} />
            {showVolume ? 'Volumen en vivo' : 'Ver volumen'}
          </button>

          {/* Pestañas de Rango Temporal */}
          <div className="flex items-center bg-zinc-900/80 p-1 rounded-lg border border-zinc-800/80">
            {[
              { label: '4 Sem', value: 30 },
              { label: '8 Sem', value: 60 },
              { label: '3 Meses', value: 90 },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setTimeRange(tab.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  timeRange === tab.value
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tarjetas de Resumen Dinámicas (CTL, ATL, TSB) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Fitness (CTL) */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-950/20 to-zinc-900/50 p-4 border border-cyan-500/20 backdrop-blur-sm transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl -mr-10 -mt-10 pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Fitness (CTL)
            </p>
            <button 
              onClick={() => setActiveHelp(activeHelp === 'ctl' ? null : 'ctl')}
              className="text-zinc-500 hover:text-cyan-400 transition-colors p-0.5"
              title="¿Qué significa Fitness?"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-light text-zinc-50">{displayCtl}</span>
            <span className="text-xs text-cyan-500/80 font-medium">pts / día</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">
            {activePoint ? `Medido al ${formatDate(activePoint.date)}` : 'Carga crónica acumulada (42 días)'}
          </p>

          {/* Help Overlay */}
          {activeHelp === 'ctl' && (
            <div 
              onClick={() => setActiveHelp(null)}
              className="absolute inset-0 bg-zinc-950/95 border border-cyan-500/30 rounded-xl p-3 flex flex-col justify-between z-20 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 cursor-pointer select-none"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">¿Qué es el Fitness (CTL)?</p>
                  <span className="text-[9px] text-zinc-500 hover:text-white transition-colors">✕</span>
                </div>
                <p className="text-[9.5px] text-zinc-300 leading-relaxed">
                  Mide tu condición física a largo plazo (promedio de 42 días). A mayor valor, más volumen e intensidad podrás asimilar.
                </p>
              </div>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider text-right w-full mt-1">
                Haz clic para cerrar
              </p>
            </div>
          )}
        </div>

        {/* Fatiga (ATL) */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-950/20 to-zinc-900/50 p-4 border border-rose-500/20 backdrop-blur-sm transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl -mr-10 -mt-10 pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Fatiga (ATL)
            </p>
            <button 
              onClick={() => setActiveHelp(activeHelp === 'atl' ? null : 'atl')}
              className="text-zinc-500 hover:text-rose-400 transition-colors p-0.5"
              title="¿Qué significa Fatiga?"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-light text-zinc-50">{displayAtl}</span>
            <span className="text-xs text-rose-500/80 font-medium">pts / día</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">
            {activePoint ? `Medido al ${formatDate(activePoint.date)}` : 'Estrés agudo reciente (7 días)'}
          </p>

          {/* Help Overlay */}
          {activeHelp === 'atl' && (
            <div 
              onClick={() => setActiveHelp(null)}
              className="absolute inset-0 bg-zinc-950/95 border border-rose-500/30 rounded-xl p-3 flex flex-col justify-between z-20 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 cursor-pointer select-none"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">¿Qué es la Fatiga (ATL)?</p>
                  <span className="text-[9px] text-zinc-500 hover:text-white transition-colors">✕</span>
                </div>
                <p className="text-[9.5px] text-zinc-300 leading-relaxed">
                  Mide el cansancio a corto plazo (promedio de 7 días). Sube rápido tras sesiones duras y avisa del riesgo de sobreentrenamiento.
                </p>
              </div>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider text-right w-full mt-1">
                Haz clic para cerrar
              </p>
            </div>
          )}
        </div>

        {/* Forma (TSB) */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-950/20 to-zinc-900/50 p-4 border border-amber-500/20 backdrop-blur-sm transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl -mr-10 -mt-10 pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Forma (TSB)
            </p>
            <button 
              onClick={() => setActiveHelp(activeHelp === 'tsb' ? null : 'tsb')}
              className="text-zinc-500 hover:text-amber-400 transition-colors p-0.5"
              title="¿Qué significa Forma?"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-light text-zinc-50">
              {displayTsb > 0 ? `+${displayTsb}` : displayTsb}
            </span>
            <span className="text-xs text-amber-500/80 font-medium">balance</span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">
            {activePoint 
              ? `Medido al ${formatDate(activePoint.date)}`
              : currentTsb >= -10 && currentTsb <= 10
              ? 'Estado óptimo de frescura'
              : currentTsb < -10
              ? 'Carga alta / Fatiga acumulada'
              : 'Descanso prolongado / Pérdida de fitness'}
          </p>

          {/* Help Overlay */}
          {activeHelp === 'tsb' && (
            <div 
              onClick={() => setActiveHelp(null)}
              className="absolute inset-0 bg-zinc-950/95 border border-amber-500/30 rounded-xl p-3 flex flex-col justify-between z-20 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 cursor-pointer select-none"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">¿Qué es la Forma (TSB)?</p>
                  <span className="text-[9px] text-zinc-500 hover:text-white transition-colors">✕</span>
                </div>
                <p className="text-[9px] text-zinc-300 leading-relaxed">
                  Diferencia entre Fitness y Fatiga (CTL - ATL).
                  <br />• <strong>-10 a -30:</strong> Zona productiva.
                  <br />• <strong>+5 a +25:</strong> Zona óptima para competir (frescura).
                </p>
              </div>
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider text-right w-full mt-1">
                Haz clic para cerrar
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Gráfico SVG Principal Interactivo */}
      <div className="relative w-full pt-6 pb-2">
        {/* Leyenda Visual */}
        <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 mb-4 text-xs font-medium">
          <button
            onClick={() => toggleLine('ctl')}
            className={`flex items-center gap-2 transition-all hover:opacity-100 ${visibleLines.ctl ? 'opacity-100' : 'opacity-30 line-through text-zinc-550'}`}
          >
            <span className="w-3 h-0.5 bg-cyan-400 rounded-full" />
            <span>Fitness (CTL)</span>
          </button>
          
          <button
            onClick={() => toggleLine('atl')}
            className={`flex items-center gap-2 transition-all hover:opacity-100 ${visibleLines.atl ? 'opacity-100' : 'opacity-30 line-through text-zinc-550'}`}
          >
            <span className="w-3 h-0.5 bg-rose-500 rounded-full border border-dashed border-rose-500" />
            <span>Fatiga (ATL)</span>
          </button>
          
          <button
            onClick={() => toggleLine('tsb')}
            className={`flex items-center gap-2 transition-all hover:opacity-100 ${visibleLines.tsb ? 'opacity-100' : 'opacity-30 line-through text-zinc-550'}`}
          >
            <span className="w-3 h-0.5 bg-amber-500 rounded-full" />
            <span>Forma (TSB)</span>
          </button>

          {showVolume && (
            <>
              <button
                onClick={() => toggleLine('swim')}
                className={`flex items-center gap-2 border-l border-zinc-800 pl-4 transition-all hover:opacity-100 ${visibleLines.swim ? 'opacity-100' : 'opacity-30 line-through text-zinc-550'}`}
              >
                <span className="w-3 h-0.5 bg-purple-400 rounded-full opacity-70" />
                <span>Vol. Natación</span>
              </button>
              
              <button
                onClick={() => toggleLine('bike')}
                className={`flex items-center gap-2 transition-all hover:opacity-100 ${visibleLines.bike ? 'opacity-100' : 'opacity-30 line-through text-zinc-550'}`}
              >
                <span className="w-3 h-0.5 bg-sky-400 rounded-full opacity-70" />
                <span>Vol. Ciclismo</span>
              </button>
              
              <button
                onClick={() => toggleLine('run')}
                className={`flex items-center gap-2 transition-all hover:opacity-100 ${visibleLines.run ? 'opacity-100' : 'opacity-30 line-through text-zinc-550'}`}
              >
                <span className="w-3 h-0.5 bg-emerald-400 rounded-full opacity-70" />
                <span>Vol. Carrera</span>
              </button>
            </>
          )}
        </div>

        {/* Contenedor del SVG con gestos e interacción del cursor */}
        <div 
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative w-full aspect-[3/1] min-h-[220px] max-h-[320px] bg-zinc-950/40 rounded-xl border border-zinc-800/50 p-4 overflow-hidden cursor-crosshair select-none"
        >
          {/* Líneas de cuadrícula de fondo */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none px-4 py-6">
            <div className="w-full border-b border-zinc-800/40" />
            <div className="w-full border-b border-zinc-800/40" />
            <div className="w-full border-b border-zinc-800/40" />
            <div className="w-full border-b border-zinc-800/40" />
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            {/* Líneas de volumen si showVolume es true */}
            {showVolume && (
              <>
                {/* Natación: morado */}
                {visibleLines.swim && (
                  <path
                    d={swimPoints}
                    fill="none"
                    stroke="#c084fc"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-500 opacity-60"
                  />
                )}

                {/* Ciclismo: azul celeste */}
                {visibleLines.bike && (
                  <path
                    d={bikePoints}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-500 opacity-60"
                  />
                )}

                {/* Carrera: verde esmeralda */}
                {visibleLines.run && (
                  <path
                    d={runPoints}
                    fill="none"
                    stroke="#34d399"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-all duration-500 opacity-60"
                  />
                )}
              </>
            )}

            {/* Curva de Fitness (Azul Celeste) */}
            {visibleLines.ctl && (
              <path
                d={ctlPoints}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500"
              />
            )}

            {/* Curva de Fatiga (Rosa Coral - Dashed) */}
            {visibleLines.atl && (
              <path
                d={atlPoints}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2"
                strokeDasharray="6,6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500 opacity-80"
              />
            )}

            {/* Curva de Forma (Amarillo Ámbar) */}
            {visibleLines.tsb && (
              <path
                d={tsbPoints}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-all duration-500 opacity-90"
              />
            )}

            {/* Líneas Guía Interactiva y Nodos */}
            {hoveredIndex !== null && activePoint && (
              <>
                <line
                  x1={hoverX}
                  y1={0}
                  x2={hoverX}
                  y2={height}
                  stroke="#52525b"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                  pointerEvents="none"
                />
                
                {/* Nodos resaltados principales */}
                {visibleLines.ctl && (
                  <circle cx={hoverX} cy={hoverCtlY} r="5" fill="#22d3ee" stroke="#09090b" strokeWidth="2.5" pointerEvents="none" />
                )}
                {visibleLines.atl && (
                  <circle cx={hoverX} cy={hoverAtlY} r="5" fill="#f43f5e" stroke="#09090b" strokeWidth="2.5" pointerEvents="none" />
                )}
                {visibleLines.tsb && (
                  <circle cx={hoverX} cy={hoverTsbY} r="5" fill="#f59e0b" stroke="#09090b" strokeWidth="2.5" pointerEvents="none" />
                )}

                {/* Nodos de volumen resaltados si showVolume está activo */}
                {showVolume && (
                  <>
                    {visibleLines.swim && activePoint.swimDistance > 0 && (
                      <circle cx={hoverX} cy={hoverSwimY} r="4" fill="#c084fc" stroke="#09090b" strokeWidth="1.5" pointerEvents="none" />
                    )}
                    {visibleLines.bike && activePoint.bikeDistance > 0 && (
                      <circle cx={hoverX} cy={hoverBikeY} r="4" fill="#38bdf8" stroke="#09090b" strokeWidth="1.5" pointerEvents="none" />
                    )}
                    {visibleLines.run && activePoint.runDistance > 0 && (
                      <circle cx={hoverX} cy={hoverRunY} r="4" fill="#34d399" stroke="#09090b" strokeWidth="1.5" pointerEvents="none" />
                    )}
                  </>
                )}
              </>
            )}
          </svg>

          {/* Tooltip flotante interactivo */}
          {hoveredIndex !== null && activePoint && (
            <div 
              className="absolute top-4 pointer-events-none bg-zinc-950/95 border border-zinc-800 rounded-lg p-2.5 shadow-2xl text-[10px] text-zinc-400 space-y-1 z-30 transition-all duration-75 select-none backdrop-blur-md"
              style={{
                left: `${(hoveredIndex / (filteredData.length - 1)) * 100}%`,
                transform: hoveredIndex > filteredData.length / 2 ? 'translateX(-110%)' : 'translateX(10%)',
              }}
            >
              <p className="font-bold text-zinc-200 border-b border-zinc-850 pb-1 mb-1.5">
                {activePoint.date}
              </p>
              {visibleLines.ctl && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span>Fitness (CTL): <strong className="text-zinc-200">{activePoint.ctl}</strong></span>
                </div>
              )}
              {visibleLines.atl && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Fatiga (ATL): <strong className="text-zinc-200">{activePoint.atl}</strong></span>
                </div>
              )}
              {visibleLines.tsb && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span>Forma (TSB): <strong className={activePoint.tsb >= 0 ? 'text-green-400' : 'text-amber-500'}>{activePoint.tsb > 0 ? `+${activePoint.tsb}` : activePoint.tsb}</strong></span>
                </div>
              )}

              {/* Distancias si el punto las tiene y las líneas están activas */}
              {showVolume && 
               ((visibleLines.bike && activePoint.bikeDistance > 0) || 
                (visibleLines.run && activePoint.runDistance > 0) || 
                (visibleLines.swim && activePoint.swimDistance > 0)) && (
                <div className="border-t border-zinc-800/60 pt-1 mt-1.5 space-y-0.5">
                  {visibleLines.swim && activePoint.swimDistance > 0 && (
                    <div className="flex items-center gap-1 text-[9px] text-purple-400">
                      <span>Nadar: <strong>{activePoint.swimDistance} m</strong></span>
                    </div>
                  )}
                  {visibleLines.bike && activePoint.bikeDistance > 0 && (
                    <div className="flex items-center gap-1 text-[9px] text-sky-400">
                      <span>Bici: <strong>{activePoint.bikeDistance} km</strong></span>
                    </div>
                  )}
                  {visibleLines.run && activePoint.runDistance > 0 && (
                    <div className="flex items-center gap-1 text-[9px] text-emerald-400">
                      <span>Correr: <strong>{activePoint.runDistance} km</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Fechas en el eje X */}
          <div className="absolute bottom-1 left-4 right-4 flex justify-between text-[10px] text-zinc-500 font-medium tracking-wider uppercase">
            <span>{filteredData[0]?.date}</span>
            <span>{filteredData[Math.floor(filteredData.length / 2)]?.date}</span>
            <span>{filteredData[filteredData.length - 1]?.date} (Hoy)</span>
          </div>
        </div>
      </div>
    </ProCard>
  );
}
