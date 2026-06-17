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
 
  // Protecciones para evitar NaN
  const safeTsb = typeof tsb === 'number' && !isNaN(tsb) ? tsb : 0;
  const safeProgressPercent = typeof progressPercent === 'number' && !isNaN(progressPercent) ? progressPercent : 0;
  
  let label = '';
  let description = '';
  let color = '';
  let strokeColor = '';
  let bgClass = '';
  
  if (isBeginner) {
    if (safeProgressPercent < 30) {
      label = '¡Buen comienzo!';
      description = 'Sigue sumando, cada sesión cuenta para crear el hábito.';
      color = 'text-blue-500';
      strokeColor = '#3b82f6';
      bgClass = 'bg-white border-blue-200 hover:border-blue-300';
    } else if (safeProgressPercent < 70) {
      label = 'Buen camino';
      description = 'Constancia sólida esta semana. ¡Mantén el ritmo!';
      color = 'text-emerald-500';
      strokeColor = '#10b981';
      bgClass = 'bg-white border-emerald-200 hover:border-emerald-300';
    } else {
      label = '¡Constancia Impecable!';
      description = 'Excelente adherencia al plan. Estás construyendo una gran base.';
      color = 'text-amber-500';
      strokeColor = '#f59e0b';
      bgClass = 'bg-white border-amber-250 hover:border-amber-300';
    }
  } else {
    if (safeTsb > 25) {
      label = 'Pérdida de Forma';
      description = 'Demasiado descanso, perdiendo condición.';
      color = 'text-zinc-500';
      strokeColor = '#9ca3af';
      bgClass = 'bg-white border-zinc-200 hover:border-zinc-300';
    } else if (safeTsb >= 5) {
      label = 'Pico de Forma';
      description = 'Frescura alta. Listo para competir.';
      color = 'text-emerald-500';
      strokeColor = '#10b981';
      bgClass = 'bg-white border-emerald-200 hover:border-emerald-300';
    } else if (safeTsb >= -10) {
      label = 'Entrenamiento Óptimo';
      description = 'Asimilando cargas correctamente.';
      color = 'text-blue-500';
      strokeColor = '#3b82f6';
      bgClass = 'bg-white border-blue-200 hover:border-blue-300';
    } else if (safeTsb >= -25) {
      label = 'Sobrecarga Controlada';
      description = 'Semana de impacto. La fatiga es alta.';
      color = 'text-amber-500';
      strokeColor = '#f59e0b';
      bgClass = 'bg-white border-amber-250 hover:border-amber-300';
    } else {
      label = 'Alerta de Fatiga';
      description = 'Riesgo de lesión. Considera descansar.';
      color = 'text-red-500';
      strokeColor = '#ef4444';
      bgClass = 'bg-white border-red-200 hover:border-red-300';
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
      <div className={`p-5 sm:p-6 rounded-2xl border ${bgClass} shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] flex flex-col justify-between h-full min-h-[320px] relative overflow-hidden`}>
        
        {/* Encabezado */}
        <div className="flex items-start justify-between mb-2 relative z-10 shrink-0">
          <div className="flex items-center gap-2">
            {isBeginner ? (
              <Calendar className={`w-4 h-4 ${color}`} />
            ) : (
              <Zap className={`w-4 h-4 ${color}`} />
            )}
            <h3 className="text-xs font-bold text-zinc-400 tracking-wider uppercase">
              {isBeginner ? 'Constancia Semanal' : 'Estado de Forma'}
            </h3>
          </div>
          <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-zinc-450 font-medium">
              {isBeginner ? 'Ver guía' : 'Ver análisis'}
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
                className="stroke-zinc-100"
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
                className="transition-all duration-1000 ease-out"
              />
            </svg>
 
            {/* Texto interior del dial */}
            <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
              <span className="text-2xl font-bold text-zinc-900 leading-none tracking-tight">
                {isBeginner ? `${safeProgressPercent}%` : (safeTsb > 0 ? `+${safeTsb}` : safeTsb)}
              </span>
              <span className="text-[9px] text-zinc-450 uppercase tracking-widest font-semibold mt-0.5">
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
          <p className="text-xs text-zinc-550 mt-0.5 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </Link>
  );
}
