'use client';
 
import * as React from 'react';
import { Zap, ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
 
interface FormStatusWidgetProps {
  tsb: number;
  ctl?: number;
  atl?: number;
  athleteLevel?: string;
  progressPercent?: number;
  pmcHistory?: any[];
}
 
export function FormStatusWidget({ 
  tsb, 
  ctl = 0, 
  atl = 0, 
  athleteLevel, 
  progressPercent = 0, 
  pmcHistory = [] 
}: FormStatusWidgetProps) {
  const isBeginner = athleteLevel === 'principiante';
 
  const safeTsb = typeof tsb === 'number' && !isNaN(tsb) ? tsb : 0;
  const safeProgressPercent = typeof progressPercent === 'number' && !isNaN(progressPercent) ? progressPercent : 0;
  
  let label = '';
  let description = '';
  let color = '';
  let gradientId = '';
  let borderHoverClass = '';
  
  if (isBeginner) {
    if (safeProgressPercent < 30) {
      label = '¡Buen comienzo!';
      description = 'Sigue sumando, cada sesión cuenta para crear el hábito.';
      color = 'text-blue-500';
      gradientId = 'formBlueGrad';
      borderHoverClass = 'hover:border-blue-300';
    } else if (safeProgressPercent < 70) {
      label = 'Buen camino';
      description = 'Constancia sólida esta semana. ¡Mantén el ritmo!';
      color = 'text-emerald-500';
      gradientId = 'formOptimalGrad';
      borderHoverClass = 'hover:border-emerald-300';
    } else {
      label = '¡Constancia Impecable!';
      description = 'Excelente adherencia al plan. Estás construyendo una gran base.';
      color = 'text-amber-500';
      gradientId = 'formOverloadGrad';
      borderHoverClass = 'hover:border-amber-300';
    }
  } else {
    if (safeTsb > 25) {
      label = 'Pérdida de Forma';
      description = 'Demasiado descanso, perdiendo condición.';
      color = 'text-zinc-550';
      gradientId = 'formGrayGrad';
      borderHoverClass = 'hover:border-zinc-350';
    } else if (safeTsb >= 5) {
      label = 'Pico de Forma';
      description = 'Frescura alta. Listo para competir.';
      color = 'text-emerald-600';
      gradientId = 'formOptimalGrad';
      borderHoverClass = 'hover:border-emerald-300';
    } else if (safeTsb >= -10) {
      label = 'Entrenamiento Óptimo';
      description = 'Asimilando cargas correctamente.';
      color = 'text-blue-600';
      gradientId = 'formBlueGrad';
      borderHoverClass = 'hover:border-blue-300';
    } else if (safeTsb >= -25) {
      label = 'Sobrecarga Controlada';
      description = 'Semana de impacto. La fatiga es alta.';
      color = 'text-amber-600';
      gradientId = 'formOverloadGrad';
      borderHoverClass = 'hover:border-amber-300';
    } else {
      label = 'Alerta de Fatiga';
      description = 'Riesgo de lesión. Considera descansar.';
      color = 'text-rose-600';
      gradientId = 'formRedGrad';
      borderHoverClass = 'hover:border-rose-300';
    }
  }
 
  // Calcular porcentaje del dial
  const clampedTsb = Math.min(Math.max(safeTsb, -50), 50);
  const percentage = isBeginner
    ? Math.min(Math.max(safeProgressPercent, 0), 100) / 100
    : (clampedTsb + 50) / 100;
  
  // Parámetros de la circunferencia del círculo (r = 38)
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76
  const strokeDashoffset = circumference * (1 - percentage);

  // Cortar historial PMC a los últimos 7 días
  const historyPoints = React.useMemo(() => {
    if (!pmcHistory || pmcHistory.length === 0) return [];
    return pmcHistory.slice(-7);
  }, [pmcHistory]);

  const showChart = !isBeginner && historyPoints.length >= 2;

  // Lógica de escalado del mini-gráfico PMC
  const ctlValues = historyPoints.map(p => Number(p.ctl || 0));
  const atlValues = historyPoints.map(p => Number(p.atl || 0));
  const tsbValues = historyPoints.map(p => Number(p.tsb || 0));

  const maxL = Math.max(...ctlValues, ...atlValues, 20);
  const minL = Math.min(...ctlValues, ...atlValues, 0);
  const rangeL = maxL - minL || 1;

  const maxT = Math.max(...tsbValues, 10);
  const minT = Math.min(...tsbValues, -30);
  const rangeT = maxT - minT || 1;

  const chartWidth = 280;
  const chartHeight = 55;
  const chartPadding = 4;

  const getX = (idx: number, total: number) => {
    if (total <= 1) return chartPadding;
    return chartPadding + (idx / (total - 1)) * (chartWidth - 2 * chartPadding);
  };

  const getY_L = (val: number) => {
    return chartHeight - chartPadding - ((val - minL) / rangeL) * (chartHeight - 2 * chartPadding);
  };

  const getY_T = (val: number) => {
    return chartHeight - chartPadding - ((val - minT) / rangeT) * (chartHeight - 2 * chartPadding);
  };

  // Generar trazados de curvas
  const ctlPath = historyPoints.length >= 2 ? `M ${ctlValues.map((val, i) => `${getX(i, historyPoints.length).toFixed(1)},${getY_L(val).toFixed(1)}`).join(' L ')}` : '';
  const atlPath = historyPoints.length >= 2 ? `M ${atlValues.map((val, i) => `${getX(i, historyPoints.length).toFixed(1)},${getY_L(val).toFixed(1)}`).join(' L ')}` : '';
  const tsbPath = historyPoints.length >= 2 ? `M ${tsbValues.map((val, i) => `${getX(i, historyPoints.length).toFixed(1)},${getY_T(val).toFixed(1)}`).join(' L ')}` : '';
  const tsbAreaPath = historyPoints.length >= 2 ? `M ${getX(0, historyPoints.length).toFixed(1)},${getY_T(0).toFixed(1)} L ${tsbValues.map((val, i) => `${getX(i, historyPoints.length).toFixed(1)},${getY_T(val).toFixed(1)}`).join(' L ')} L ${getX(historyPoints.length - 1, historyPoints.length).toFixed(1)},${getY_T(0).toFixed(1)} Z` : '';
 
  return (
    <Link href="/analytics" className="block group w-full h-full cursor-pointer">
      <div className={`p-5 sm:p-6 rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50/30 ${borderHoverClass} shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between h-full min-h-[320px] relative overflow-hidden`}>
        
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-2 relative z-10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center shadow-sm shrink-0">
              {isBeginner ? (
                <Calendar className={`w-4 h-4 ${color}`} />
              ) : (
                <Zap className={`w-4 h-4 ${color}`} />
              )}
            </div>
            <h3 className="text-xs font-bold text-zinc-450 tracking-wider uppercase">
              {isBeginner ? 'Constancia Semanal' : 'Estado de Forma'}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
              {isBeginner ? 'Ver guía' : 'Análisis'}
            </span>
            <ArrowRight className="w-3 h-3 text-zinc-400 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
        
        {/* Visualización Central - Dial SVG */}
        <div className="flex-1 flex flex-col items-center justify-center py-1.5 relative z-10 shrink-0">
          <div className={`relative ${showChart ? 'w-22 h-22' : 'w-28 h-28'} flex items-center justify-center`}>
            {/* SVG del Dial */}
            <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="formOptimalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="formBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
                <linearGradient id="formOverloadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
                <linearGradient id="formRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#e11d48" />
                </linearGradient>
                <linearGradient id="formGrayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9ca3af" />
                  <stop offset="100%" stopColor="#d1d5db" />
                </linearGradient>
              </defs>
 
              {/* Círculo de fondo (pista tacómetro) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-zinc-100"
                strokeWidth="4"
                strokeDasharray="4 3"
                fill="transparent"
              />
              
              {/* Círculo activo coloreado */}
              <motion.circle
                cx="50"
                cy="50"
                r={radius}
                stroke={`url(#${gradientId})`}
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
 
            {/* Texto interior del dial */}
            <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
              <span className={`${showChart ? 'text-xl' : 'text-2xl'} font-black text-zinc-900 leading-none tracking-tight`}>
                {isBeginner ? `${safeProgressPercent}%` : (safeTsb > 0 ? `+${safeTsb}` : safeTsb)}
              </span>
              <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5">
                {isBeginner ? 'constancia' : 'balance'}
              </span>
            </div>
          </div>

          {/* Gráfico de tendencia PMC de 7 días (Solo para atletas intermedios/avanzados) */}
          {showChart && (
            <div className="w-full mt-3 border-t border-zinc-100 pt-2">
              <div style={{ height: `${chartHeight}px`, width: '100%' }}>
                <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                  {/* Línea de referencia Cero */}
                  <line x1="0" y1={getY_T(0)} x2={chartWidth} y2={getY_T(0)} stroke="#e4e4e7" strokeWidth="1" strokeDasharray="3 2" />
                  
                  {/* Curva de Forma (TSB Area) */}
                  <path d={tsbAreaPath} fill="#10b981" fillOpacity="0.08" />
                  
                  {/* Curva de Fitness (CTL - azul) */}
                  <path d={ctlPath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                  
                  {/* Curva de Fatiga (ATL - rojo) */}
                  <path d={atlPath} fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
                  
                  {/* Curva de Forma (TSB - verde) */}
                  <path d={tsbPath} fill="none" stroke="#10b981" strokeWidth="2.0" strokeLinecap="round" strokeDasharray="3 3" />
                </svg>
              </div>

              {/* Leyenda en miniatura */}
              <div className="flex justify-between items-center text-[8px] font-bold text-zinc-500 mt-1 uppercase tracking-wider px-1">
                <span className="text-[#3b82f6]">CTL (Fit): {ctl}</span>
                <span className="text-[#ef4444]">ATL (Fat): {atl}</span>
                <span className={safeTsb >= 0 ? 'text-[#10b981]' : 'text-amber-500'}>TSB (Form): {safeTsb}</span>
              </div>
            </div>
          )}
        </div>
 
        {/* Textos inferiores del estado */}
        <div className="relative z-10 mt-2 shrink-0">
          <div className="flex items-baseline gap-2">
            <span className={`text-base font-black tracking-tight ${color}`}>
              {label}
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-semibold mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
