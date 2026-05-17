'use client';

import * as React from 'react';
import { PmcPoint } from '@/app/analytics/analytics-actions';
import { ProCard } from '@/components/ui/pro-card';

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

  // Generar puntos SVG para las líneas
  const { ctlPoints, atlPoints, tsbPoints } = React.useMemo(() => {
    if (filteredData.length === 0) return { ctlPoints: '', atlPoints: '', tsbPoints: '' };

    const width = 800;
    const height = 240;
    const step = width / (filteredData.length - 1 || 1);

    let ctlStr = '';
    let atlStr = '';
    let tsbStr = '';

    filteredData.forEach((d, index) => {
      const x = index * step;
      // Invertir Y porque 0 está arriba en SVG
      const yCtl = height - (d.ctl / maxVal) * height;
      const yAtl = height - (d.atl / maxVal) * height;
      // TSB puede ser negativo, situamos el 0 en el centro/tercio inferior
      const yTsb = height * 0.7 - (d.tsb / maxVal) * (height * 0.5);

      ctlStr += `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${yCtl.toFixed(1)} `;
      atlStr += `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${yAtl.toFixed(1)} `;
      tsbStr += `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${yTsb.toFixed(1)} `;
    });

    return { ctlPoints: ctlStr, atlPoints: atlStr, tsbPoints: tsbStr };
  }, [filteredData, maxVal]);

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

      {/* Tarjetas de Resumen (CTL, ATL, TSB) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Fitness (CTL) */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-950/20 to-zinc-900/50 p-4 border border-cyan-500/20 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl -mr-10 -mt-10 pointer-events-none" />
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Fitness (CTL)
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-light text-zinc-50">{currentCtl}</span>
            <span className="text-xs text-cyan-500/80 font-medium">pts / día</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">Carga crónica acumulada (42 días)</p>
        </div>

        {/* Fatiga (ATL) */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-rose-950/20 to-zinc-900/50 p-4 border border-rose-500/20 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl -mr-10 -mt-10 pointer-events-none" />
          <p className="text-xs font-semibold uppercase tracking-wider text-rose-400">
            Fatiga (ATL)
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-light text-zinc-50">{currentAtl}</span>
            <span className="text-xs text-rose-500/80 font-medium">pts / día</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">Estrés agudo reciente (7 días)</p>
        </div>

        {/* Forma (TSB) */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-950/20 to-zinc-900/50 p-4 border border-amber-500/20 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl -mr-10 -mt-10 pointer-events-none" />
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Forma (TSB)
          </p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-light text-zinc-50">
              {currentTsb > 0 ? `+${currentTsb}` : currentTsb}
            </span>
            <span className="text-xs text-amber-500/80 font-medium">balance</span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            {currentTsb >= -10 && currentTsb <= 10
              ? 'Estado óptimo de frescura'
              : currentTsb < -10
              ? 'Carga alta / Fatiga acumulada'
              : 'Descanso prolongado / Pérdida de fitness'}
          </p>
        </div>
      </div>

      {/* Gráfico SVG Principal */}
      <div className="relative w-full pt-6 pb-2">
        {/* Leyenda Visual */}
        <div className="flex items-center justify-end gap-6 mb-4 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-cyan-400 rounded-full" />
            <span className="text-zinc-400">Fitness (CTL)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-rose-500 rounded-full border border-dashed border-rose-500" />
            <span className="text-zinc-400">Fatiga (ATL)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-amber-500 rounded-full" />
            <span className="text-zinc-400">Forma (TSB)</span>
          </div>
        </div>

        {/* Contenedor del SVG con aspecto de ratio fijo */}
        <div className="relative w-full aspect-[3/1] min-h-[220px] max-h-[320px] bg-zinc-950/40 rounded-xl border border-zinc-800/50 p-4 overflow-hidden">
          {/* Líneas de cuadrícula de fondo */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none px-4 py-6">
            <div className="w-full border-b border-zinc-800/40" />
            <div className="w-full border-b border-zinc-800/40" />
            <div className="w-full border-b border-zinc-800/40" />
            <div className="w-full border-b border-zinc-800/40" />
          </div>

          <svg
            viewBox="0 0 800 240"
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            {/* Curva de Fitness (Azul Celeste) */}
            <path
              d={ctlPoints}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500"
            />

            {/* Curva de Fatiga (Rosa Coral - Dashed) */}
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

            {/* Curva de Forma (Amarillo Ámbar) */}
            <path
              d={tsbPoints}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500 opacity-90"
            />
          </svg>

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
