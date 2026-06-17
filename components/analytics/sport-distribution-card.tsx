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
  weeklyDistance: {
    natacion: number; // metros
    ciclismo: number; // km
    carrera: number; // km
  };
}

export function SportDistributionCard({ distribution, weeklyDistance }: SportDistributionCardProps) {
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
        <div className="absolute inset-0 bg-white/95 border border-zinc-200 rounded-xl p-5 flex flex-col justify-between z-20 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 shadow-lg">
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-cyan-650 uppercase tracking-widest">
              ¿Qué es la Distribución de Esfuerzo?
            </h4>
            <p className="text-[11px] text-zinc-650 leading-relaxed">
              Muestra el porcentaje del esfuerzo físico total (**TSS**) y el volumen real (**distancia**) que has dedicado a cada deporte durante esta semana:
              <br /><br />
              • <strong className="text-purple-750">Natación 🟣</strong> (en metros)
              <br />
              • <strong className="text-sky-650">Ciclismo 🔵</strong> (en kilómetros)
              <br />
              • <strong className="text-emerald-750">Carrera a Pie 🟢</strong> (en kilómetros)
              <br /><br />
              Te sirve para verificar visualmente que tu volumen e intensidad por deporte coincidan con el balance planificado para tus objetivos de triatlón.
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
            Desglose de Disciplinas
          </span>
          <div className="flex items-center gap-2 mt-1">
            <h3 className="text-2xl font-light text-zinc-900">
              Distribución de Esfuerzo
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
        <span className="text-xs font-medium px-3 py-1 rounded-full border text-zinc-600 bg-zinc-50 border-zinc-200">
          Volumen Semanal
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
              stroke="#e4e4e7"
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
            <span className="text-2xl font-light text-zinc-900">
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
          <div className="flex items-center justify-between sm:justify-start gap-4 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 min-w-[170px]">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-sky-400" />
              <span className="text-sm font-medium text-zinc-700">Ciclismo</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-zinc-900">
                {ciclismo.percentage}%
              </span>
              <span className="text-xs text-zinc-500 block">
                {ciclismo.tss} TSS • <strong className="text-sky-600">{weeklyDistance.ciclismo} km</strong>
              </span>
            </div>
          </div>

          {/* Carrera */}
          <div className="flex items-center justify-between sm:justify-start gap-4 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 min-w-[170px]">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-sm font-medium text-zinc-700">Carrera</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-zinc-900">
                {carrera.percentage}%
              </span>
              <span className="text-xs text-zinc-500 block">
                {carrera.tss} TSS • <strong className="text-emerald-700">{weeklyDistance.carrera} km</strong>
              </span>
            </div>
          </div>

          {/* Natación */}
          <div className="flex items-center justify-between sm:justify-start gap-4 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 min-w-[170px]">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-purple-400" />
              <span className="text-sm font-medium text-zinc-700">Natación</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-zinc-900">
                {natacion.percentage}%
              </span>
              <span className="text-xs text-zinc-500 block">
                {natacion.tss} TSS • <strong className="text-purple-700">{weeklyDistance.natacion} m</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </ProCard>
  );
}
