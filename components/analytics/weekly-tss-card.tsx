'use client';

import * as React from 'react';
import { ProCard } from '@/components/ui/pro-card';
import { HelpCircle } from 'lucide-react';

interface WeeklyTssCardProps {
  actualTss: number;
  targetTss: number;
  athleteLevel?: string;
}

export function WeeklyTssCard({ actualTss, targetTss, athleteLevel = 'intermedio' }: WeeklyTssCardProps) {
  const isBeginner = athleteLevel === 'principiante';
  const [showHelp, setShowHelp] = React.useState(false);

  // Convert TSS to approximate training hours: 60 TSS is roughly 1 hour at moderate intensity, multiplied by an aerobic factor
  const actualHours = React.useMemo(() => {
    return Math.round((actualTss / 60 * 1.25) * 10) / 10;
  }, [actualTss]);

  const targetHours = React.useMemo(() => {
    const hours = Math.round((targetTss / 60 * 1.25) * 10) / 10;
    return hours > 0 ? hours : 5.0; // Default fallback to 5 hours meta for beginners
  }, [targetTss]);

  const percent = React.useMemo(() => {
    if (isBeginner) {
      if (!targetHours) return 0;
      return Math.round((actualHours / targetHours) * 100);
    }
    if (!targetTss) return 0;
    return Math.round((actualTss / targetTss) * 100);
  }, [actualTss, targetTss, actualHours, targetHours, isBeginner]);

  const statusInfo = React.useMemo(() => {
    if (percent < 70) {
      return {
        label: isBeginner ? 'Progreso Inicial' : 'Recuperación / Carga Baja',
        color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
        barColor: 'bg-cyan-500'
      };
    } else if (percent <= 110) {
      return {
        label: isBeginner ? 'Volumen Óptimo' : 'Carga Óptima',
        color: 'text-emerald-700 bg-emerald-50 border-emerald-250',
        barColor: 'bg-emerald-500'
      };
    } else {
      return {
        label: isBeginner ? 'Volumen Elevado' : 'Sobrecarga / Pico de Estrés',
        color: 'text-rose-700 bg-rose-50 border-rose-200',
        barColor: 'bg-rose-500'
      };
    }
  }, [percent, isBeginner]);

  return (
    <ProCard className="relative flex flex-col justify-between space-y-6 md:col-span-1 overflow-hidden">
      {/* Help Overlay */}
      {showHelp && (
        <div className="absolute inset-0 bg-white/95 border border-zinc-200 rounded-xl p-5 flex flex-col justify-between z-20 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 shadow-lg">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-cyan-650 uppercase tracking-widest">
              {isBeginner ? '¿Qué es el Tiempo Semanal?' : '¿Qué es el Progreso de TSS?'}
            </h4>
            <p className="text-[11px] text-zinc-650 leading-relaxed">
              {isBeginner ? (
                <>
                  Suma la duración estimada de todas tus sesiones de entrenamiento de la semana actual.
                  <br /><br />
                  La clave para terminar tu primer triatlón con éxito y sin lesiones es la constancia y el volumen acumulado de forma segura, no entrenar a intensidades extremas.
                </>
              ) : (
                <>
                  El **TSS (Training Stress Score)** cuantifica el esfuerzo fisiológico de tus entrenamientos (duración x intensidad).
                  <br /><br />
                  Este panel suma tu TSS de lunes a domingo. Te ayuda a controlar que no acumules carga de golpe (evitando lesiones) y que cumplas con la dosis semanal óptima diseñada por el plan.
                </>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="text-[10px] font-bold text-zinc-500 hover:text-zinc-800 uppercase tracking-wider text-right w-full pt-4 cursor-pointer"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Encabezado */}
      <div className="flex justify-between items-start border-b border-[var(--color-border)] pb-6 relative z-10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {isBeginner ? 'Tiempo Semanal Acumulado' : 'Carga Semanal Acumulada'}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <h3 className="text-2xl font-light text-zinc-900">
              {isBeginner ? 'Horas de Entrenamiento' : 'Progreso de TSS'}
            </h3>
            <button
              onClick={() => setShowHelp(true)}
              className="text-zinc-500 hover:text-cyan-550 transition-colors p-0.5 cursor-pointer"
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
            <span className="text-5xl font-light tracking-tight text-zinc-900">
              {isBeginner ? actualHours : actualTss}
            </span>
            <span className="text-xl font-light text-zinc-500">
              / {isBeginner ? `${targetHours} h` : `${targetTss} TSS`}
            </span>
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            {percent}% {isBeginner ? 'de las horas semanales completadas' : 'del objetivo semanal completado'}
          </p>
        </div>
      </div>

      {/* Barra de Progreso Visual */}
      <div className="space-y-2 pt-4">
        <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden p-0.5 border border-zinc-200">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${statusInfo.barColor}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-500 font-medium px-1 uppercase tracking-wider">
          <span>0 {isBeginner ? 'horas' : 'TSS'}</span>
          <span>Meta ({isBeginner ? `${targetHours} h` : targetTss})</span>
        </div>
      </div>

      {/* Consejo de Entrenamiento */}
      <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200 mt-4">
        <p className="text-xs text-zinc-600 leading-relaxed">
          {isBeginner ? (
            <>
              <strong className="text-zinc-800">Consejo de Constancia:</strong> Distribuir tus horas a lo largo de la semana de forma regular es infinitamente mejor que intentar hacer entrenamientos largos de golpe. ¡Disfruta del camino!
            </>
          ) : (
            <>
              <strong className="text-zinc-800">Consejo de Carga:</strong> El TSS mide tanto la duración como la intensidad. Mantener el cumplimiento entre el 90% y 110% asegura adaptaciones aeróbicas óptimas sin riesgo de lesión.
            </>
          )}
        </p>
      </div>
    </ProCard>
  );
}
