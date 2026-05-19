'use client';

import * as React from 'react';
import { ProCard } from '@/components/ui/pro-card';
import { HelpCircle } from 'lucide-react';

interface SportDistributionCardProps {
  distribution: {
    natacion: { tss: number; percentage: number };
    ciclismo: { tss: number; percentage: number };
    carrera: { tss: number; percentage: number };
  };
}

export function SportDistributionCard({ distribution }: SportDistributionCardProps) {
  const [showHelp, setShowHelp] = React.useState(false);
  const { natacion, ciclismo, carrera } = distribution;

  // Calcular offsets para el SVG Donut
  const totalTss = natacion.tss + ciclismo.tss + carrera.tss || 1;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  const swimStroke = (natacion.tss / totalTss) * circumference;
  const bikeStroke = (ciclismo.tss / totalTss) * circumference;
  const runStroke = (carrera.tss / totalTss) * circumference;

  const swimOffset = circumference;
  const bikeOffset = circumference - swimStroke;
  const runOffset = circumference - swimStroke - bikeStroke;

  return (
    <ProCard className="relative flex flex-col justify-between space-y-6 md:col-span-1 overflow-hidden">
      {/* Help Overlay */}
      {showHelp && (
        <div className="absolute inset-0 bg-zinc-950/95 border border-cyan-500/20 rounded-xl p-5 flex flex-col justify-between z-20 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
              ¿Qué es la Distribución de Esfuerzo?
            </h4>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Muestra el porcentaje del esfuerzo físico total (**TSS**) que has dedicado a cada deporte durante esta semana:
              <br /><br />
              • <strong className="text-purple-400">Natación 🟣</strong>
              <br />
              • <strong className="text-sky-400">Ciclismo 🔵</strong>
              <br />
              • <strong className="text-emerald-400">Carrera a Pie 🟢</strong>
              <br /><br />
              Te sirve para verificar visualmente que tu volumen e intensidad por deporte coincidan con el balance planificado para tus objetivos de triatlón.
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
            Desglose de Disciplinas
          </span>
          <div className="flex items-center gap-2 mt-1">
            <h3 className="text-2xl font-light text-zinc-50">
              Distribución de Esfuerzo
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
        <span className="text-xs font-medium px-3 py-1 rounded-full border text-zinc-400 bg-zinc-900/50 border-zinc-800">
          TSS Semanal
        </span>
      </div>

      {/* Gráfico Donut y Leyenda */}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
        {/* Contenedor del Anillo SVG */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Círculo de fondo */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#27272a"
              strokeWidth="12"
            />

            {/* Segmento Natación (Morado) */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#c084fc"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={swimOffset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />

            {/* Segmento Ciclismo (Azul) */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#38bdf8"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={bikeOffset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />

            {/* Segmento Carrera (Verde) */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="transparent"
              stroke="#34d399"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={runOffset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>

          {/* Texto Central */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-light text-zinc-50">
              {natacion.tss + ciclismo.tss + carrera.tss}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
              TSS Total
            </span>
          </div>
        </div>

        {/* Leyenda de Disciplinas */}
        <div className="space-y-4 w-full sm:w-auto">
          {/* Ciclismo */}
          <div className="flex items-center justify-between sm:justify-start gap-4 bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/60 min-w-[160px]">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-sky-400" />
              <span className="text-sm font-medium text-zinc-300">Ciclismo</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-zinc-100">
                {ciclismo.percentage}%
              </span>
              <span className="text-xs text-zinc-500 block">{ciclismo.tss} TSS</span>
            </div>
          </div>

          {/* Carrera */}
          <div className="flex items-center justify-between sm:justify-start gap-4 bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/60 min-w-[160px]">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-sm font-medium text-zinc-300">Carrera</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-zinc-100">
                {carrera.percentage}%
              </span>
              <span className="text-xs text-zinc-500 block">{carrera.tss} TSS</span>
            </div>
          </div>

          {/* Natación */}
          <div className="flex items-center justify-between sm:justify-start gap-4 bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/60 min-w-[160px]">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-purple-400" />
              <span className="text-sm font-medium text-zinc-300">Natación</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-zinc-100">
                {natacion.percentage}%
              </span>
              <span className="text-xs text-zinc-500 block">{natacion.tss} TSS</span>
            </div>
          </div>
        </div>
      </div>
    </ProCard>
  );
}
