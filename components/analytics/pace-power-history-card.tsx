'use client';

import * as React from 'react';
import { PacePowerPoint } from '@/app/(app)/analytics/analytics-actions';
import { ProCard } from '@/components/ui/pro-card';
import { Activity, Flame, TrendingUp } from 'lucide-react';

interface PacePowerHistoryCardProps {
  history: PacePowerPoint[];
}

export function PacePowerHistoryCard({ history }: PacePowerHistoryCardProps) {
  const [activeTab, setActiveTab] = React.useState<'ftp' | 'run' | 'swim'>('ftp');
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const height = 180;
  const width = 600;

  // Formateadores de datos
  const formatRunPace = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.round(sec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')} min/km`;
  };

  const formatSwimPace = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.round(sec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')} min/100m`;
  };

  // Calcular máximos y mínimos para escalar correctamente
  const stats = React.useMemo(() => {
    if (!history || history.length === 0) return { minVal: 0, maxVal: 100 };
    
    let values: number[] = [];
    if (activeTab === 'ftp') {
      values = history.map(h => h.ftp);
    } else if (activeTab === 'run') {
      values = history.map(h => h.runPaceSeconds);
    } else {
      values = history.map(h => h.swimPaceSeconds);
    }

    const max = Math.max(...values);
    const min = Math.min(...values);
    
    // Dejar un margen superior e inferior
    const range = max - min || 10;
    return {
      minVal: Math.max(0, min - range * 0.15),
      maxVal: max + range * 0.15,
      rawMin: min,
      rawMax: max
    };
  }, [history, activeTab]);

  // Generar puntos SVG
  const linePoints = React.useMemo(() => {
    if (!history || history.length === 0) return '';
    const step = width / (history.length - 1 || 1);
    const range = stats.maxVal - stats.minVal;

    return history.map((h, idx) => {
      const x = idx * step;
      let val = 0;
      if (activeTab === 'ftp') val = h.ftp;
      else if (activeTab === 'run') val = h.runPaceSeconds;
      else val = h.swimPaceSeconds;

      // Invertir el eje Y para los ritmos (menor tiempo = mejor rendimiento, por lo tanto debe dibujarse más arriba!)
      const pct = (val - stats.minVal) / range;
      const y = activeTab === 'ftp' 
        ? height - pct * height 
        : pct * height; // Para ritmos, menor es mejor, por lo que menor va arriba.

      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  }, [history, activeTab, stats]);

  // Manejador del cursor
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!history || history.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const idx = Math.min(
      Math.max(Math.round(xPct * (history.length - 1)), 0),
      history.length - 1
    );
    setHoveredIndex(idx);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  // Coordenadas hover activo
  const step = width / (history.length - 1 || 1);
  const hoverX = hoveredIndex !== null ? hoveredIndex * step : 0;
  const activePoint = hoveredIndex !== null ? history[hoveredIndex] : null;

  const hoverY = React.useMemo(() => {
    if (hoveredIndex === null || !activePoint) return 0;
    let val = 0;
    if (activeTab === 'ftp') val = activePoint.ftp;
    else if (activeTab === 'run') val = activePoint.runPaceSeconds;
    else val = activePoint.swimPaceSeconds;

    const range = stats.maxVal - stats.minVal;
    const pct = (val - stats.minVal) / range;
    return activeTab === 'ftp'
      ? height - pct * height
      : pct * height;
  }, [hoveredIndex, activePoint, activeTab, stats]);

  // Formatear valor actual o hovered
  const renderCurrentValue = () => {
    const pt = activePoint || history[history.length - 1];
    if (!pt) return '';
    if (activeTab === 'ftp') return `${pt.ftp} W`;
    if (activeTab === 'run') return formatRunPace(pt.runPaceSeconds);
    return formatSwimPace(pt.swimPaceSeconds);
  };

  const renderProgressMessage = () => {
    if (history.length < 2) return '';
    const first = history[0];
    const last = history[history.length - 1];
    
    if (activeTab === 'ftp') {
      const diff = last.ftp - first.ftp;
      return diff >= 0 
        ? `📈 +${diff}W de mejora en tu FTP en las últimas 12 semanas.`
        : `📉 -${Math.abs(diff)}W de variación en tu FTP de fondo.`;
    } else if (activeTab === 'run') {
      const diff = first.runPaceSeconds - last.runPaceSeconds;
      const formattedDiff = Math.abs(diff);
      const min = Math.floor(formattedDiff / 60);
      const sec = Math.round(formattedDiff % 60);
      const str = min > 0 ? `${min}m ${sec}s` : `${sec}s`;
      return diff >= 0
        ? `🔥 Has reducido tu ritmo de carrera en ${str}/km. ¡Mayor velocidad!`
        : `⚠️ Ritmo de carrera aumentado en ${str}/km. Revisa la fatiga.`;
    } else {
      const diff = first.swimPaceSeconds - last.swimPaceSeconds;
      const formattedDiff = Math.abs(diff);
      const str = `${formattedDiff}s`;
      return diff >= 0
        ? `🏊‍♂️ Natación optimizada: -${str}/100m en tus ritmos de series.`
        : `⚠️ Ritmo de natación aumentado en ${str}/100m. Revisa tu técnica.`;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <ProCard className="flex flex-col justify-between space-y-6">
      
      {/* Encabezado y Selectores */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Historial de Rendimiento
            </h2>
          </div>
          <h3 className="text-2xl font-light text-zinc-900 mt-1">
            Progresión Fisiológica y Umbrales
          </h3>
        </div>

        {/* Pestañas de disciplina */}
        <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 w-full sm:w-auto">
          {[
            { id: 'ftp', label: 'Bici (FTP)' },
            { id: 'run', label: 'Carrera' },
            { id: 'swim', label: 'Natación' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setHoveredIndex(null); }}
              className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-zinc-900 border border-zinc-200/80 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Panel de progreso superior */}
      <div className="flex items-baseline justify-between bg-zinc-50 p-4 rounded-xl border border-zinc-200">
        <div>
          <p className="text-[10px] text-zinc-650 uppercase tracking-widest font-bold">
            {hoveredIndex !== null && activePoint ? `Semana del ${formatDate(activePoint.date)}` : 'Nivel Actual / Último Registro'}
          </p>
          <p className="text-3xl font-light text-zinc-900 mt-1 transition-all">
            {renderCurrentValue()}
          </p>
        </div>
        <div className="text-right text-[11px] text-cyan-600 font-semibold">
          {renderProgressMessage()}
        </div>
      </div>

      {/* Gráfico interactivo */}
      <div 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full aspect-[3/1] min-h-[160px] bg-zinc-50/50 rounded-xl border border-zinc-200 p-4 overflow-hidden cursor-crosshair select-none flex flex-col justify-between"
      >
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none px-4 py-6">
          <div className="w-full border-b border-zinc-200" />
          <div className="w-full border-b border-zinc-200" />
          <div className="w-full border-b border-zinc-200" />
        </div>

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Sombra de área bajo la curva (FTP solamente) */}
          {activeTab === 'ftp' && (
            <path
              d={`${linePoints} L ${(width).toFixed(1)} ${height} L 0 ${height} Z`}
              fill="url(#gradFtp)"
              className="opacity-20 transition-all duration-500"
            />
          )}

          {/* Línea principal de la curva */}
          <path
            d={linePoints}
            fill="none"
            stroke={activeTab === 'ftp' ? '#38bdf8' : activeTab === 'run' ? '#34d399' : '#c084fc'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-500"
          />

          {/* Degradados */}
          <defs>
            <linearGradient id="gradFtp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Línea guía e indicador circular */}
          {hoveredIndex !== null && activePoint && (
            <>
              <line
                x1={hoverX}
                y1={0}
                x2={hoverX}
                y2={height}
                stroke="#d4d4d8"
                strokeWidth="1"
                strokeDasharray="4,4"
                pointerEvents="none"
              />
              <circle 
                cx={hoverX} 
                cy={hoverY} 
                r="6" 
                fill={activeTab === 'ftp' ? '#38bdf8' : activeTab === 'run' ? '#34d399' : '#c084fc'} 
                stroke="#ffffff" 
                strokeWidth="2.5" 
                pointerEvents="none" 
              />
            </>
          )}
        </svg>

        {/* Leyenda fechas eje X */}
        <div className="flex justify-between text-[9px] text-zinc-500 font-bold uppercase tracking-wider px-2">
          <span>{formatDate(history[0]?.date)}</span>
          <span>{formatDate(history[Math.floor(history.length / 2)]?.date)}</span>
          <span>{formatDate(history[history.length - 1]?.date)} (Hoy)</span>
        </div>
      </div>

    </ProCard>
  );
}
