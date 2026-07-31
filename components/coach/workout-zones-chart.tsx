'use client';

import * as React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity } from 'lucide-react';

interface ZoneData {
  zone: string;
  name: string;
  seconds: number;
  minutes: number;
  color: string;
}

interface WorkoutZonesChartProps {
  zonesSummary: Record<string, number> | null;
}

// Map standard 5-zone model colors
const ZONE_COLORS: Record<string, string> = {
  Z1: '#9ca3af', // Gray - Recovery
  Z2: '#3b82f6', // Blue - Endurance
  Z3: '#22c55e', // Green - Tempo
  Z4: '#eab308', // Yellow - Threshold
  Z5: '#ef4444', // Red - VO2 Max
};

const ZONE_NAMES: Record<string, string> = {
  Z1: 'Recuperación',
  Z2: 'Resistencia',
  Z3: 'Tempo',
  Z4: 'Umbral',
  Z5: 'VO2 Max',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface-elevated p-2 border border-border-default shadow-card rounded-lg text-xs z-50">
        <p className="font-bold text-text-primary mb-1">{data.name} ({data.zone})</p>
        <p className="text-text-secondary">
          <span className="font-black text-text-primary">{data.minutes}</span> min
        </p>
      </div>
    );
  }
  return null;
};

export function WorkoutZonesChart({ zonesSummary }: WorkoutZonesChartProps) {
  if (!zonesSummary || Object.keys(zonesSummary).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-surface-elevated rounded-xl border border-dashed border-border-default text-text-muted">
        <Activity className="w-5 h-5 mb-1 opacity-50" />
        <p className="text-[10px] uppercase font-bold tracking-wider">No hay datos de zonas</p>
      </div>
    );
  }

  // Parse JSON summary into chart data format
  const chartData: ZoneData[] = Object.keys(zonesSummary)
    .filter(k => k.startsWith('Z') || k.startsWith('z'))
    .sort((a, b) => a.localeCompare(b))
    .map(zoneKey => {
      const zKey = zoneKey.toUpperCase();
      const seconds = zonesSummary[zoneKey] || 0;
      return {
        zone: zKey,
        name: ZONE_NAMES[zKey] || zKey,
        seconds,
        minutes: Math.round((seconds / 60) * 10) / 10,
        color: ZONE_COLORS[zKey] || '#a1a1aa'
      };
    });

  if (chartData.length === 0) return null;

  return (
    <div className="w-full space-y-2">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
        Tiempo en Zonas (Frecuencia Cardíaca)
      </h4>
      <div className="h-[120px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis 
              dataKey="zone" 
              type="category" 
              axisLine={false} 
              tickLine={false}
              tick={{ fontSize: 10, fill: '#71717a', fontWeight: 700 }}
            />
            <Tooltip cursor={{ fill: '#2D3340' }} content={<CustomTooltip />} />
            <Bar dataKey="minutes" radius={[0, 4, 4, 0]} barSize={12}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
