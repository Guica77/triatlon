'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Search, Clock, Timer, ChevronRight, ChevronLeft, Activity } from 'lucide-react';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { RACES_CATALOG, RaceCatalogItem, MultisportModality } from '@/lib/races-data';

interface StepAmbitionProps {
  wantsCoach?: boolean;
  activeTab: 'catalog' | 'custom';
  setActiveTab: (v: 'catalog' | 'custom') => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filteredCatalog: RaceCatalogItem[];
  selectedRace: RaceCatalogItem | null;
  setSelectedRace: (v: RaceCatalogItem | null) => void;
  customName: string;
  setCustomName: (v: string) => void;
  customDate: string;
  setCustomDate: (v: string) => void;
  customDistance: string;
  setCustomDistance: (v: any) => void;
  customModality: MultisportModality;
  setCustomModality: (v: any) => void;
  athleteLevel: string;
  setAthleteLevel: (v: string) => void;
  baselineHours: string;
  setBaselineHours: (v: string) => void;
  targetFinishTime: string;
  setTargetFinishTime: (v: string) => void;
  targetSwimTime: string;
  setTargetSwimTime: (v: string) => void;
  targetBikeTime: string;
  setTargetBikeTime: (v: string) => void;
  targetRunTime: string;
  setTargetRunTime: (v: string) => void;
  swimHours: number;
  setSwimHours: (v: number) => void;
  bikeHours: number;
  setBikeHours: (v: number) => void;
  runHours: number;
  setRunHours: (v: number) => void;
  onNext: () => void;
  onPrev?: () => void;
}

