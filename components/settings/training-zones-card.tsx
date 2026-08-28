'use client';

import * as React from 'react';
import { Target, Zap, Waves, Footprints, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TrainingZonesCardProps {
  ftp: number | null;
  swimPace: string | null;
  runPace: string | null;
}

export function TrainingZonesCard({ ftp, swimPace, runPace }: TrainingZonesCardProps) {
  // Cálculo Básico Zonas Bici
  const bikeZones = ftp ? [
    { label: 'Z1 Recuperación', range: `< ${Math.round(ftp * 0.55)}W`, color: 'bg-surface-hover text-text-primary' },
    { label: 'Z2 Resistencia', range: `${Math.round(ftp * 0.56)}-${Math.round(ftp * 0.75)}W`, color: 'bg-swim/15 text-swim' },
    { label: 'Z3 Tempo', range: `${Math.round(ftp * 0.76)}-${Math.round(ftp * 0.90)}W`, color: 'bg-bike/15 text-bike' },
    { label: 'Z4 Umbral', range: `${Math.round(ftp * 0.91)}-${Math.round(ftp * 1.05)}W`, color: 'bg-warning/15 text-warning' },
    { label: 'Z5 VO2 Max', range: `> ${Math.round(ftp * 1.05)}W`, color: 'bg-danger/15 text-danger' },
  ] : null;

  return (
    <Card className="border-border-default bg-surface-card shadow-card hover:shadow-card-hover transition-[box-shadow] duration-200 ease-out motion-reduce:transition-opacity h-full">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-swim/10 border border-swim/20 flex items-center justify-center ">
            <Target className="w-4 h-4 text-swim" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-text-primary tracking-tight leading-tight">Zonas de Entrenamiento</h3>
            <p className="text-xs text-text-secondary font-semibold">Basadas en tu FTP y Ritmos Umbral</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Ciclismo */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="w-4 h-4 text-warning" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">Ciclismo (Potencia)</span>
            </div>
            {bikeZones ? (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {bikeZones.map((zone, idx) => (
                  <div key={idx} className={`p-2 rounded-lg text-center ${zone.color}`}>
                    <div className="text-[10px] font-bold uppercase truncate">{zone.label}</div>
                    <div className="text-sm font-black">{zone.range}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-surface-hover border border-border-default rounded-lg flex items-center gap-2 text-xs text-text-secondary">
                <AlertCircle className="w-4 h-4 text-text-muted" /> Añade tu FTP para calcular zonas de bici.
              </div>
            )}
          </div>
          
          {/* Carrera */}
          <div className="opacity-70">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Footprints className="w-4 h-4 text-run" />
                <span className="text-xs font-bold uppercase tracking-wider text-text-primary">Carrera (Ritmo)</span>
              </div>
              <span className="text-[10px] bg-surface-hover text-text-secondary px-2 py-0.5 rounded font-semibold uppercase">Próximamente</span>
            </div>
            <div className="p-3 bg-surface-hover border border-border-default rounded-lg flex items-center gap-2 text-xs text-text-secondary">
              <AlertCircle className="w-4 h-4 text-text-muted" /> El cálculo automático de ritmos por zonas estará disponible en la próxima actualización.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
