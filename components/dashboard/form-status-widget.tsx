'use client';

import * as React from 'react';
import { Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface FormStatusWidgetProps {
  tsb: number;
}

export function FormStatusWidget({ tsb }: FormStatusWidgetProps) {
  let label = '';
  let description = '';
  let color = '';
  let bgClass = '';
  
  if (tsb > 25) {
    label = 'Pérdida de Forma';
    description = 'Demasiado descanso, perdiendo condición.';
    color = 'text-zinc-400';
    bgClass = 'bg-zinc-500/10 border-zinc-500/20';
  } else if (tsb >= 5) {
    label = 'Pico de Forma';
    description = 'Frescura alta. Listo para competir.';
    color = 'text-emerald-400';
    bgClass = 'bg-emerald-500/10 border-emerald-500/20';
  } else if (tsb >= -10) {
    label = 'Entrenamiento Óptimo';
    description = 'Asimilando cargas correctamente.';
    color = 'text-blue-400';
    bgClass = 'bg-blue-500/10 border-blue-500/20';
  } else if (tsb >= -25) {
    label = 'Sobrecarga Controlada';
    description = 'Semana de impacto. La fatiga es alta.';
    color = 'text-yellow-400';
    bgClass = 'bg-yellow-500/10 border-yellow-500/20';
  } else {
    label = 'Alerta de Fatiga';
    description = 'Riesgo de lesión. Considera descansar.';
    color = 'text-red-400';
    bgClass = 'bg-red-500/10 border-red-500/20';
  }

  return (
    <Link href="/analytics" className="block group w-full h-full">
      <div className={`p-4 sm:p-5 rounded-2xl border ${bgClass} shadow-lg transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between h-full relative overflow-hidden`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className={`w-5 h-5 ${color} fill-current/20`} />
            <h3 className="text-sm font-bold text-white tracking-tight">Estado de Forma</h3>
          </div>
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-zinc-400 font-medium">Ver PMC</span>
            <ArrowRight className="w-3 h-3 text-zinc-400" />
          </div>
        </div>
        
        <div>
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className={`text-xl font-black ${color}`}>{label}</span>
          </div>
          <p className="text-xs text-zinc-400 line-clamp-1">{description}</p>
        </div>
      </div>
    </Link>
  );
}
