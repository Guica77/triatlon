'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target, Search, Sparkles, ChevronRight, ChevronDown, Clock, HeartPulse } from 'lucide-react';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { RACES_CATALOG, RaceCatalogItem, MultisportModality } from '@/lib/races-data';

interface StepGoalProps {
  athleteLevel: string;
  setAthleteLevel: (v: string) => void;
  activeTab: 'catalog' | 'custom' | 'none';
  setActiveTab: (v: 'catalog' | 'custom' | 'none') => void;
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
  setCustomDistance: (v: string) => void;
  customModality: MultisportModality;
  setCustomModality: (v: MultisportModality) => void;
  swimHours: number;
  setSwimHours: (v: number) => void;
  bikeHours: number;
  setBikeHours: (v: number) => void;
  runHours: number;
  setRunHours: (v: number) => void;
  currentFtp: string;
  setCurrentFtp: (v: string) => void;
  currentSwimPace: string;
  setCurrentSwimPace: (v: string) => void;
  currentRunPace: string;
  setCurrentRunPace: (v: string) => void;
  currentWeight: string;
  setCurrentWeight: (v: string) => void;
  dailySteps: string;
  setDailySteps: (v: string) => void;
  previousInjuries: string;
  setPreviousInjuries: (v: string) => void;
  currentFinishTime: string;
  setCurrentFinishTime: (v: string) => void;
  currentSwimTime: string;
  setCurrentSwimTime: (v: string) => void;
  currentBikeTime: string;
  setCurrentBikeTime: (v: string) => void;
  currentRunTime: string;
  setCurrentRunTime: (v: string) => void;
  targetFinishTime: string;
  setTargetFinishTime: (v: string) => void;
  targetSwimTime: string;
  setTargetSwimTime: (v: string) => void;
  targetBikeTime: string;
  setTargetBikeTime: (v: string) => void;
  targetRunTime: string;
  setTargetRunTime: (v: string) => void;
  onNext: () => void;
}

const LEVEL_OPTIONS = [
  { id: 'principiante', label: 'Principiante', desc: 'Primeros pasos' },
  { id: 'intermedio', label: 'Intermedio', desc: 'Con base' },
  { id: 'avanzado', label: 'Avanzado', desc: 'Rendimiento' },
];

