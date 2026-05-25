'use client';

import * as React from 'react';
import { ZonePoint } from '@/app/analytics/analytics-actions';
import { ProCard } from '@/components/ui/pro-card';
import { ShieldAlert, Flame } from 'lucide-react';

interface TrainingZonesCardProps {
  zones: ZonePoint[];
  athleteLevel?: string;
}

export function TrainingZonesCard({ zones, athleteLevel = 'intermedio' }: TrainingZonesCardProps) {
  const isBeginner = athleteLevel === 'principiante';

  return (
    <ProCard className="flex flex-col justify-between space-y-6">
      {/* Cabecera */}
      <div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Zonas de Entrenamiento
          </h2>
        </div>
        <h3 className="text-2xl font-light text-zinc-50 mt-1">
          Distribución de Intensidad (Z1-Z5)
        </h3>
        <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
          {isBeginner
            ? 'La mayor parte de tu entrenamiento debe ser a intensidad baja (Zona 2) para asimilar la base aeróbica con total seguridad.'
            : 'Mide la distribución real de tus esfuerzos. Idealmente debes seguir una estructura de entrenamiento polarizada (80/20).'}
        </p>
      </div>

      {/* Barras de distribución */}
      <div className="space-y-4 flex-1 justify-center flex flex-col">
        {zones.map((z, idx) => {
          const barColorMap: Record<number, string> = {
            0: 'bg-zinc-650 border-zinc-500/30',
            1: 'bg-[var(--color-swim)] border-[var(--color-swim)]/30',
            2: 'bg-amber-500 border-amber-500/30',
            3: 'bg-orange-500 border-orange-500/30',
            4: 'bg-red-500 border-red-500/30',
          };

          const textColorMap: Record<number, string> = {
            0: 'text-zinc-400',
            1: 'text-[var(--color-swim)]',
            2: 'text-amber-400',
            3: 'text-orange-400',
            4: 'text-red-400',
          };

          return (
            <div key={idx} className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className={`font-semibold ${textColorMap[idx] || 'text-zinc-300'}`}>{z.zone}</span>
                <div className="flex gap-2 items-center text-zinc-400 font-medium">
                  <span>{z.hours} hrs</span>
                  <span className="text-[10px] text-zinc-600">•</span>
                  <span className="text-zinc-200 font-bold">{z.percentage}%</span>
                </div>
              </div>
              <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900 shadow-inner">
                <div 
                  className={`h-full rounded-full border-r ${barColorMap[idx] || 'bg-cyan-500'} transition-all duration-1000 ease-out`}
                  style={{ width: `${z.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Nota de Recomendación Científica */}
      <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/10 flex gap-3 items-start">
        {isBeginner ? (
          <>
            <Flame className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-cyan-200/80 leading-relaxed">
              <strong>Consejo de Salud:</strong> Un {zones[1]?.percentage || 75}% en Zona 2 indica que tu corazón está asimilando el esfuerzo sin estrés cardiovascular excesivo. ¡Sigue así!
            </p>
          </>
        ) : (
          <>
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              <strong>Control de Intensidad:</strong> Asegúrate de que las zonas de alta intensidad (Z4 y Z5) no superen el 10% del volumen semanal total para evitar fatiga crónica y lesiones.
            </p>
          </>
        )}
      </div>
    </ProCard>
  );
}
