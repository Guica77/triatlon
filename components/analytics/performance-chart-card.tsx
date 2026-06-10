'use client';

import * as React from 'react';
import { PmcPoint } from '@/app/(app)/analytics/analytics-actions';
import { HelpCircle, Activity, SlidersHorizontal, Calendar, Zap, TrendingUp, Smile, Meh, Frown, HeartPulse, Trophy } from 'lucide-react';
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
import { motion, AnimatePresence } from 'framer-motion';

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
  const [selectedDateData, setSelectedDateData] = React.useState<any | null>(null);

  const [visibleLines, setVisibleLines] = React.useState({
    ctl: true,
    atl: true,
    tsb: true,
    swim: true,
    bike: true,
    run: true,
  });

  // BRAND COLORS
  const COLOR_CTL = "#38bdf8"; // Swim Blue
  const COLOR_ATL = "#fb7185"; // Run Red
  const COLOR_TSB = "#a3e635"; // Bike Green

  const toggleLine = (lineKey: keyof typeof visibleLines) => {
    setVisibleLines((prev) => ({
      ...prev,
      [lineKey]: !prev[lineKey],
    }));
  };

  const chartData = React.useMemo(() => {
    if (!pmcData || pmcData.length === 0) return [];
    
    const slice = pmcData.slice(-timeRange);
    
    // Find today index to overlap the points so the line doesn't break
    const todayIndex = slice.findIndex(d => !d.isFuture && slice[slice.indexOf(d) + 1]?.isFuture);

    return slice.map((d, index) => {
      const isToday = index === todayIndex;
      const isFutureOrToday = d.isFuture || isToday;
      const isPastOrToday = !d.isFuture || isToday;

      return {
        ...d,
        formattedDate: d.date ? format(new Date(d.date), "d MMM", { locale: es }) : '',
        ctl: isPastOrToday ? Math.round(d.ctl) : null,
        ctl_future: isFutureOrToday ? Math.round(d.ctl) : null,
        atl: isPastOrToday ? Math.round(d.atl) : null,
        atl_future: isFutureOrToday ? Math.round(d.atl) : null,
        tsb: isPastOrToday ? Math.round(d.tsb) : null,
        tsb_future: isFutureOrToday ? Math.round(d.tsb) : null,
        // Keep original values for Tooltip
        raw_ctl: Math.round(d.ctl),
        raw_atl: Math.round(d.atl),
        raw_tsb: Math.round(d.tsb)
      };
    });
  }, [pmcData, timeRange]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0f172a]/95 border border-slate-700/80 rounded-lg shadow-2xl p-3 backdrop-blur-xl tabular-nums text-xs min-w-[160px]">
          <div className="font-bold text-zinc-300 border-b border-slate-700/60 pb-1.5 mb-2 uppercase tracking-wider text-[10px]">
            {data.formattedDate}
          </div>
          
          <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1.5 items-center">
            {visibleLines.ctl && (
              <>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLOR_CTL }} />
                <span className="text-slate-300">Fitness (CTL)</span>
                <span className="text-white font-black">{data.raw_ctl}</span>
              </>
            )}
            {visibleLines.atl && (
              <>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLOR_ATL }} />
                <span className="text-slate-300">Fatiga (ATL)</span>
                <span className="text-white font-black">{data.raw_atl}</span>
              </>
            )}
            {visibleLines.tsb && (
              <>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLOR_TSB }} />
                <span className="text-slate-300">Forma (TSB)</span>
                <span className={`font-black`} style={{ color: data.raw_tsb >= 0 ? COLOR_TSB : '#fcd34d' }}>
                  {data.raw_tsb > 0 ? `+${data.raw_tsb}` : data.raw_tsb}
                </span>
              </>
            )}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-700/60 text-[9px] text-slate-400 italic text-center">
            Click para ver detalle del día
          </div>
        </div>
      );
    }
    return null;
  };

  const handleChartClick = (state: any) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      setSelectedDateData(state.activePayload[0].payload);
    }
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
            <p className="text-[11px] text-slate-500 font-medium">Click en la gráfica para explorar días específicos</p>
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
                onClick={() => {
                  setTimeRange(tab.value);
                  setSelectedDateData(null); // reset selection on zoom change
                }}
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
              <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: COLOR_CTL }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLOR_CTL }}></span>
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
              <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: COLOR_ATL }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLOR_ATL }}></span>
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
              <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5" style={{ color: COLOR_TSB }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLOR_TSB }}></span>
                Forma (TSB)
              </span>
              <button onClick={() => setActiveHelp(activeHelp === 'tsb' ? null : 'tsb')} className="text-slate-600 hover:text-amber-400 transition-colors"><HelpCircle className="w-3 h-3"/></button>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-bold tabular-nums tracking-tight`} style={{ color: currentTsb >= 0 ? COLOR_TSB : '#fcd34d' }}>
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
      <div className="relative w-full pt-4 pb-1 px-2 bg-[#020817] cursor-pointer">
        
        {/* LEYENDA COMPACTA */}
        <div className="flex flex-wrap items-center justify-end gap-x-4 mb-2 px-4 relative z-10">
          <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400">
            <button onClick={() => toggleLine('ctl')} className={`flex items-center gap-1.5 transition-all ${visibleLines.ctl ? 'opacity-100 text-slate-300' : 'opacity-40 line-through'}`}>
              <span className="w-3 h-0.5" style={{ backgroundColor: COLOR_CTL }} /> CTL
            </button>
            <button onClick={() => toggleLine('atl')} className={`flex items-center gap-1.5 transition-all ${visibleLines.atl ? 'opacity-100 text-slate-300' : 'opacity-40 line-through'}`}>
              <span className="w-3 h-0.5 border border-dashed" style={{ borderColor: COLOR_ATL }} /> ATL
            </button>
            <button onClick={() => toggleLine('tsb')} className={`flex items-center gap-1.5 transition-all ${visibleLines.tsb ? 'opacity-100 text-slate-300' : 'opacity-40 line-through'}`}>
              <span className="w-2.5 h-2.5 bg-opacity-20 border" style={{ backgroundColor: `${COLOR_TSB}33`, borderColor: `${COLOR_TSB}80` }} /> TSB
            </button>
            <div className="w-px h-3 bg-slate-800 mx-1"></div>
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-3 h-0.5 border border-dashed border-slate-500" /> Predicción
            </span>
            {showVolume && (
              <>
                <div className="w-px h-3 bg-slate-800 mx-1"></div>
                <button onClick={() => toggleLine('swim')} className={`flex items-center gap-1.5 transition-all ${visibleLines.swim ? 'opacity-100 text-[#38bdf8]' : 'opacity-40 line-through'}`}>
                  Vol S
                </button>
                <button onClick={() => toggleLine('bike')} className={`flex items-center gap-1.5 transition-all ${visibleLines.bike ? 'opacity-100 text-[#a3e635]' : 'opacity-40 line-through'}`}>
                  Vol B
                </button>
                <button onClick={() => toggleLine('run')} className={`flex items-center gap-1.5 transition-all ${visibleLines.run ? 'opacity-100 text-[#fb7185]' : 'opacity-40 line-through'}`}>
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
              onClick={handleChartClick}
            >
              <defs>
                <linearGradient id="tsbFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLOR_TSB} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={COLOR_TSB} stopOpacity={0.0} />
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
                cursor={{ stroke: '#475569', strokeWidth: 1.5, strokeDasharray: '4 4' }} 
                isAnimationActive={false}
              />
              
              <ReferenceLine yAxisId="right" y={0} stroke="#334155" strokeDasharray="3 3" />

              {/* TSB - TrainingPeaks Style Area Chart */}
              {visibleLines.tsb && (
                <>
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="tsb"
                    stroke={COLOR_TSB}
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#tsbFill)" 
                    connectNulls
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="tsb_future"
                    stroke={COLOR_TSB}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fillOpacity={0.5}
                    fill="url(#tsbFill)" 
                    connectNulls
                  />
                </>
              )}

              {/* Distances (Bar or Lines) */}
              {showVolume && visibleLines.swim && (
                <Line yAxisId="left" type="step" dataKey="swimDistance" stroke="#38bdf8" strokeWidth={1} dot={false} strokeOpacity={0.4} />
              )}
              {showVolume && visibleLines.bike && (
                <Line yAxisId="left" type="step" dataKey="bikeDistance" stroke="#a3e635" strokeWidth={1} dot={false} strokeOpacity={0.4} />
              )}
              {showVolume && visibleLines.run && (
                <Line yAxisId="left" type="step" dataKey="runDistance" stroke="#fb7185" strokeWidth={1} dot={false} strokeOpacity={0.4} />
              )}

              {/* ATL - Fatiga */}
              {visibleLines.atl && (
                <>
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="atl"
                    stroke={COLOR_ATL}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: COLOR_ATL }}
                    isAnimationActive={true}
                    animationDuration={800}
                    connectNulls
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="atl_future"
                    stroke={COLOR_ATL}
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                    connectNulls
                  />
                </>
              )}

              {/* CTL - Fitness */}
              {visibleLines.ctl && (
                <>
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="ctl"
                    stroke={COLOR_CTL}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0, fill: COLOR_CTL }}
                    isAnimationActive={true}
                    animationDuration={800}
                    connectNulls
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="ctl_future"
                    stroke={COLOR_CTL}
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    strokeOpacity={0.6}
                    dot={false}
                    activeDot={false}
                    isAnimationActive={false}
                    connectNulls
                  />
                </>
              )}

              {/* Highlight Selected Date Line */}
              {selectedDateData && (
                <ReferenceLine 
                  x={selectedDateData.formattedDate} 
                  stroke="#f8fafc" 
                  strokeOpacity={0.5} 
                  strokeWidth={1} 
                  strokeDasharray="3 3" 
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DETALLE DEL DÍA SELECCIONADO (INTERACTIVIDAD FASE 1) */}
      <AnimatePresence>
        {selectedDateData && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-slate-800/60 bg-[#020817] overflow-hidden"
          >
            <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    Resumen del {selectedDateData.formattedDate}
                    
                    {/* Compliance Badge */}
                    {(() => {
                      const aTss = selectedDateData.actualTss || 0;
                      const pTss = selectedDateData.plannedTss || 0;
                      if (pTss === 0 && aTss === 0) return null;
                      
                      let comp = pTss > 0 ? Math.round((aTss / pTss) * 100) : 100;
                      if (selectedDateData.isFuture) comp = 0; // Future is not completed yet

                      let colorClass = 'text-slate-400 bg-slate-800 border-slate-700';
                      let label = 'Plan';
                      
                      if (!selectedDateData.isFuture) {
                        if (comp >= 80 && comp <= 120) {
                          colorClass = 'text-[#a3e635] bg-[#a3e635]/10 border-[#a3e635]/20';
                          label = 'Completado';
                        } else if ((comp >= 50 && comp < 80) || comp > 120) {
                          colorClass = 'text-[#facc15] bg-[#facc15]/10 border-[#facc15]/20';
                          label = 'Parcial';
                        } else {
                          colorClass = 'text-[#fb7185] bg-[#fb7185]/10 border-[#fb7185]/20';
                          label = 'No Completado';
                        }
                      } else {
                        label = 'Programado';
                        colorClass = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
                      }

                      return (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${colorClass}`}>
                          {label} {selectedDateData.isFuture ? '' : `(${comp}%)`}
                        </span>
                      );
                    })()}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-[10px] font-medium uppercase tracking-wider">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      TSS Real: <span className="text-white">{selectedDateData.actualTss || 0}</span>
                      <span className="text-slate-500 lowercase">/ {selectedDateData.plannedTss || 0} plan</span>
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      TSB: <span className="text-white">{selectedDateData.tsb}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedDateData(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-lg border border-slate-800 transition-colors"
                >
                  Cerrar Detalle
                </button>
              </div>
            </div>

            {/* Simulated Session Details based on distance for MVP */}
            <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {selectedDateData.swimDistance > 0 && (
                <div className="p-3 rounded-lg bg-[#38bdf8]/5 border border-[#38bdf8]/20 flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase text-[#38bdf8] tracking-wider">Natación</span>
                  <span className="text-lg font-bold text-white tabular-nums tracking-tight">{selectedDateData.swimDistance} <span className="text-xs font-medium text-slate-500">m</span></span>
                </div>
              )}
              {selectedDateData.bikeDistance > 0 && (
                <div className="p-3 rounded-lg bg-[#a3e635]/5 border border-[#a3e635]/20 flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase text-[#a3e635] tracking-wider">Ciclismo</span>
                  <span className="text-lg font-bold text-white tabular-nums tracking-tight">{selectedDateData.bikeDistance} <span className="text-xs font-medium text-slate-500">km</span></span>
                </div>
              )}
              {selectedDateData.runDistance > 0 && (
                <div className="p-3 rounded-lg bg-[#fb7185]/5 border border-[#fb7185]/20 flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase text-[#fb7185] tracking-wider">Carrera</span>
                  <span className="text-lg font-bold text-white tabular-nums tracking-tight">{selectedDateData.runDistance} <span className="text-xs font-medium text-slate-500">km</span></span>
                </div>
              )}

              {/* Subjective Feedback (RPE & Feel) */}
              {(selectedDateData.rpe || selectedDateData.feel) && (
                <div className="sm:col-span-3 p-4 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <HeartPulse className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Feedback del Atleta</span>
                      <p className="text-xs text-slate-400 font-medium">Esfuerzo Percibido y Sensaciones</p>
                    </div>
                  </div>

                  <div className="flex gap-6 items-center">
                    {selectedDateData.rpe && (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">RPE</span>
                        <div className="flex items-end gap-1">
                          <span className={`text-xl font-black tabular-nums leading-none ${selectedDateData.rpe > 7 ? 'text-rose-400' : selectedDateData.rpe > 4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {selectedDateData.rpe}
                          </span>
                          <span className="text-xs text-slate-500 font-medium mb-0.5">/10</span>
                        </div>
                      </div>
                    )}

                    {selectedDateData.feel && (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Feel</span>
                        <div className="flex items-center justify-center h-6">
                          {selectedDateData.feel >= 4 ? (
                            <Smile className="w-6 h-6 text-emerald-400" />
                          ) : selectedDateData.feel === 3 ? (
                            <Meh className="w-6 h-6 text-amber-400" />
                          ) : (
                            <Frown className="w-6 h-6 text-rose-400" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Personal Records (Picos de Rendimiento) */}
              {selectedDateData.prs && selectedDateData.prs.length > 0 && (
                <div className="sm:col-span-3 mt-1 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Picos de Rendimiento (PRs)</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedDateData.prs.map((pr: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded shadow-sm border border-amber-500/30">
                          {pr}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedDateData.swimDistance === 0 && selectedDateData.bikeDistance === 0 && selectedDateData.runDistance === 0 && !selectedDateData.isFuture && !selectedDateData.prs && (
                <div className="col-span-3 p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 text-xs font-medium">
                  Día de Descanso / Recuperación Activa
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
