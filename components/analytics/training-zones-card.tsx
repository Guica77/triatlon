'use client';

import * as React from 'react';
import { ZonePoint } from '@/app/analytics/analytics-actions';
import { ShieldAlert, Flame, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface TrainingZonesCardProps {
  zones: ZonePoint[];
  athleteLevel?: string;
}

// Map zones to exact brand/pro colors
const getZoneTheme = (idx: number) => {
  switch(idx) {
    case 0: return { bg: 'bg-slate-500', text: 'text-slate-400', border: 'border-slate-500/30', hex: '#64748b' }; // Z1 - Recovery
    case 1: return { bg: 'bg-[#38bdf8]', text: 'text-[#38bdf8]', border: 'border-[#38bdf8]/30', hex: '#38bdf8' }; // Z2 - Base (Swim Blue)
    case 2: return { bg: 'bg-[#a3e635]', text: 'text-[#a3e635]', border: 'border-[#a3e635]/30', hex: '#a3e635' }; // Z3 - Tempo (Bike Green)
    case 3: return { bg: 'bg-[#facc15]', text: 'text-[#facc15]', border: 'border-[#facc15]/30', hex: '#facc15' }; // Z4 - Threshold (Yellow)
    case 4: return { bg: 'bg-[#fb7185]', text: 'text-[#fb7185]', border: 'border-[#fb7185]/30', hex: '#fb7185' }; // Z5 - VO2 (Run Red)
    default: return { bg: 'bg-zinc-500', text: 'text-zinc-500', border: 'border-zinc-500/30', hex: '#71717a' };
  }
};

export function TrainingZonesCard({ zones, athleteLevel = 'intermedio' }: TrainingZonesCardProps) {
  const isBeginner = athleteLevel === 'principiante';
  
  // Calculate total hours to ensure percentages add up precisely visually
  const totalPercentage = zones.reduce((acc, curr) => acc + curr.percentage, 0);

  return (
    <div className="bg-[#020617] rounded-xl border border-slate-800/60 overflow-hidden flex flex-col font-sans shadow-xl">
      
      {/* HEADER TÉCNICO */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-slate-800/60 bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200 tracking-tight flex items-center gap-2">
              Distribución de Esfuerzo (Time in Zones)
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">Frecuencia Cardíaca / Potencia</p>
          </div>
        </div>
        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
          80/20 Rule Analysis
        </div>
      </div>

      <div className="p-5 flex flex-col md:flex-row gap-8">
        {/* Lado Izquierdo: Gráfico de Barras Apiladas Ultra Pro */}
        <div className="flex-1 flex flex-col justify-center">
          
          {/* Stacked Bar Principal (Total Overview) */}
          <div className="mb-6">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              <span>Baja Intensidad (Z1-Z2)</span>
              <span>Alta Intensidad (Z3-Z5)</span>
            </div>
            <div className="w-full h-8 bg-slate-900 rounded-lg overflow-hidden flex border border-slate-800/80 shadow-inner">
              {zones.map((z, idx) => {
                if (z.percentage === 0) return null;
                const theme = getZoneTheme(idx);
                return (
                  <motion.div 
                    key={`stack-${idx}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(z.percentage / totalPercentage) * 100}%` }}
                    transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                    className={`h-full ${theme.bg} border-r border-slate-900/50 relative group`}
                    title={`${z.zone}: ${z.percentage}%`}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      {z.percentage}%
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {/* Regla del 80/20 Marker */}
            <div className="relative w-full h-2 mt-1">
              <div className="absolute left-[80%] -top-2 bottom-0 w-px bg-slate-500/50 border-r border-dashed border-slate-400"></div>
              <div className="absolute left-[80%] top-2 -translate-x-1/2 text-[9px] text-slate-500 font-bold">80% Límite Aeróbico</div>
            </div>
          </div>

          {/* Desglose Detallado */}
          <div className="space-y-3">
            {zones.map((z, idx) => {
              const theme = getZoneTheme(idx);
              return (
                <div key={idx} className="group relative">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className={`font-bold ${theme.text} tracking-tight`}>{z.zone}</span>
                    <div className="flex gap-2 items-center font-medium">
                      <span className="text-slate-400 tabular-nums">{z.hours} hrs</span>
                      <span className="text-[10px] text-slate-600">•</span>
                      <span className="text-white font-black tabular-nums">{z.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${z.percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${theme.bg}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Lado Derecho: Insight / AI Analysis */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 h-full flex flex-col justify-center">
            
            <div className="flex items-center gap-2 mb-3">
              {isBeginner ? <Flame className="w-4 h-4 text-[#38bdf8]" /> : <ShieldAlert className="w-4 h-4 text-[#facc15]" />}
              <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Coach Insight</span>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              {isBeginner 
                ? 'El entrenamiento polarizado requiere disciplina. Mantener la intensidad baja construye los cimientos cardiovasculares.' 
                : 'La regla del 80/20 indica que el 80% del tiempo debe pasarse en Z1/Z2. El 20% restante en Z4/Z5. Evita acumular fatiga en la "zona gris" (Z3).'}
            </p>

            <div className="mt-4 pt-4 border-t border-slate-800/60">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-medium">Cumplimiento 80/20</span>
                <span className="text-xs font-bold text-white">
                  {zones[0].percentage + zones[1].percentage}% / {zones[3].percentage + zones[4].percentage}%
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