export function StepAmbition(props: StepAmbitionProps) {
  React.useEffect(() => {
    const total = props.swimHours + props.bikeHours + props.runHours;
    const computed = total <= 6 ? '4-6h' : total <= 11 ? '7-10h' : '12+h';
    props.setBaselineHours(computed);
  }, [props.swimHours, props.bikeHours, props.runHours, props.setBaselineHours]);

  return (
    <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
      <ProCard className="space-y-4 bg-white border border-zinc-200">
        <div className="border-b border-zinc-200 pb-3">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2"><Trophy className="w-5 h-5 text-cyan-500" /> Objetivo & Disponibilidad</h2>
          <p className="text-sm text-zinc-500 mt-1">Define tu gran meta y cuánto tiempo tienes para entrenar.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-400 block mb-2 uppercase tracking-wider">Horas Semanales de Entrenamiento</label>
            <div className="space-y-3">
              {props.customModality !== 'carrera' && (
                <>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-zinc-600 font-medium">Natación ({props.swimHours}h)</span>
                    </div>
                    <input title="Horas Natación Base" aria-label="Horas Natación Base" type="range" min="0" max="10" step="0.5" value={props.swimHours} onChange={e => props.setSwimHours(parseFloat(e.target.value))} className="w-full accent-cyan-500" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-zinc-600 font-medium">Ciclismo ({props.bikeHours}h)</span>
                    </div>
                    <input title="Horas Bici Base" aria-label="Horas Bici Base" type="range" min="0" max="15" step="0.5" value={props.bikeHours} onChange={e => props.setBikeHours(parseFloat(e.target.value))} className="w-full accent-cyan-500" />
                  </div>
                </>
              )}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-zinc-600 font-medium">Carrera a pie ({props.runHours}h)</span>
                </div>
                <input title="Horas Carrera Base" aria-label="Horas Carrera Base" type="range" min="0" max="10" step="0.5" value={props.runHours} onChange={e => props.setRunHours(parseFloat(e.target.value))} className="w-full accent-cyan-500" />
              </div>
            </div>
            <label className="text-xs font-bold text-zinc-400 block mt-4 mb-2 uppercase tracking-wider">¿Qué carrera estás preparando?</label>
            <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl border border-zinc-200 mb-3">
              <button onClick={() => props.setActiveTab('catalog')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${props.activeTab === 'catalog' ? 'bg-white text-cyan-600 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-800'}`}>Catálogo Oficial</button>
              <button onClick={() => props.setActiveTab('custom')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${props.activeTab === 'custom' ? 'bg-white text-cyan-600 shadow-sm border border-zinc-200/50' : 'text-zinc-500 hover:text-zinc-800'}`}>Carrera a Medida</button>
            </div>

            {props.activeTab === 'catalog' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                  <input type="text" placeholder="Buscar carrera..." value={props.searchQuery} onChange={e => props.setSearchQuery(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all" />
                </div>
                <select title="Seleccionar Carrera" aria-label="Seleccionar Carrera" onChange={e => props.setSelectedRace(RACES_CATALOG.find(r => r.id === e.target.value) || null)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-800 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none appearance-none cursor-pointer transition-all">
                  {props.filteredCatalog.map(r => <option key={r.id} value={r.id}>{r.name} - {r.estimatedDate}</option>)}
                </select>
              </div>
            )}

            {props.activeTab === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Nombre de la prueba" value={props.customName} onChange={e => props.setCustomName(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all" />
                <input title="Fecha" aria-label="Fecha" type="date" value={props.customDate} onChange={e => props.setCustomDate(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all" />
                <select title="Distancia" aria-label="Distancia" value={props.customDistance} onChange={e => props.setCustomDistance(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-800 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all">
                  {props.customModality === 'carrera' ? (
                    <>
                      <option value="5k">5K</option>
                      <option value="10k">10K</option>
                      <option value="medio_maraton">Media Maratón (21K)</option>
                      <option value="maraton">Maratón (42K)</option>
                      <option value="ultra">Ultra Maratón</option>
                    </>
                  ) : (
                    <>
                      <option value="sprint">Sprint</option>
                      <option value="olimpico">Olímpico</option>
                      <option value="half">Half / 70.3</option>
                      <option value="full">Full / Ironman</option>
                    </>
                  )}
                </select>
                <select title="Modalidad" aria-label="Modalidad" value={props.customModality} onChange={e => {
                  const newMod = e.target.value as MultisportModality | 'carrera';
                  props.setCustomModality(newMod);
                  // Reset distance based on modality
                  if (newMod === 'carrera') props.setCustomDistance('maraton');
                  else props.setCustomDistance('half');
                }} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-800 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all">
                  <option value="triatlon">Triatlón</option>
                  <option value="duatlon">Duatlón</option>
                  <option value="acuatlon">Acuatlón</option>
                  <option value="acuabike">Acuabike</option>
                  <option value="carrera">Running (Carrera a pie)</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-400 block mb-2 uppercase tracking-wider">Nivel de Experiencia</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'intermedio', label: 'Intermedio', desc: 'Con base' },
                { id: 'avanzado', label: 'Avanzado', desc: 'Rendimiento' }
              ].map(lvl => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => props.setAthleteLevel(lvl.id)}
                  className={`py-3 px-1.5 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center justify-center text-center gap-0.5 cursor-pointer ${
                    props.athleteLevel === lvl.id
                      ? 'bg-cyan-5/50 border-cyan-500 text-cyan-600 ring-1 ring-cyan-500 shadow-xs'
                      : 'bg-zinc-50/30 border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  <span>{lvl.label}</span>
                  <span className={`text-[10px] font-semibold ${props.athleteLevel === lvl.id ? 'text-cyan-500/80' : 'text-zinc-400'}`}>{lvl.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {!props.wantsCoach && (
            <div>
              <label className="text-xs font-bold text-zinc-400 block mb-2 uppercase tracking-wider flex items-center gap-1"><Timer className="w-3.5 h-3.5" /> Tiempo Objetivo Total</label>
              <input type="text" placeholder="Ej. Sub-5h o 'Terminar'" value={props.targetFinishTime} onChange={e => props.setTargetFinishTime(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all" />
            </div>
          )}

          {!props.wantsCoach && (
            <div className="border-t border-zinc-200 pt-6 space-y-4">
              <label className="text-xs font-bold text-zinc-400 block uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-cyan-500" /> Marcas / Tiempos Objetivo {props.customModality !== 'carrera' && 'por Segmento'} (Opcional)
              </label>
              
              <div className={`grid grid-cols-1 gap-4 ${props.customModality === 'carrera' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
                {props.customModality !== 'carrera' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">Natación split</label>
                      <input type="text" placeholder="Ej. 35 min o 0:35" value={props.targetSwimTime} onChange={e => props.setTargetSwimTime(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">Ciclismo split</label>
                      <input type="text" placeholder="Ej. 2h 45m o 2:45" value={props.targetBikeTime} onChange={e => props.setTargetBikeTime(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all" />
                    </div>
                  </>
                )}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">Carrera {props.customModality !== 'carrera' && 'split'}</label>
                  <input type="text" placeholder={props.customModality === 'carrera' ? "Ej. 3h 15m (Maratón)" : "Ej. 1h 30m o 1:30"} value={props.targetRunTime} onChange={e => props.setTargetRunTime(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all" />
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-zinc-200 pt-6 space-y-4">
            <label className="text-xs font-bold text-zinc-400 block uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-500" /> Tiempo semanal {props.customModality !== 'carrera' ? 'por disciplina' : 'disponible'} (Horas)
            </label>
            <div className={`grid grid-cols-1 gap-6 ${props.customModality === 'carrera' ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
              {props.customModality !== 'carrera' && (
                <>
                  <div className="space-y-2 bg-zinc-50/50 p-3.5 rounded-xl border border-zinc-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-zinc-650 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-400" /> Natación
                      </span>
                      <strong className="text-xs font-bold text-zinc-700 bg-white px-2 py-0.5 rounded border border-zinc-200 shadow-xs">{props.swimHours}h</strong>
                    </div>
                    <input 
                      title="Horas de Natación"
                      aria-label="Horas de Natación"
                      type="range" 
                      min="0" 
                      max="10" 
                      value={props.swimHours} 
                      onChange={e => props.setSwimHours(parseInt(e.target.value))}
                      className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <p className="text-[10px] text-zinc-450 font-semibold">Estimado semanal a nado</p>
                  </div>

                  <div className="space-y-2 bg-zinc-50/50 p-3.5 rounded-xl border border-zinc-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-zinc-650 font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" /> Ciclismo
                      </span>
                      <strong className="text-xs font-bold text-zinc-700 bg-white px-2 py-0.5 rounded border border-zinc-200 shadow-xs">{props.bikeHours}h</strong>
                    </div>
                    <input 
                      title="Horas de Ciclismo"
                      aria-label="Horas de Ciclismo"
                      type="range" 
                      min="0" 
                      max="20" 
                      value={props.bikeHours} 
                      onChange={e => props.setBikeHours(parseInt(e.target.value))}
                      className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <p className="text-[10px] text-zinc-450 font-semibold">Estimado semanal en bici</p>
                  </div>
                </>
              )}

              <div className="space-y-2 bg-zinc-50/50 p-3.5 rounded-xl border border-zinc-200">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-zinc-650 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Carrera
                  </span>
                  <strong className="text-xs font-bold text-zinc-700 bg-white px-2 py-0.5 rounded border border-zinc-200 shadow-xs">{props.runHours}h</strong>
                </div>
                <input 
                  title="Horas de Carrera"
                  aria-label="Horas de Carrera"
                  type="range" 
                  min="0" 
                  max="15" 
                  value={props.runHours} 
                  onChange={e => props.setRunHours(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <p className="text-[10px] text-zinc-450 font-semibold">Estimado semanal a pie</p>
              </div>
            </div>
          </div>

        </div>
        
        <div className="flex justify-between pt-4 border-t border-zinc-200">
          {props.onPrev ? (
            <button onClick={props.onPrev} className="px-6 py-3 text-sm font-semibold text-zinc-500 hover:text-zinc-850 transition flex items-center cursor-pointer"><ChevronLeft className="w-4 h-4 mr-1" /> Atrás</button>
          ) : (
            <div />
          )}
          <AnimatedButton variant="primary" onClick={props.onNext} className="px-8 py-3 text-sm !bg-cyan-400 hover:!bg-cyan-500 !text-white shadow-cyan-500/10">
            Continuar <ChevronRight className="w-4 h-4 ml-1" />
          </AnimatedButton>
        </div>
      </ProCard>
    </motion.div>
  );
}
