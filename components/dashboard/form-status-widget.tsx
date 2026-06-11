'use client';

import * as React from 'react';
import { Zap, ArrowRight, Calendar } from 'lucide-react';
import Link from 'next/link';

interface FormStatusWidgetProps {
  tsb: number;
  athleteLevel?: string;
  progressPercent?: number;
}

export function FormStatusWidget({ tsb, athleteLevel, progressPercent = 0 }: FormStatusWidgetProps) {
  const isBeginner = athleteLevel === 'principiante';

  // Robust protection against NaN, null, or undefined values
  const safeTsb = typeof tsb === 'number' && !isNaN(tsb) ? tsb : 0;
  const safeProgressPercent = typeof progressPercent === 'number' && !isNaN(progressPercent) ? progressPercent : 0;
  
  let label = '';
  let description = '';
  let color = '';
  let strokeColor = '';
  let bgClass = '';
  let glowClass = '';
  let dropShadowClass = '';
  
  if (isBeginner) {
    if (safeProgressPercent < 30) {
      label = '¡Buen comienzo!';
      description = 'Sigue sumando, cada sesión cuenta para crear el hábito.';
      color = 'text-blue-400';
      strokeColor = '#60a5fa';
      glowClass = 'bg-[radial-gradient(circle_80px_at_50%_50%,rgba(96,165,250,0.15),transparent)]';
      dropShadowClass = 'drop-shadow-[0_0_4px_#60a5fa40]';
      bgClass = 'bg-zinc-950/40 border-blue-500/20 hover:border-blue-500/40';
    } else if (safeProgressPercent < 70) {
      label = 'Buen camino';
      description = 'Constancia sólida esta semana. ¡Mantén el ritmo!';
      color = 'text-emerald-400';
      strokeColor = '#34d399';
      glowClass = 'bg-[radial-gradient(circle_80px_at_50%_50%,rgba(52,211,153,0.15),transparent)]';
      dropShadowClass = 'drop-shadow-[0_0_4px_#34d39940]';
      bgClass = 'bg-zinc-950/40 border-emerald-500/20 hover:border-emerald-500/40';
    } else {
      label = '¡Constancia Impecable!';
      description = 'Excelente adherencia al plan. Estás construyendo una gran base.';
      color = 'text-amber-400';
      strokeColor = '#f59e0b';
      glowClass = 'bg-[radial-gradient(circle_80px_at_50%_50%,rgba(245,158,11,0.15),transparent)]';
      dropShadowClass = 'drop-shadow-[0_0_4px_#f59e0b40]';
      bgClass = 'bg-zinc-950/40 border-amber-500/20 hover:border-amber-500/40';
    }
  } else {
    if (safeTsb > 25) {
      label = 'Pérdida de Forma';
      description = 'Demasiado descanso, perdiendo condición.';
      color = 'text-zinc-400';
      strokeColor = '#a1a1aa';
      glowClass = 'bg-[radial-gradient(circle_80px_at_50%_50%,rgba(161,161,170,0.15),transparent)]';
      dropShadowClass = 'drop-shadow-[0_0_4px_#a1a1aa40]';
      bgClass = 'bg-zinc-950/40 border-zinc-800/80 hover:border-zinc-700/80';
    } else if (safeTsb >= 5) {
      label = 'Pico de Forma';
      description = 'Frescura alta. Listo para competir.';
      color = 'text-emerald-400';
      strokeColor = '#34d399';
      glowClass = 'bg-[radial-gradient(circle_80px_at_50%_50%,rgba(52,211,153,0.15),transparent)]';
      dropShadowClass = 'drop-shadow-[0_0_4px_#34d39940]';
      bgClass = 'bg-zinc-950/40 border-emerald-500/20 hover:border-emerald-500/40';
    } else if (safeTsb >= -10) {
      label = 'Entrenamiento Óptimo';
      description = 'Asimilando cargas correctamente.';
      color = 'text-blue-400';
      strokeColor = '#60a5fa';
      glowClass = 'bg-[radial-gradient(circle_80px_at_50%_50%,rgba(96,165,250,0.15),transparent)]';
      dropShadowClass = 'drop-shadow-[0_0_4px_#60a5fa40]';
      bgClass = 'bg-zinc-950/40 border-blue-500/20 hover:border-blue-500/40';
    } else if (safeTsb >= -25) {
      label = 'Sobrecarga Controlada';
      description = 'Semana de impacto. La fatiga es alta.';
      color = 'text-yellow-400';
      strokeColor = '#facc15';
      glowClass = 'bg-[radial-gradient(circle_80px_at_50%_50%,rgba(250,204,21,0.15),transparent)]';
      dropShadowClass = 'drop-shadow-[0_0_4px_#facc1540]';
      bgClass = 'bg-zinc-950/40 border-yellow-500/20 hover:border-yellow-500/40';
    } else {
      label = 'Alerta de Fatiga';
      description = 'Riesgo de lesión. Considera descansar.';
      color = 'text-red-400';
      strokeColor = '#f87171';
      glowClass = 'bg-[radial-gradient(circle_80px_at_50%_50%,rgba(248,113,113,0.15),transparent)]';
      dropShadowClass = 'drop-shadow-[0_0_4px_#f8717140]';
      bgClass = 'bg-zinc-950/40 border-red-500/20 hover:border-red-500/40';
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

  return (
    <Link href="/analytics" className="block group w-full h-full">
      <div className={`p-5 sm:p-6 rounded-2xl border ${bgClass} shadow-xl transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between h-full min-h-[320px] relative overflow-hidden backdrop-blur-md`}>
        {/* Glow de fondo dinámico en base al color del estado */}
        <div className={`absolute inset-0 pointer-events-none transition-all duration-300 opacity-30 group-hover:opacity-40 ${glowClass}`} />

        {/* Encabezado */}
        <div className="flex items-start justify-between mb-2 relative z-10 shrink-0">
          <div className="flex items-center gap-2">
            {isBeginner ? (
              <Calendar className={`w-4 h-4 ${color}`} />
            ) : (
              <Zap className={`w-4 h-4 ${color} fill-current/10`} />
            )}
            <h3 className="text-xs font-bold text-zinc-300 tracking-wider uppercase">
              {isBeginner ? 'Constancia Semanal' : 'Estado de Forma'}
            </h3>
          </div>
          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-zinc-400 font-medium">
              {isBeginner ? 'Ver guía principiantes' : 'Ver análisis'}
            </span>
            <ArrowRight className="w-3 h-3 text-zinc-400 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
        
        {/* Visualización Central - Dial SVG */}
        <div className="flex-1 flex flex-col items-center justify-center py-2 relative z-10 shrink-0">
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* SVG del Dial */}
            <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 100 100">
              {/* Círculo de fondo (pista) */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-zinc-800/60"
                strokeWidth="4"
                fill="transparent"
              />
              {/* Círculo activo coloreado */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke={strokeColor}
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className={`transition-all duration-1000 ease-out ${dropShadowClass}`}
              />
            </svg>

            {/* Texto interior del dial */}
            <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
              <span className="text-2xl font-black text-white leading-none tracking-tight">
                {isBeginner ? `${safeProgressPercent}%` : (safeTsb > 0 ? `+${safeTsb}` : safeTsb)}
              </span>
              <span className="text-[9px] text-zinc-550 uppercase tracking-widest font-semibold mt-0.5">
                {isBeginner ? 'constancia' : 'balance'}
              </span>
            </div>
          </div>
        </div>

        {/* Textos inferiores del estado */}
        <div className="relative z-10 mt-2 shrink-0">
          <div className="flex items-baseline gap-2">
            <span className={`text-base font-black tracking-tight ${color}`}>
              {label}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
