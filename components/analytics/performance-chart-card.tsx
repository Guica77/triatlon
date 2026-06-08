'use client';

import * as React from 'react';
import { PmcPoint } from '@/app/analytics/analytics-actions';
import { HelpCircle, Activity, SlidersHorizontal } from 'lucide-react';
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
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PerformanceChartCardProps {
  pmcData: PmcPoint[];
  currentCtl: number;
  currentAtl: number;
  currentTsb: number;
  athleteLevel?: string;
}

export function PerformanceChartCard({
  pmcData,
  currentCtl,
  currentAtl,
  currentTsb,
  athleteLevel = 'intermedio',
}: PerformanceChartCardProps) {
  const isBeginner = athleteLevel === 'principiante';
  const [timeRange, setTimeRange] = React.useState<number>(90); 
  const [activeHelp, setActiveHelp] = React.useState<'ctl' | 'atl' | 'tsb' | null>(null);
  const [showVolume, setShowVolume] = React.useState(false);
  const [visibleLines, setVisibleLines] = React.useState({
    ctl: true,
    atl: true,
    tsb: true,
    swim: true,
    bike: true,
    run: true,
  });

  const toggleLine = (lineKey: keyof typeof visibleLines) => {
    setVisibleLines((prev) => ({
      ...prev,
      [lineKey]: !prev[lineKey],
    }));
  };

  const chartData = React.useMemo(() => {
    if (!pmcData || pmcData.length === 0) return [];
    return pmcData.slice(-timeRange).map(d => ({
      ...d,
      formattedDate: d.date ? format(new Date(d.date), "d MMM", { locale: es }) : '',
      ctl: Math.round(d.ctl),
      atl: Math.round(d.atl),
      tsb: Math.round(d.tsb),
    }));
  }, [pmcData, timeRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0f172a]/90 border border-slate-800/80 rounded shadow-2xl p-2.5 backdrop-blur-xl tabular-nums text-xs">
          <div className="font-medium text-slate-400 border-b border-slate-800/60 pb-1 mb-2 uppercase tracking-wider text-[10px]">
            {data.formattedDate}
          </div>
          
          <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1.5 items-center">
            {visibleLines.ctl && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]" />
                <span className="text-slate-300">Fitness (CTL)</span>
                <span className="text-white font-bold">{data.ctl}</span>
              </>
            )}
            {visibleLines.atl && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]" />
                <span className="text-slate-300">Fatiga (ATL)</span>
                <span className="text-white font-bold">{data.atl}</span>
              </>
            )}
            {visibleLines.tsb && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                <span className="text-slate-300">Forma (TSB)</span>
                <span className={`font-bold ${data.tsb >= 0 ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>
                  {data.tsb > 0 ? `+${data.tsb}` : data.tsb}
                </span>
              </>
            )}
          </div>

          {showVolume && ((visibleLines.bike && data.bikeDistance > 0) || (visibleLines.run && data.runDistance > 0) || (visibleLines.swim && data.swimDistance > 0)) && (
            <div className="border-t border-slate-800/60 pt-1.5 mt-2 grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1 items-center">
              {visibleLines.swim && data.swimDistance > 0 && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]" />
                  <span className="text-[#a78bfa]">Natación</span>
                  <span className="text-[#c4b5fd] font-medium">{data.swimDistance}m</span>
                </>
              )}
              {visibleLines.bike && data.bikeDistance > 0 && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9]" />
                  <span className="text-[#7dd3fc]">Ciclismo</span>
                  <span className="text-[#bae6fd] font-medium">{data.bikeDistance}km</span>
                </>
              )}
              {visibleLines.run && data.runDistance > 0 && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                  <span className="text-[#6ee7b7]">Carrera</span>
                  <span className="text-[#a7f3d0] font-medium">{data.runDistance}km</span>
                </>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="col-span-1 md:col-span-2 bg-[#020617] rounded-xl border border-slate-800/60 overflow-hidden flex flex-col font-sans shadow-xl">
      
      {/* HEADER TÉCNICO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-5 py-4 border-b border-slate-800/60 bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200 tracking-tight flex items-center gap-2">
              Performance Management Chart
              <span className="px-1.5 py-0.5 rounded-sm bg-slate-800 text-[9px] text-slate-400 font-medium uppercase tracking-widest border border-slate-700">Pro</span>
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">CTL, ATL y TSB (Basado en TSS)</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <div className="flex bg-slate-900 rounded p-0.5 border border-slate-800">
            {[
              { label: '4W', value: 30 },
              { label: '8W', value: 60 },
              { label: '12W', value: 90 },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setTimeRange(tab.value)}
                className={`px-3 py-1 text-[11px] font-bold rounded-sm transition-all ${
                  timeRange === tab.value
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setShowVolume(!showVolume)}
            className={`flex items-center justify-center w-7 h-7 rounded border transition-colors ${
              showVolume ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Volumen"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* MÉTRICAS SUPERIORES (KPIs) */}
      {!isBeginner && (
        <div className="grid grid-cols-3 divide-x divide-slate-800/60 bg-[#020817] border-b border-slate-800/60">
          <div className="px-5 py-3 relative group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6]"></span>
                Fitness (CTL)
              </span>
              <button onClick={() => setActiveHelp(activeHelp === 'ctl' ? null : 'ctl')} className="text-slate-600 hover:text-blue-400 transition-colors"><HelpCircle className="w-3 h-3"/></button>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white tabular-nums tracking-tight">{currentCtl}</span>
            </div>
            {activeHelp === 'ctl' && (
              <div onClick={() => setActiveHelp(null)} className="absolute top-12 left-2 z-20 w-48 bg-slate-800 p-2 text-[10px] rounded border border-slate-700 text-slate-300 shadow-xl cursor-pointer">Mide tu condición física a largo plazo. Sube de forma constante con constancia.</div>
            )}
          </div>
          
          <div className="px-5 py-3 relative group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-[#ef4444] uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></span>
                Fatiga (ATL)
              </span>
              <button onClick={() => setActiveHelp(activeHelp === 'atl' ? null : 'atl')} className="text-slate-600 hover:text-red-400 transition-colors"><HelpCircle className="w-3 h-3"/></button>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-white tabular-nums tracking-tight">{currentAtl}</span>
            </div>
            {activeHelp === 'atl' && (
              <div onClick={() => setActiveHelp(null)} className="absolute top-12 left-2 z-20 w-48 bg-slate-800 p-2 text-[10px] rounded border border-slate-700 text-slate-300 shadow-xl cursor-pointer">Mide tu cansancio a corto plazo. Reacciona fuertemente a sesiones duras.</div>
            )}
          </div>

          <div className="px-5 py-3 relative group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span>
                Forma (TSB)
              </span>
              <button onClick={() => setActiveHelp(activeHelp === 'tsb' ? null : 'tsb')} className="text-slate-600 hover:text-amber-400 transition-colors"><HelpCircle className="w-3 h-3"/></button>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold tabular-nums tracking-tight ${currentTsb >= 0 ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>
                {currentTsb > 0 ? `+${currentTsb}` : currentTsb}
              </span>
            </div>
            {activeHelp === 'tsb' && (
              <div onClick={() => setActiveHelp(null)} className="absolute top-12 left-2 z-20 w-48 bg-slate-800 p-2 text-[10px] rounded border border-slate-700 text-slate-300 shadow-xl cursor-pointer">CTL - ATL. Valores positivos indican frescura para competir.</div>
            )}
          </div>
        </div>
      )}

      {/* GRÁFICO RECHARTS DENSE */}
      <div className="relative w-full pt-4 pb-1 px-2 bg-[#020817]">
        
        {/* LEYENDA COMPACTA */}
        <div className="flex flex-wrap items-center justify-end gap-x-4 mb-2 px-4">
          <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400">
            <button onClick={() => toggleLine('ctl')} className={`flex items-center gap-1.5 transition-all ${visibleLines.ctl ? 'opacity-100 text-slate-300' : 'opacity-40 line-through'}`}>
              <span className="w-3 h-0.5 bg-[#3b82f6]" /> CTL
            </button>
            <button onClick={() => toggleLine('atl')} className={`flex items-center gap-1.5 transition-all ${visibleLines.atl ? 'opacity-100 text-slate-300' : 'opacity-40 line-through'}`}>
              <span className="w-3 h-0.5 border border-dashed border-[#ef4444]" /> ATL
            </button>
            <button onClick={() => toggleLine('tsb')} className={`flex items-center gap-1.5 transition-all ${visibleLines.tsb ? 'opacity-100 text-slate-300' : 'opacity-40 line-through'}`}>
              <span className="w-2.5 h-2.5 bg-[#f59e0b]/20 border border-[#f59e0b]/50" /> TSB
            </button>
            {showVolume && (
              <>
                <div className="w-px h-3 bg-slate-800 mx-1"></div>
                <button onClick={() => toggleLine('swim')} className={`flex items-center gap-1.5 transition-all ${visibleLines.swim ? 'opacity-100 text-[#a78bfa]' : 'opacity-40 line-through'}`}>
                  Vol S
                </button>
                <button onClick={() => toggleLine('bike')} className={`flex items-center gap-1.5 transition-all ${visibleLines.bike ? 'opacity-100 text-[#7dd3fc]' : 'opacity-40 line-through'}`}>
                  Vol B
                </button>
                <button onClick={() => toggleLine('run')} className={`flex items-center gap-1.5 transition-all ${visibleLines.run ? 'opacity-100 text-[#6ee7b7]' : 'opacity-40 line-through'}`}>
                  Vol R
                </button>
              </>
            )}
          </div>
        </div>

        <div className="w-full aspect-[21/9] min-h-[260px] max-h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 5, right: 0, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="tsbFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              
              <XAxis 
                dataKey="formattedDate" 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                minTickGap={30}
                tick={{ fill: '#475569' }}
              />
              
              <YAxis 
                yAxisId="left" 
                stroke="#475569" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#475569' }}
                domain={[0, 'auto']} 
              />
              
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                stroke="#475569" 
                hide 
              />
              
              <Tooltip 
                content={<CustomTooltip />} 
                cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }} 
                isAnimationActive={false}
              />
              
              <ReferenceLine yAxisId="right" y={0} stroke="#334155" strokeDasharray="3 3" />

              {/* TSB - TrainingPeaks Style Area Chart */}
              {visibleLines.tsb && (
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="tsb"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  fillOpacity={1}
                  fill="url(#tsbFill)" 
                />
              )}

              {/* Distances (Bar or Lines) */}
              {showVolume && visibleLines.swim && (
                <Line yAxisId="left" type="step" dataKey="swimDistance" stroke="#8b5cf6" strokeWidth={1} dot={false} strokeOpacity={0.4} />
              )}
              {showVolume && visibleLines.bike && (
                <Line yAxisId="left" type="step" dataKey="bikeDistance" stroke="#0ea5e9" strokeWidth={1} dot={false} strokeOpacity={0.4} />
              )}
              {showVolume && visibleLines.run && (
                <Line yAxisId="left" type="step" dataKey="runDistance" stroke="#10b981" strokeWidth={1} dot={false} strokeOpacity={0.4} />
              )}

              {/* ATL - Fatiga */}
              {visibleLines.atl && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="atl"
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={{ r: 3, strokeWidth: 0, fill: '#ef4444' }}
                  isAnimationActive={true}
                  animationDuration={800}
                />
              )}

              {/* CTL - Fitness */}
              {visibleLines.ctl && (
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="ctl"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0, fill: '#3b82f6' }}
                  isAnimationActive={true}
                  animationDuration={800}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
