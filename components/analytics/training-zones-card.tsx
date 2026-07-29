'use client';

import * as React from 'react';
import { ZonePoint } from '@/app/(app)/analytics/analytics-actions';
import { ShieldAlert, Flame, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface TrainingZonesCardProps {
  zones: ZonePoint[];
  athleteLevel?: string;
}

// Map zones to exact brand/pro colors
const getZoneTheme = (idx: number) => {
  switch(idx) {
    case 0: return { bg: 'bg-bg-hover', text: 'text-text-secondary', border: 'border-border-default/30', hex: '#a1a1aa' }; // Z1 - Recovery
    case 1: return { bg: 'bg-sky-500', text: 'text-sky-600', border: 'border-sky-500/30', hex: '#0ea5e9' }; // Z2 - Base (Swim Blue)
    case 2: return { bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-500/30', hex: '#10b981' }; // Z3 - Tempo (Bike Green)
    case 3: return { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-500/30', hex: '#f59e0b' }; // Z4 - Threshold (Yellow)
    case 4: return { bg: 'bg-rose-500', text: 'text-rose-600', border: 'border-rose-500/30', hex: '#f43f5e' }; // Z5 - VO2 (Run Red)
    default: return { bg: 'bg-bg-hover', text: 'text-text-muted', border: 'border-border-default/30', hex: '#71717a' };
  }
};

export function TrainingZonesCard({ zones, athleteLevel = 'intermedio' }: TrainingZonesCardProps) {
  const isBeginner = athleteLevel === 'principiante';
  
  // Calculate total hours to ensure percentages add up precisely visually
  const totalPercentage = zones.reduce((acc, curr) => acc + curr.percentage, 0);

  return (
    <div className="bg-white rounded-xl border border-border-subtle overflow-hidden flex flex-col font-sans">
      
      {/* HEADER TÉCNICO */}
      <div className="flex justify-between items-center px-5 py-4 border-b border-border-subtle bg-bg-elevated">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-rose-50 border border-rose-200 flex items-center justify-center">
            <Activity className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-text-primary tracking-tight flex items-center gap-2">
              Distribución de Esfuerzo (Time in Zones)
            </h2>
            <p className="text-[11px] text-text-muted font-medium">Frecuencia Cardíaca / Potencia</p>
          </div>
        </div>
        <div className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
          80/20 Rule Analysis
        </div>
      </div>

      <div className="p-5 flex flex-col md:flex-row gap-8">
        {/* Lado Izquierdo: Gráfico de Barras Apiladas Ultra Pro */}
        <div className="flex-1 flex flex-col justify-center">
          
          {/* Stacked Bar Principal (Total Overview) */}
          <div className="mb-6">
            <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
              <span>Baja Intensidad (Z1-Z2)</span>
              <span>Alta Intensidad (Z3-Z5)</span>
            </div>
            <div className="w-full h-8 bg-bg-hover rounded-lg overflow-hidden flex border border-border-subtle">
              {zones.map((z, idx) => {
                if (z.percentage === 0) return null;
                const theme = getZoneTheme(idx);
                return (
                  <motion.div 
                    key={`stack-${idx}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(z.percentage / totalPercentage) * 100}%` }}
                    transition={{ duration: 1, delay: idx * 0.1, ease: "easeOut" }}
                    className={`h-full ${theme.bg} border-r border-white/20 relative group`}
                    title={`${z.zone}: ${z.percentage}%`}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-card text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      {z.percentage}%
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {/* Regla del 80/20 Marker */}
            <div className="relative w-full h-2 mt-1">
              <div className="absolute left-[80%] -top-2 bottom-0 w-px bg-bg-hover border-r border-dashed border-border-subtle"></div>
              <div className="absolute left-[80%] top-2 -translate-x-1/2 text-[9px] text-text-muted font-bold">80% Límite Aeróbico</div>
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
                      <span className="text-text-muted tabular-nums">{z.hours} hrs</span>
                      <span className="text-[10px] text-text-muted">•</span>
                      <span className="text-text-primary font-bold tabular-nums">{z.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-bg-hover border border-border-subtle/50 rounded-full overflow-hidden">
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
          <div className="p-4 rounded-xl bg-bg-elevated border border-border-subtle h-full flex flex-col justify-center">
            
            <div className="flex items-center gap-2 mb-3">
              {isBeginner ? <Flame className="w-4 h-4 text-sky-600" /> : <ShieldAlert className="w-4 h-4 text-amber-600" />}
              <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">Coach Insight</span>
            </div>
            
            <p className="text-xs text-text-secondary leading-relaxed">
              {isBeginner 
                ? 'El entrenamiento polarizado requiere disciplina. Mantener la intensidad baja construye los cimientos cardiovasculares.' 
                : 'La regla del 80/20 indica que el 80% del tiempo debe pasarse en Z1/Z2. El 20% restante en Z4/Z5. Evita acumular fatiga en la "zona gris" (Z3).'}
            </p>

            <div className="mt-4 pt-4 border-t border-border-subtle">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-text-muted font-medium">Cumplimiento 80/20</span>
                <span className="text-xs font-bold text-text-primary">
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
