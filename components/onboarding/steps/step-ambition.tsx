'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Search, Clock, Timer, ChevronRight, ChevronLeft, Activity } from 'lucide-react';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { RACES_CATALOG, RaceCatalogItem, MultisportModality } from '@/lib/races-data';

interface StepAmbitionProps {
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
      <ProCard className="space-y-4">
        <div className="border-b border-zinc-800/80 pb-3">
          <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2"><Trophy className="w-5 h-5 text-cyan-400" /> Objetivo & Disponibilidad</h2>
          <p className="text-sm text-zinc-400 mt-1">Define tu gran meta y cuánto tiempo tienes para entrenar.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-2 uppercase tracking-wider">¿Qué carrera estás preparando?</label>
            <div className="flex gap-2 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800/80 mb-3">
              <button onClick={() => props.setActiveTab('catalog')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${props.activeTab === 'catalog' ? 'bg-zinc-800 text-cyan-400 shadow-md' : 'text-zinc-500 hover:text-zinc-400'}`}>Catálogo Oficial</button>
              <button onClick={() => props.setActiveTab('custom')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${props.activeTab === 'custom' ? 'bg-zinc-800 text-cyan-400 shadow-md' : 'text-zinc-500 hover:text-zinc-400'}`}>Carrera a Medida</button>
            </div>

            {props.activeTab === 'catalog' && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                  <input type="text" placeholder="Buscar carrera..." value={props.searchQuery} onChange={e => props.setSearchQuery(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 focus:border-cyan-500 outline-none transition-all" />
                </div>
                <select title="Seleccionar Carrera" aria-label="Seleccionar Carrera" onChange={e => props.setSelectedRace(RACES_CATALOG.find(r => r.id === e.target.value) || null)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:border-cyan-500 outline-none appearance-none cursor-pointer transition-all">
                  {props.filteredCatalog.map(r => <option key={r.id} value={r.id}>{r.name} - {r.estimatedDate}</option>)}
                </select>
              </div>
            )}

            {props.activeTab === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input type="text" placeholder="Nombre de la prueba" value={props.customName} onChange={e => props.setCustomName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:border-cyan-500 outline-none transition-all" />
                <input title="Fecha" aria-label="Fecha" type="date" value={props.customDate} onChange={e => props.setCustomDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:border-cyan-500 outline-none transition-all" />
                <select title="Distancia" aria-label="Distancia" value={props.customDistance} onChange={e => props.setCustomDistance(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:border-cyan-500 outline-none transition-all">
                  <option value="sprint">Sprint</option>
                  <option value="olimpico">Olímpico</option>
                  <option value="half">Half / 70.3</option>
                  <option value="full">Full / Ironman</option>
                </select>
                <select title="Modalidad" aria-label="Modalidad" value={props.customModality} onChange={e => props.setCustomModality(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:border-cyan-500 outline-none transition-all">
                  <option value="triatlon">Triatlón</option>
                  <option value="duatlon">Duatlón</option>
                  <option value="acuatlon">Acuatlón</option>
                  <option value="acuabike">Acuabike</option>
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-2 uppercase tracking-wider">Nivel de Experiencia</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'intermedio', label: 'Intermedio', desc: 'Con base' },
                { id: 'avanzado', label: 'Avanzado', desc: 'Rendimiento' }
              ].map(lvl => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => props.setAthleteLevel(lvl.id)}
                  className={`py-2 px-1.5 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center justify-center text-center gap-0.5 ${
                    props.athleteLevel === lvl.id
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-inner'
                      : 'bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  <span>{lvl.label}</span>
                  <span className="text-[10px] text-zinc-500 font-normal">{lvl.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400 block mb-2 uppercase tracking-wider flex items-center gap-1"><Timer className="w-3.5 h-3.5" /> Tiempo Objetivo Total</label>
            <input type="text" placeholder="Ej. Sub-5h o 'Terminar'" value={props.targetFinishTime} onChange={e => props.setTargetFinishTime(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:border-cyan-500 outline-none transition-all" />
          </div>

          <div className="border-t border-zinc-800/80 pt-6 space-y-4">
            <label className="text-xs font-medium text-zinc-400 block uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-cyan-400" /> Marcas / Tiempos Objetivo por Segmento (Opcional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">Natación split</label>
                <input type="text" placeholder="Ej. 35 min o 0:35" value={props.targetSwimTime} onChange={e => props.setTargetSwimTime(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-cyan-500 outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">Ciclismo split</label>
                <input type="text" placeholder="Ej. 2h 45m o 2:45" value={props.targetBikeTime} onChange={e => props.setTargetBikeTime(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-cyan-500 outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">Carrera split</label>
                <input type="text" placeholder="Ej. 1h 35m o 1:35" value={props.targetRunTime} onChange={e => props.setTargetRunTime(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-cyan-500 outline-none transition-all" />
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-800/80 pt-6 space-y-4">
            <label className="text-xs font-medium text-zinc-400 block uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" /> Tiempo semanal por disciplina (Horas)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/50">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400" /> Natación
                  </span>
                  <strong className="text-sm font-bold text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{props.swimHours}h</strong>
                </div>
                <input 
                  title="Horas de Natación"
                  aria-label="Horas de Natación"
                  type="range" 
                  min="0" 
                  max="10" 
                  value={props.swimHours} 
                  onChange={e => props.setSwimHours(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <p className="text-[10px] text-zinc-500">Estimado semanal a nado</p>
              </div>

              <div className="space-y-2 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/50">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> Ciclismo
                  </span>
                  <strong className="text-sm font-bold text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{props.bikeHours}h</strong>
                </div>
                <input 
                  title="Horas de Ciclismo"
                  aria-label="Horas de Ciclismo"
                  type="range" 
                  min="0" 
                  max="20" 
                  value={props.bikeHours} 
                  onChange={e => props.setBikeHours(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <p className="text-[10px] text-zinc-500">Horas rodando en bici</p>
              </div>

              <div className="space-y-2 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/50">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" /> Carrera
                  </span>
                  <strong className="text-sm font-bold text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{props.runHours}h</strong>
                </div>
                <input 
                  title="Horas de Carrera"
                  aria-label="Horas de Carrera"
                  type="range" 
                  min="0" 
                  max="15" 
                  value={props.runHours} 
                  onChange={e => props.setRunHours(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <p className="text-[10px] text-zinc-500">Horas corriendo a pie</p>
              </div>
            </div>
          </div>

        </div>
        
        <div className="flex justify-between pt-4 border-t border-zinc-800/80">
          {props.onPrev ? (
            <button onClick={props.onPrev} className="px-6 py-3 text-sm font-semibold text-zinc-400 hover:text-white transition flex items-center"><ChevronLeft className="w-4 h-4 mr-1" /> Atrás</button>
          ) : (
            <div />
          )}
          <AnimatedButton variant="primary" onClick={props.onNext} className="px-8 py-3 text-sm">
            Continuar <ChevronRight className="w-4 h-4 ml-1" />
          </AnimatedButton>
        </div>
      </ProCard>
    </motion.div>
  );
}
