'use client';

import * as React from 'react';
import { ProCard } from '@/components/ui/pro-card';
import { HelpCircle } from 'lucide-react';

interface WeeklyTssCardProps {
  actualTss: number;
  targetTss: number;
}

export function WeeklyTssCard({ actualTss, targetTss }: WeeklyTssCardProps) {
  const [showHelp, setShowHelp] = React.useState(false);

  const percent = React.useMemo(() => {
    if (!targetTss) return 0;
    return Math.round((actualTss / targetTss) * 100);
  }, [actualTss, targetTss]);

  const statusInfo = React.useMemo(() => {
    if (percent < 70) {
      return {
        label: 'Recuperación / Carga Baja',
        color: 'text-cyan-400 bg-cyan-950/30 border-cyan-500/30',
        barColor: 'bg-cyan-500'
      };
    } else if (percent <= 110) {
      return {
        label: 'Carga Óptima',
        color: 'text-emerald-400 bg-emerald-950/30 border-emerald-500/30',
        barColor: 'bg-emerald-500'
      };
    } else {
      return {
        label: 'Sobrecarga / Pico de Estrés',
        color: 'text-rose-400 bg-rose-950/30 border-rose-500/30',
        barColor: 'bg-rose-500'
      };
    }
  }, [percent]);

  return (
    <ProCard className="relative flex flex-col justify-between space-y-6 md:col-span-1 overflow-hidden">
      {/* Help Overlay */}
      {showHelp && (
        <div className="absolute inset-0 bg-zinc-950/95 border border-cyan-500/20 rounded-xl p-5 flex flex-col justify-between z-20 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
              ¿Qué es el Progreso de TSS?
            </h4>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              El **TSS (Training Stress Score)** cuantifica el esfuerzo fisiológico de tus entrenamientos (duración x intensidad).
              <br /><br />
              Este panel suma tu TSS de lunes a domingo. Te ayuda a controlar que no acumules carga de golpe (evitando lesiones) y que cumplas con la dosis semanal óptima diseñada por el plan.
            </p>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="text-[10px] font-bold text-zinc-400 hover:text-white uppercase tracking-wider text-right w-full pt-4"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex justify-between items-start border-b border-[var(--color-border)] pb-6 relative z-10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Carga Semanal Acumulada
          </span>
          <div className="flex items-center gap-2 mt-1">
            <h3 className="text-2xl font-light text-zinc-50">
              Progreso de TSS
            </h3>
            <button
              onClick={() => setShowHelp(true)}
              className="text-zinc-500 hover:text-cyan-400 transition-colors p-0.5"
              title="¿Qué es esto?"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
        <span
          className={`text-xs font-medium px-3 py-1 rounded-full border ${statusInfo.color}`}
        >
          {statusInfo.label}
        </span>
      </div>

      {/* Números Principales */}
      <div className="flex items-baseline justify-between pt-2">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-light tracking-tight text-zinc-50">
              {actualTss}
            </span>
            <span className="text-xl font-light text-zinc-500">
              / {targetTss} TSS
            </span>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            {percent}% del objetivo semanal completado
          </p>
        </div>
      </div>

      {/* Barra de Progreso Visual */}
      <div className="space-y-2 pt-4">
        <div className="h-4 w-full bg-zinc-950/60 rounded-full overflow-hidden p-0.5 border border-zinc-800/80">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${statusInfo.barColor}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-500 font-medium px-1 uppercase tracking-wider">
          <span>0 TSS</span>
          <span>Meta ({targetTss})</span>
        </div>
      </div>

      {/* Consejo de Entrenamiento */}
      <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/60 mt-4">
        <p className="text-xs text-zinc-400 leading-relaxed">
          <strong className="text-zinc-200">Consejo de Carga:</strong> El TSS mide tanto la duración como la intensidad. Mantener el cumplimiento entre el 90% y 110% asegura adaptaciones aeróbicas óptimas sin riesgo de lesión.
        </p>
      </div>
    </ProCard>
  );
}
