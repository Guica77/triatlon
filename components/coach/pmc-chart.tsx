'use client';

import * as React from 'react';
import { 
  ComposedChart, 
  Area, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity } from 'lucide-react';

interface PMCData {
  date: string;
  tss: number;
  ctl: number;
  atl: number;
  tsb: number;
}

interface PMCChartProps {
  data: PMCData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-surface-elevated p-3 border border-border-default shadow-elevated rounded-xl text-xs space-y-1 z-50">
        <p className="font-bold text-text-primary mb-2 border-b border-border-subtle pb-1">
          {format(parseISO(label), "d MMM yyyy", { locale: es })}
        </p>
        {payload.map((entry: any, index: number) => {
          const getBgClass = (color: string) => {
            if (color === '#06b6d4') return 'bg-swim';
            if (color === '#f43f5e') return 'bg-run';
            if (color === '#f59e0b') return 'bg-amber-500';
            return 'bg-border-default';
          };
          return (
            <div key={`item-${index}`} className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${getBgClass(entry.color)}`}
              />
              <span className="font-medium text-text-secondary uppercase tracking-wider">{entry.name}:</span>
              <span className="font-black text-text-primary ml-auto">{entry.value}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export function PMCChart({ data }: PMCChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-surface-elevated rounded-2xl border border-border-default border-dashed">
        <div className="text-center text-text-muted space-y-2">
          <Activity className="w-8 h-8 mx-auto opacity-50" />
          <p className="text-sm font-medium">No hay datos suficientes para calcular el PMC.</p>
        </div>
      </div>
    );
  }

  // Find min TSB for Y-axis scaling of the secondary axis
  const minTsb = Math.min(...data.map(d => d.tsb));
  const maxTsb = Math.max(...data.map(d => d.tsb));

  return (
    <div className="w-full h-[400px] relative">
      {/* Legend inside the chart frame */}
      <div className="absolute top-0 right-4 flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-text-secondary z-10 bg-surface-elevated/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border-default">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-500" />
          CTL (Fitness)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-pink-500" />
          ATL (Fatigue)
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          TSB (Form)
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D3340" />
          
          <XAxis 
            dataKey="date" 
            tickFormatter={(tick) => format(parseISO(tick), 'MMM', { locale: es })}
            tick={{ fontSize: 10, fill: '#a1a1aa', fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            minTickGap={30}
          />
          
          <YAxis 
            yAxisId="left" 
            orientation="left" 
            tick={{ fontSize: 10, fill: '#a1a1aa', fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            domain={[Math.min(-30, minTsb - 10), Math.max(30, maxTsb + 10)]}
            tick={{ fontSize: 10, fill: '#a1a1aa', fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            hide // Hide the right axis to keep it clean, but use its scale
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <ReferenceLine yAxisId="right" y={0} stroke="#6B7280" strokeDasharray="3 3" />
          
          {/* TSB - Form (Area on secondary axis) */}
          <Area 
            yAxisId="right"
            type="monotone" 
            dataKey="tsb" 
            name="TSB" 
            fill="#f59e0b" 
            fillOpacity={0.1}
            stroke="#f59e0b" 
            strokeWidth={1.5}
          />

          {/* ATL - Fatigue (Line) */}
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="atl" 
            name="ATL" 
            stroke="#ec4899" 
            strokeWidth={1.5} 
            dot={false}
          />

          {/* CTL - Fitness (Thick Line) */}
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="ctl" 
            name="CTL" 
            stroke="#06b6d4" 
            strokeWidth={3} 
            dot={false}
            activeDot={{ r: 6, strokeWidth: 0, fill: '#06b6d4' }}
          />

        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