export function StepGoal(props: StepGoalProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const totalHours = props.swimHours + props.bikeHours + props.runHours;
  const isRunOnly = props.customModality === 'carrera';

  return (
    <motion.div key="step-goal" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
      <ProCard className="space-y-6 bg-surface-card border border-border-default shadow-card">
        {/* Header */}
        <div className="border-b border-border-default pb-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-swim/10 border border-swim/30 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-swim" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">Objetivo y nivel</h2>
            <p className="text-sm text-text-secondary mt-0.5">Cuéntanos quién eres y a qué quieres llegar. Solo lo esencial.</p>
          </div>
        </div>

        {/* 1. Race goal */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-text-muted block uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-swim" /> ¿Qué carrera estás preparando?
          </label>

          <div className="flex gap-1 p-1 bg-surface-hover rounded-xl border border-border-default">
            <button onClick={() => props.setActiveTab('catalog')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${props.activeTab === 'catalog' ? 'bg-surface-card text-swim border border-border-default/50' : 'text-text-secondary hover:text-text-primary'}`}>
              Catálogo
            </button>
            <button onClick={() => props.setActiveTab('custom')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${props.activeTab === 'custom' ? 'bg-surface-card text-swim border border-border-default/50' : 'text-text-secondary hover:text-text-primary'}`}>
              A medida
            </button>
            <button onClick={() => props.setActiveTab('none')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${props.activeTab === 'none' ? 'bg-surface-card text-swim border border-border-default/50' : 'text-text-secondary hover:text-text-primary'}`}>
              Sin meta
            </button>
          </div>

          {props.activeTab === 'catalog' && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-3.5 h-4 w-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Buscar carrera..."
                  value={props.searchQuery}
                  onChange={e => props.setSearchQuery(e.target.value)}
                  className="w-full bg-surface-hover border border-border-default rounded-xl pl-9 pr-4 py-3 text-sm text-text-primary placeholder-text-muted focus:bg-surface-card focus:border-swim focus:ring-1 focus:ring-swim outline-none transition-all"
                />
              </div>
              <select
                title="Seleccionar Carrera"
                aria-label="Seleccionar Carrera"
                onChange={e => props.setSelectedRace(RACES_CATALOG.find(r => r.id === e.target.value) || null)}
                value={props.selectedRace?.id || ''}
                className="w-full bg-surface-hover border border-border-default rounded-xl px-4 py-3 text-sm text-text-primary focus:bg-surface-card focus:border-swim focus:ring-1 focus:ring-swim outline-none appearance-none cursor-pointer transition-all"
              >
                {props.filteredCatalog.map(r => <option key={r.id} value={r.id}>{r.name} - {r.estimatedDate}</option>)}
              </select>
            </div>
          )}

          {props.activeTab === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Nombre de la prueba"
                value={props.customName}
                onChange={e => props.setCustomName(e.target.value)}
                className="w-full bg-surface-hover border border-border-default rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:bg-surface-card focus:border-swim focus:ring-1 focus:ring-swim outline-none transition-all"
              />
              <input
                title="Fecha"
                aria-label="Fecha"
                type="date"
                value={props.customDate}
                onChange={e => props.setCustomDate(e.target.value)}
                className="w-full bg-surface-hover border border-border-default rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:bg-surface-card focus:border-swim focus:ring-1 focus:ring-swim outline-none transition-all"
              />
              <select
                title="Distancia"
                aria-label="Distancia"
                value={props.customDistance}
                onChange={e => props.setCustomDistance(e.target.value)}
                className="w-full bg-surface-hover border border-border-default rounded-xl px-4 py-3 text-sm text-text-primary focus:bg-surface-card focus:border-swim focus:ring-1 focus:ring-swim outline-none transition-all"
              >
                {isRunOnly ? (
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
              <select
                title="Modalidad"
                aria-label="Modalidad"
                value={props.customModality}
                onChange={e => {
                  const newMod = e.target.value as MultisportModality;
                  props.setCustomModality(newMod);
                  // Reset distance based on modality
                  if (newMod === 'carrera') props.setCustomDistance('maraton');
                  else props.setCustomDistance('half');
                }}
                className="w-full bg-surface-hover border border-border-default rounded-xl px-4 py-3 text-sm text-text-primary focus:bg-surface-card focus:border-swim focus:ring-1 focus:ring-swim outline-none transition-all"
              >
                <option value="triatlon">Triatlón</option>
                <option value="duatlon">Duatlón</option>
                <option value="acuatlon">Acuatlón</option>
                <option value="acuabike">Acuabike</option>
                <option value="carrera">Running (Carrera a pie)</option>
              </select>
            </div>
          )}

          {props.activeTab === 'none' && (
            <div className="p-4 bg-surface-hover border border-border-default rounded-xl text-center">
              <p className="text-sm text-text-primary font-bold">Sin objetivo concreto</p>
              <p className="text-xs text-text-secondary mt-1">Enfocaremos tu plan en construir base aeróbica y mejorar tu salud general.</p>
            </div>
          )}
        </div>

        {/* 2. Level */}
        <div className="border-t border-border-default pt-6 space-y-3">
          <label className="text-xs font-bold text-text-muted block uppercase tracking-wider">Tu nivel</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {LEVEL_OPTIONS.map(lvl => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => props.setAthleteLevel(lvl.id)}
                className={`py-3 px-2 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center justify-center text-center gap-0.5 cursor-pointer ${
                  props.athleteLevel === lvl.id
                    ? 'bg-swim/10 border-swim text-swim ring-1 ring-swim '
                    : 'bg-surface-hover/30 border-border-default text-text-secondary hover:border-border-default hover:bg-surface-hover'
                }`}
              >
                <span>{lvl.label}</span>
                <span className={`text-[10px] font-semibold ${props.athleteLevel === lvl.id ? 'text-swim/80' : 'text-text-muted'}`}>{lvl.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Weekly availability */}
        <div className="border-t border-border-default pt-6 space-y-3">
          <label className="text-xs font-bold text-text-muted block uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-swim" /> Tu disponibilidad semanal
          </label>
          <div className={`grid grid-cols-1 gap-3 ${isRunOnly ? 'sm:grid-cols-1 max-w-md' : 'sm:grid-cols-3'}`}>
            {!isRunOnly && (
              <div className="space-y-2 bg-surface-hover/50 p-3.5 rounded-xl border border-border-default">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-text-secondary font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-swim" /> Natación
                  </span>
                  <strong className="text-xs font-bold text-text-primary bg-surface-card px-2 py-0.5 rounded border border-border-default">{props.swimHours}h</strong>
                </div>
                <input
                  title="Horas de Natación"
                  aria-label="Horas de Natación"
                  type="range"
                  min="0"
                  max="10"
                  value={props.swimHours}
                  onChange={e => props.setSwimHours(parseInt(e.target.value))}
                  className="w-full h-1 bg-border-default rounded-lg appearance-none cursor-pointer accent-swim"
                />
              </div>
            )}
            {!isRunOnly && (
              <div className="space-y-2 bg-surface-hover/50 p-3.5 rounded-xl border border-border-default">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-text-secondary font-semibold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-warning" /> Ciclismo
                  </span>
                  <strong className="text-xs font-bold text-text-primary bg-surface-card px-2 py-0.5 rounded border border-border-default">{props.bikeHours}h</strong>
                </div>
                <input
                  title="Horas de Ciclismo"
                  aria-label="Horas de Ciclismo"
                  type="range"
                  min="0"
                  max="20"
                  value={props.bikeHours}
                  onChange={e => props.setBikeHours(parseInt(e.target.value))}
                  className="w-full h-1 bg-border-default rounded-lg appearance-none cursor-pointer accent-swim"
                />
              </div>
            )}
            <div className="space-y-2 bg-surface-hover/50 p-3.5 rounded-xl border border-border-default">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-text-secondary font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-bike" /> Carrera
                </span>
                <strong className="text-xs font-bold text-text-primary bg-surface-card px-2 py-0.5 rounded border border-border-default">{props.runHours}h</strong>
              </div>
              <input
                title="Horas de Carrera"
                aria-label="Horas de Carrera"
                type="range"
                min="0"
                max="15"
                value={props.runHours}
                onChange={e => props.setRunHours(parseInt(e.target.value))}
                className="w-full h-1 bg-border-default rounded-lg appearance-none cursor-pointer accent-swim"
              />
            </div>
          </div>
          <p className="text-xs text-text-muted font-semibold">Total estimado: <strong className="text-swim">{totalHours}h</strong>/semana</p>
        </div>

        {/* Optional calibration details */}
        <div className="border-t border-border-default pt-6">
          <button
            type="button"
            onClick={() => setShowDetails(v => !v)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-border-default bg-surface-hover/40 hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
              <Sparkles className="w-4 h-4 text-coral-500" />
              Datos opcionales para calibrar tu plan
            </span>
            <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence initial={false}>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="pt-5 space-y-5">
                  {/* Punto de partida */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-text-secondary block uppercase tracking-wider">Punto de partida (opcional)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <input type="number" placeholder="FTP (W)" value={props.currentFtp} onChange={e => props.setCurrentFtp(e.target.value)} className="w-full bg-surface-hover border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:bg-surface-card focus:border-swim focus:ring-1 focus:ring-swim outline-none transition-all" />
                      {!isRunOnly && (
                        <input type="text" placeholder="Ritmo nado (/100m)" value={props.currentSwimPace} onChange={e => props.setCurrentSwimPace(e.target.value)} className="w-full bg-surface-hover border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:bg-surface-card focus:border-swim focus:ring-1 focus:ring-swim outline-none transition-all" />
                      )}
                      <input type="text" placeholder="Ritmo run (/km)" value={props.currentRunPace} onChange={e => props.setCurrentRunPace(e.target.value)} className="w-full bg-surface-hover border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:bg-surface-card focus:border-swim focus:ring-1 focus:ring-swim outline-none transition-all" />
                      <input type="number" step="0.1" placeholder="Peso (kg)" value={props.currentWeight} onChange={e => props.setCurrentWeight(e.target.value)} className="w-full bg-surface-hover border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:bg-surface-card focus:border-swim focus:ring-1 focus:ring-swim outline-none transition-all" />
                      <input type="number" placeholder="Pasos/día" value={props.dailySteps} onChange={e => props.setDailySteps(e.target.value)} className="w-full bg-surface-hover border border-border-default rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:bg-surface-card focus:border-swim focus:ring-1 focus:ring-swim outline-none transition-all" />
                    </div>
                  </div>

                  {/* Lesiones */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary block uppercase tracking-wider flex items-center gap-1.5">
                      <HeartPulse className="w-4 h-4 text-danger" /> Lesiones previas o patologías (opcional)
                    </label>
                    <textarea
                      placeholder="Ej. Condromalacia rotuliana, operación de menisco hace 2 años..."
                      value={props.previousInjuries}
                      onChange={e => props.setPreviousInjuries(e.target.value)}
                      className="w-full bg-surface-hover border border-border-default rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:bg-surface-card focus:border-swim focus:ring-1 focus:ring-swim outline-none transition-all min-h-[60px]"
                    />
                  </div>

                  {/* Tiempo actual */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-text-secondary block uppercase tracking-wider">Tu tiempo actual (opcional)</label>
                    <div className={`grid grid-cols-1 gap-3 ${isRunOnly ? 'sm:grid-cols-2 max-w-md' : 'sm:grid-cols-4'}`}>
                      <input type="text" placeholder="Total (ej. 5h 30m)" value={props.currentFinishTime} onChange={e => props.setCurrentFinishTime(e.target.value)} className="w-full bg-surface-hover border border-border-default rounded-xl px-3 py-2.5 text-xs text-text-primary placeholder-text-muted focus:bg-surface-card focus:border-swim focus:ring-1 focus:ring-swim outline-none transition-all" />
                      {!isRunOnly && <input type="text" placeholder="Natación" value={props.currentSwimTime} onChange={e => props.setCurrentSwimTime(e.target.value)} className="w-full bg-surface-hover border border-border-default rounded-xl px-3 py-2.5 text-xs text-text-primary placeholder-text-muted focus:bg-surface-card focus:border-swim focus:ring-1 focus:ring-swim outline-none transition-all" />}
                      {!isRunOnly && <input type="text" placeholder="Ciclismo" value={props.currentBikeTime} onChange={e => props.setCurrentBikeTime(e.target.value)} className="w-full bg-surface-hover border border-border-default rounded-xl px-3 py-2.5 text-xs text-text-primary placeholder-text-muted focus:bg-surface-card focus:border-swim focus:ring-1 focus:ring-swim outline-none transition-all" />}
                      <input type="text" placeholder="Carrera" value={props.currentRunTime} onChange={e => props.setCurrentRunTime(e.target.value)} className="w-full bg-surface-hover border border-border-default rounded-xl px-3 py-2.5 text-xs text-text-primary placeholder-text-muted focus:bg-surface-card focus:border-swim focus:ring-1 focus:ring-swim outline-none transition-all" />
                    </div>
                  </div>

                  {/* Tiempo objetivo */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-text-secondary block uppercase tracking-wider">Tiempo objetivo (opcional)</label>
                    <div className={`grid grid-cols-1 gap-3 ${isRunOnly ? 'sm:grid-cols-2 max-w-md' : 'sm:grid-cols-4'}`}>
                      <input type="text" placeholder="Total (ej. Sub-5h)" value={props.targetFinishTime} onChange={e => props.setTargetFinishTime(e.target.value)} className="w-full bg-surface-hover border border-border-default rounded-xl px-3 py-2.5 text-xs text-text-primary placeholder-text-muted focus:bg-surface-card focus:border-swim focus:ring-1 focus:ring-swim outline-none transition-all" />
                      {!isRunOnly && <input type="text" placeholder="Natación" value={props.targetSwimTime} onChange={e => props.setTargetSwimTime(e.target.value)} className="w-full bg-surface-hover border border-border-default rounded-xl px-3 py-2.5 text-xs text-text-primary placeholder-text-muted focus:bg-surface-card focus:border-swim focus:ring-1 focus:ring-swim outline-none transition-all" />}
                      {!isRunOnly && <input type="text" placeholder="Ciclismo" value={props.targetBikeTime} onChange={e => props.setTargetBikeTime(e.target.value)} className="w-full bg-surface-hover border border-border-default rounded-xl px-3 py-2.5 text-xs text-text-primary placeholder-text-muted focus:bg-surface-card focus:border-swim focus:ring-1 focus:ring-swim outline-none transition-all" />}
                      <input type="text" placeholder="Carrera" value={props.targetRunTime} onChange={e => props.setTargetRunTime(e.target.value)} className="w-full bg-surface-hover border border-border-default rounded-xl px-3 py-2.5 text-xs text-text-primary placeholder-text-muted focus:bg-surface-card focus:border-swim focus:ring-1 focus:ring-swim outline-none transition-all" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex justify-between pt-4 border-t border-border-default">
          <div />
          <AnimatedButton variant="primary" onClick={props.onNext} className="px-8 py-3 text-sm !bg-swim hover:!bg-swim/90 !text-white">
            Continuar <ChevronRight className="w-4 h-4 ml-1" />
          </AnimatedButton>
        </div>
      </ProCard>
    </motion.div>
  );
}
