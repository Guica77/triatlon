'use client';

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { PMCData } from '@/lib/pmc-utils';

interface PMCChartProps {
  data: PMCData[];
  height?: number;
}

export function PMCChart({ data, height = 400 }: PMCChartProps) {
  // Procesamos datos para visualización
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      formattedDate: format(parseISO(d.date), "d MMM", { locale: es }),
      // Truncar para el gráfico
      ctl: Math.round(d.ctl),
      atl: Math.round(d.atl),
      tsb: Math.round(d.tsb),
    }));
  }, [data]);

  if (!chartData || chartData.length === 0) {
    return <div className="w-full h-[400px] flex items-center justify-center text-text-secondary">No hay datos suficientes para el PMC</div>;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-app border border-border-subtle p-3 rounded-lg shadow-elevated backdrop-blur-md">
          <p className="text-text-secondary text-sm font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            let name = entry.name;
            const color = entry.color;
            if (entry.dataKey === 'ctl') name = 'CTL (Fitness)';
            if (entry.dataKey === 'atl') name = 'ATL (Fatiga)';
            if (entry.dataKey === 'tsb') name = 'TSB (Forma)';

            return (
              <div key={index} className="flex items-center gap-2 text-xs mb-1">
                <div className={`w-2 h-2 rounded-full ${entry.dataKey === 'ctl' ? 'bg-[#3b82f6]' : entry.dataKey === 'atl' ? 'bg-[#ef4444]' : 'bg-[#10b981]'}`} />
                <span className="text-text-muted w-24">{name}:</span>
                <span className="text-text-primary font-bold">{entry.value}</span>
              </div>
            );
          })}
          {payload[0] && payload[0].payload.tss > 0 && (
            <div className="flex items-center gap-2 text-xs mt-2 pt-2 border-t border-border-subtle/50">
              <div className="w-2 h-2 rounded-full bg-zinc-600" />
              <span className="text-text-muted w-24">TSS Diario:</span>
              <span className="text-text-secondary font-bold">{payload[0].payload.tss}</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full flex flex-col bg-surface-app rounded-2xl border border-border-subtle/60 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-text-primary tracking-tight">Performance Management Chart</h3>
          <p className="text-xs text-text-muted mt-1">
            Basado en datos de Garmin/Strava (TSS, CTL, ATL, TSB)
          </p>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#3b82f6]" />
            <span className="text-text-secondary">CTL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-[#ef4444]" />
            <span className="text-text-secondary">ATL</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-[#10b981]/20 border border-[#10b981]/50" />
            <span className="text-text-secondary">TSB</span>
          </div>
        </div>
      </div>

      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{
              top: 5,
              right: 5,
              left: -20,
              bottom: 5,
            }}
          >
            <defs>
              <linearGradient id="tsbGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D3340" vertical={false} />
            <XAxis 
              dataKey="formattedDate"
              stroke="#9CA3AF"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis 
              yAxisId="left"
              stroke="#9CA3AF"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={[0, 'auto']}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              stroke="#9CA3AF"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
              hide // Ocultamos el eje derecho para TSB para simplificar la vista, pero lo mantenemos a nivel escala
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '5 5' }} />
            
            <ReferenceLine yAxisId="right" y={0} stroke="#6B7280" strokeDasharray="3 3" />
            
            {/* TSB - Forma (Area Chart) */}
            <Area 
              yAxisId="right"
              type="monotone" 
              dataKey="tsb" 
              stroke="#10b981" 
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={1} 
              fill="url(#tsbGradient)" 
              animationDuration={1500}
            />
            
            {/* ATL - Fatiga */}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="atl" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0, fill: '#ef4444' }}
              animationDuration={1500}
            />
            
            {/* CTL - Fitness */}
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="ctl" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: '#3b82f6' }}
              animationDuration={1500}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 pt-4 border-t border-border-subtle/60 grid grid-cols-3 gap-4">
        {chartData.length > 0 && (
          <>
            <div className="flex flex-col">
              <span className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">Fitness (CTL)</span>
              <span className="text-text-primary font-black text-2xl">{chartData[chartData.length - 1].ctl}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">Fatiga (ATL)</span>
              <span className="text-text-primary font-black text-2xl">{chartData[chartData.length - 1].atl}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-text-muted text-xs font-medium uppercase tracking-wider mb-1">Forma (TSB)</span>
              <span className={`font-black text-2xl ${chartData[chartData.length - 1].tsb >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {chartData[chartData.length - 1].tsb > 0 ? '+' : ''}{chartData[chartData.length - 1].tsb}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
