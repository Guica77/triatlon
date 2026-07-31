'use client';

import * as React from 'react';
import { 
  ComposedChart, 
  Line, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { HeartPulse } from 'lucide-react';

interface BiometricsData {
  date: string;
  hrv: number | null;
  readiness_score: number | null;
}

interface BiometricsTrendChartProps {
  data: BiometricsData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-border-subtle rounded-xl text-xs space-y-1 z-50">
        <p className="font-bold text-text-primary mb-2 border-b border-border-subtle pb-1">
          {format(parseISO(label), "d MMM yyyy", { locale: es })}
        </p>
        {payload.map((entry: any, index: number) => {
          const getBgClass = (color: string) => {
            if (color === '#6366f1') return 'bg-indigo-500';
            if (color === '#0ea5e9') return 'bg-swim';
            if (color === '#f59e0b') return 'bg-amber-500';
            return 'bg-bg-elevated0';
          };
          return (
            <div key={`item-${index}`} className="flex items-center gap-2">
              <span 
                className={`w-2 h-2 rounded-full ${getBgClass(entry.color)}`}
              />
              <span className="font-medium text-text-muted uppercase tracking-wider">{entry.name}:</span>
              <span className="font-black text-text-primary ml-auto">{entry.value} {entry.name === 'HRV' ? 'ms' : '%'}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export function BiometricsTrendChart({ data }: BiometricsTrendChartProps) {
  // Sort data ascending for chart
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));

  if (!sortedData || sortedData.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center bg-bg-elevated rounded-2xl border border-border-subtle border-dashed">
        <div className="text-center text-text-muted space-y-2">
          <HeartPulse className="w-8 h-8 mx-auto opacity-50" />
          <p className="text-sm font-medium">No hay historial biométrico.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[300px] relative">
      <div className="absolute top-0 right-4 flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-text-muted z-10 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border-subtle">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-swim" />
          Readiness
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          HRV
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={sortedData}
          margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
          
          <XAxis 
            dataKey="date" 
            tickFormatter={(tick) => format(parseISO(tick), 'dd/MM')}
            tick={{ fontSize: 10, fill: '#a1a1aa', fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          
          <YAxis 
            yAxisId="left" 
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: '#a1a1aa', fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            tick={{ fontSize: 10, fill: '#a1a1aa', fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            hide
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Bar 
            yAxisId="left"
            dataKey="readiness_score" 
            name="Readiness" 
            fill="#06b6d4" 
            radius={[4, 4, 0, 0]} 
            barSize={10}
            opacity={0.3}
          />

          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="hrv" 
            name="HRV" 
            stroke="#6366f1" 
            strokeWidth={2.5} 
            dot={{ r: 3, fill: '#6366f1', strokeWidth: 0 }}
            activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
