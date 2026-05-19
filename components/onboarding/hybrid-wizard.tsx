'use client';

import * as React from 'react';
import { RACES_CATALOG, RaceCatalogItem, MultisportModality } from '@/lib/races-data';
import { saveRaceGoalAndPlan } from '@/app/onboarding/actions';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Search, Trophy, Calendar, Zap, Flag, Check, ChevronRight, ChevronLeft, Activity, Wrench, Clock, Timer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const VIRTUAL_GARAGE_ITEMS = [
  { id: 'Bici Carretera', label: 'Bici Carretera', icon: '🚴‍♂️', desc: 'Ruta' },
  { id: 'Cabra Triatlón', label: 'Cabra Triatlón', icon: '🚴‍♂️', desc: 'Aero TT' },
  { id: 'Neopreno', label: 'Neopreno', icon: '🩱', desc: 'Aguas Abiertas' },
  { id: 'Ruedas Carbono', label: 'Ruedas Carbono', icon: '⭕', desc: 'Perfil Aero' },
  { id: 'Potenciómetro', label: 'Potenciómetro', icon: '⚡', desc: 'Vatios' },
  { id: 'Casco Aero', label: 'Casco Aero', icon: '🪖', desc: 'TT MIPS' },
  { id: 'Palas de Natación', label: 'Palas Natación', icon: '🎒', desc: 'Fuerza' },
  { id: 'Aletas de Natación', label: 'Aletas Natación', icon: '🎒', desc: 'Técnica' },
];

export function HybridWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  // Step 1: Ambition & Availability
  const [activeTab, setActiveTab] = React.useState<'catalog' | 'custom'>('catalog');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedRace, setSelectedRace] = React.useState<RaceCatalogItem | null>(RACES_CATALOG[0]);
  
  const [customName, setCustomName] = React.useState('');
  const [customModality, setCustomModality] = React.useState<MultisportModality>('triatlon');
  const [customDistance, setCustomDistance] = React.useState<'sprint' | 'olimpico' | 'half' | 'full'>('half');
  const [customDate, setCustomDate] = React.useState('2027-10-18');

  const [targetFinishTime, setTargetFinishTime] = React.useState('');
  const [baselineHours, setBaselineHours] = React.useState('7-10h');
  const [swimHours, setSwimHours] = React.useState(2);
  const [bikeHours, setBikeHours] = React.useState(4);
  const [runHours, setRunHours] = React.useState(3);
  const [targetSwimTime, setTargetSwimTime] = React.useState('');
  const [targetBikeTime, setTargetBikeTime] = React.useState('');
  const [targetRunTime, setTargetRunTime] = React.useState('');

  // Step 2: Physiological
  const [currentFtp, setCurrentFtp] = React.useState('');
  const [currentSwimPace, setCurrentSwimPace] = React.useState('');
  const [currentRunPace, setCurrentRunPace] = React.useState('');

  // Step 3: Virtual Garage
  const [virtualGarage, setVirtualGarage] = React.useState<string[]>([]);

  const toggleGear = (id: string) => {
    setVirtualGarage(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const filteredCatalog = React.useMemo(() => {
    if (!searchQuery) return RACES_CATALOG;
    const q = searchQuery.toLowerCase();
    return RACES_CATALOG.filter(
      r => r.name.toLowerCase().includes(q) || 
           r.city.toLowerCase().includes(q) || 
           r.country.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const currentGoal = React.useMemo(() => {
    if (activeTab === 'catalog' && selectedRace) {
      return {
        name: selectedRace.name,
        date: selectedRace.estimatedDate,
        distance: selectedRace.distance,
        modality: selectedRace.modality
      };
    } else {
      return {
        name: customName || 'Mi Desafío',
        date: customDate || '2027-10-18',
        distance: customDistance,
        modality: customModality
      };
    }
  }, [activeTab, selectedRace, customName, customDistance, customModality, customDate]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await saveRaceGoalAndPlan({
        target_race_name: currentGoal.name,
        target_race_date: currentGoal.date,
        target_race_distance: currentGoal.distance as any,
        target_race_modality: currentGoal.modality,
        target_finish_time: targetFinishTime,
        baseline_training_hours: baselineHours,
        current_ftp: currentFtp ? parseInt(currentFtp) : undefined,
        current_swim_pace: currentSwimPace || undefined,
        current_run_pace: currentRunPace || undefined,
        virtual_garage: virtualGarage,
        swim_weekly_hours: swimHours,
        bike_weekly_hours: bikeHours,
        run_weekly_hours: runHours,
        target_swim_time: targetSwimTime || undefined,
        target_bike_time: targetBikeTime || undefined,
        target_run_time: targetRunTime || undefined
      });
      if (result && result.error) {
        console.error('Error:', result.error);
        setLoading(false);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const handleSaveAndConnect = async () => {
    setLoading(true);
    try {
      const result = await saveRaceGoalAndPlan({
        target_race_name: currentGoal.name,
        target_race_date: currentGoal.date,
        target_race_distance: currentGoal.distance as any,
        target_race_modality: currentGoal.modality,
        target_finish_time: targetFinishTime,
        baseline_training_hours: baselineHours,
        current_ftp: currentFtp ? parseInt(currentFtp) : undefined,
        current_swim_pace: currentSwimPace || undefined,
        current_run_pace: currentRunPace || undefined,
        virtual_garage: virtualGarage,
        swim_weekly_hours: swimHours,
        bike_weekly_hours: bikeHours,
        run_weekly_hours: runHours,
        target_swim_time: targetSwimTime || undefined,
        target_bike_time: targetBikeTime || undefined,
        target_run_time: targetRunTime || undefined
      });
      if (result && result.error) {
        console.error('Error:', result.error);
        setLoading(false);
      } else {
        // Redirect to real Strava connection
        window.location.href = '/api/auth/telemetry/connect?provider=strava';
      }
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl space-y-8">
      {/* Stepper Header */}
      <div className="flex items-center justify-between relative mb-12">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-zinc-800 -z-10" />
        {[1, 2, 3, 4].map(num => (
          <div key={num} className="flex flex-col items-center gap-2 bg-[var(--color-background)] px-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors ${
              step >= num ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'bg-zinc-900 border-zinc-700 text-zinc-500'
            }`}>
              {step > num ? <Check className="w-5 h-5" /> : num}
            </div>
            <span className={`text-[10px] uppercase tracking-wider font-semibold ${step >= num ? 'text-cyan-400' : 'text-zinc-500'}`}>
              {num === 1 ? 'Ambición' : num === 2 ? 'Fisiología' : num === 3 ? 'Garaje' : 'Conexión'}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
            <ProCard className="space-y-6">
              <div className="border-b border-zinc-800/80 pb-4">
                <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2"><Trophy className="w-5 h-5 text-cyan-400" /> Objetivo & Disponibilidad</h2>
                <p className="text-sm text-zinc-400 mt-1">Define tu gran meta y cuánto tiempo tienes para entrenar.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-2 uppercase tracking-wider">¿Qué carrera estás preparando?</label>
                  <div className="flex gap-2 p-1 bg-zinc-900/80 rounded-xl border border-zinc-800/80 mb-4">
                    <button onClick={() => setActiveTab('catalog')} className={`flex-1 py-2 text-sm font-semibold rounded-lg ${activeTab === 'catalog' ? 'bg-zinc-800 text-cyan-400 shadow-md' : 'text-zinc-500'}`}>Catálogo Oficial</button>
                    <button onClick={() => setActiveTab('custom')} className={`flex-1 py-2 text-sm font-semibold rounded-lg ${activeTab === 'custom' ? 'bg-zinc-800 text-cyan-400 shadow-md' : 'text-zinc-500'}`}>Carrera a Medida</button>
                  </div>

                  {activeTab === 'catalog' && (
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                        <input type="text" placeholder="Buscar carrera..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-zinc-100 focus:border-cyan-500 outline-none" />
                      </div>
                      <select onChange={e => setSelectedRace(RACES_CATALOG.find(r => r.id === e.target.value) || null)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:border-cyan-500 outline-none appearance-none cursor-pointer">
                        {filteredCatalog.map(r => <option key={r.id} value={r.id}>{r.name} - {r.estimatedDate}</option>)}
                      </select>
                    </div>
                  )}

                  {activeTab === 'custom' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input type="text" placeholder="Nombre de la prueba" value={customName} onChange={e => setCustomName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:border-cyan-500 outline-none" />
                      <input type="date" value={customDate} onChange={e => setCustomDate(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:border-cyan-500 outline-none" />
                      <select value={customDistance} onChange={e => setCustomDistance(e.target.value as any)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:border-cyan-500 outline-none">
                        <option value="sprint">Sprint</option>
                        <option value="olimpico">Olímpico</option>
                        <option value="half">Half / 70.3</option>
                        <option value="full">Full / Ironman</option>
                      </select>
                      <select value={customModality} onChange={e => setCustomModality(e.target.value as any)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:border-cyan-500 outline-none">
                        <option value="triatlon">Triatlón</option>
                        <option value="duatlon">Duatlón</option>
                        <option value="acuatlon">Acuatlón</option>
                        <option value="acuabike">Acuabike</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-medium text-zinc-400 block mb-2 uppercase tracking-wider flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Disponibilidad Semanal</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['4-6h', '7-10h', '12+h'].map(h => (
                        <button key={h} onClick={() => setBaselineHours(h)} className={`py-3 rounded-xl border text-sm font-semibold transition-all ${baselineHours === h ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-inner' : 'bg-zinc-950/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}>
                          {h}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-zinc-400 block mb-2 uppercase tracking-wider flex items-center gap-1"><Timer className="w-3.5 h-3.5" /> Tiempo Objetivo Total</label>
                    <input type="text" placeholder="Ej. Sub-5h o 'Terminar'" value={targetFinishTime} onChange={e => setTargetFinishTime(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:border-cyan-500 outline-none" />
                  </div>
                </div>

                <div className="border-t border-zinc-800/80 pt-6 space-y-4">
                  <label className="text-xs font-medium text-zinc-400 block uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-cyan-400" /> Marcas / Tiempos Objetivo por Segmento (Opcional)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">Natación split</label>
                      <input type="text" placeholder="Ej. 35 min o 0:35" value={targetSwimTime} onChange={e => setTargetSwimTime(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-cyan-500 outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">Ciclismo split</label>
                      <input type="text" placeholder="Ej. 2h 45m o 2:45" value={targetBikeTime} onChange={e => setTargetBikeTime(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-cyan-500 outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">Carrera split</label>
                      <input type="text" placeholder="Ej. 1h 35m o 1:35" value={targetRunTime} onChange={e => setTargetRunTime(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-100 focus:border-cyan-500 outline-none" />
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
                        <strong className="text-sm font-bold text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{swimHours}h</strong>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        value={swimHours} 
                        onChange={e => setSwimHours(parseInt(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                      <p className="text-[10px] text-zinc-500">Estimado semanal a nado</p>
                    </div>

                    <div className="space-y-2 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400" /> Ciclismo
                        </span>
                        <strong className="text-sm font-bold text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{bikeHours}h</strong>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="20" 
                        value={bikeHours} 
                        onChange={e => setBikeHours(parseInt(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                      <p className="text-[10px] text-zinc-500">Horas rodando en bici</p>
                    </div>

                    <div className="space-y-2 bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-800/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-zinc-300 font-semibold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-400" /> Carrera
                        </span>
                        <strong className="text-sm font-bold text-white bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">{runHours}h</strong>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="15" 
                        value={runHours} 
                        onChange={e => setRunHours(parseInt(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                      <p className="text-[10px] text-zinc-500">Horas corriendo a pie</p>
                    </div>
                  </div>
                </div>

              </div>
              
              <div className="flex justify-end pt-4 border-t border-zinc-800/80">
                <AnimatedButton variant="primary" onClick={() => setStep(2)} className="px-8 py-3 text-sm">
                  Continuar <ChevronRight className="w-4 h-4 ml-1" />
                </AnimatedButton>
              </div>
            </ProCard>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
            <ProCard className="space-y-6">
              <div className="border-b border-zinc-800/80 pb-4">
                <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-400" /> Calibración Fisiológica</h2>
                <p className="text-sm text-zinc-400 mt-1">Introduce tus zonas actuales. Si no las sabes, las estimaremos automáticamente por IA.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-2 uppercase tracking-wider">FTP Ciclismo (W)</label>
                  <input type="number" placeholder="Ej. 250" value={currentFtp} onChange={e => setCurrentFtp(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-2 uppercase tracking-wider">Ritmo Natación (/100m)</label>
                  <input type="text" placeholder="Ej. 01:45" value={currentSwimPace} onChange={e => setCurrentSwimPace(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-2 uppercase tracking-wider">Ritmo Carrera (/km)</label>
                  <input type="text" placeholder="Ej. 04:30" value={currentRunPace} onChange={e => setCurrentRunPace(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 focus:border-emerald-500 outline-none" />
                </div>
              </div>
              
              <div className="flex justify-between pt-4 border-t border-zinc-800/80">
                <button onClick={() => setStep(1)} className="px-6 py-3 text-sm font-semibold text-zinc-400 hover:text-white transition flex items-center"><ChevronLeft className="w-4 h-4 mr-1" /> Atrás</button>
                <AnimatedButton variant="primary" onClick={() => setStep(3)} className="px-8 py-3 text-sm !bg-emerald-500 hover:!bg-emerald-400 !text-black shadow-emerald-500/20">
                  Continuar <ChevronRight className="w-4 h-4 ml-1" />
                </AnimatedButton>
              </div>
            </ProCard>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
            <ProCard className="space-y-6">
              <div className="border-b border-zinc-800/80 pb-4">
                <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2"><Wrench className="w-5 h-5 text-amber-400" /> Garaje Virtual</h2>
                <p className="text-sm text-zinc-400 mt-1">Selecciona el material que ya posees. La IA usará esto para sugerirte chollos en entrenamientos donde te falte equipamiento.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {VIRTUAL_GARAGE_ITEMS.map(item => {
                  const isSelected = virtualGarage.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleGear(item.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                        isSelected 
                          ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] scale-105' 
                          : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-600'
                      }`}
                    >
                      <span className="text-2xl mb-2 block">{item.icon}</span>
                      <span className={`text-xs font-bold text-center block ${isSelected ? 'text-amber-400' : 'text-zinc-300'}`}>{item.label}</span>
                      <span className="text-[10px] text-zinc-500 mt-1">{item.desc}</span>
                      {isSelected && <div className="absolute top-2 right-2 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-black stroke-[3]" /></div>}
                    </button>
                  );
                })}
              </div>
              
              <div className="flex justify-between pt-4 border-t border-zinc-800/80">
                <button onClick={() => setStep(2)} className="px-6 py-3 text-sm font-semibold text-zinc-400 hover:text-white transition flex items-center"><ChevronLeft className="w-4 h-4 mr-1" /> Atrás</button>
                <AnimatedButton variant="primary" onClick={() => setStep(4)} className="px-8 py-3 text-sm !bg-amber-500 hover:!bg-amber-400 !text-black shadow-amber-500/20">
                  Continuar <ChevronRight className="w-4 h-4 ml-1" />
                </AnimatedButton>
              </div>
            </ProCard>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
            <ProCard className="space-y-6">
              <div className="border-b border-zinc-800/80 pb-4">
                <h2 className="text-xl font-medium text-zinc-100 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-orange-500 animate-pulse" /> Conectar Reloj y Telemetría
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Sincroniza tus entrenamientos reales automáticamente. La Inteligencia Artificial necesita leer tu pulso, ritmos y fatiga para ajustar tu periodización diaria.
                </p>
              </div>

              <div className="space-y-6">
                <div className="p-5 rounded-xl bg-orange-500/5 border border-orange-500/20">
                  <h3 className="text-sm font-bold text-orange-400 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4" /> ¿Cómo funciona el ecosistema Triatlon Pro?
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0 mt-0.5">1</div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        <strong className="text-white">IA Dinámica:</strong> Cada día la Inteligencia Artificial analiza tus métricas y genera tus entrenamientos (series, ritmos, potencias) a medida en el Dashboard.
                      </p>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0 mt-0.5">2</div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        <strong className="text-white">Envío a tu Reloj:</strong> Una vez completado el onboarding, en la pestaña <strong>Configuración</strong> tendrás un botón para "Enviar Entrenos a Garmin/Coros". Esto volcará toda la semana en tu reloj.
                      </p>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0 mt-0.5">3</div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        <strong className="text-white">Entrenamiento Guiado:</strong> Simplemente dale a "Iniciar Entrenamiento" en tu reloj. Tu dispositivo te guiará y vibrará en cada serie (ej. "Rueda a 250W por 5 min").
                      </p>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded bg-zinc-900 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0 mt-0.5">4</div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        <strong className="text-white">Marketplace IA:</strong> Si te falta material (ej. Neopreno), nuestro rastreador automático de Wallapop te buscará chollos rebajados.
                      </p>
                    </li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs text-orange-200/90 leading-relaxed text-center font-medium">
                  Para activar todo este flujo, necesitamos conectarnos con tu telemetría real. Usamos <strong>Strava</strong> como puente seguro.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Garmin Connect button */}
                  <button
                    onClick={handleSaveAndConnect}
                    disabled={loading}
                    className="flex flex-col items-center justify-center p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 hover:bg-orange-500/5 hover:border-orange-500/30 transition-all group relative overflow-hidden"
                  >
                    <span className="text-3xl mb-3 block">🛰️</span>
                    <span className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">Conectar Garmin</span>
                    <span className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-semibold">Vía Strava Bridge</span>
                  </button>

                  {/* Coros/Suunto/Otros button */}
                  <button
                    onClick={handleSaveAndConnect}
                    disabled={loading}
                    className="flex flex-col items-center justify-center p-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/40 hover:bg-orange-500/5 hover:border-orange-500/30 transition-all group relative overflow-hidden"
                  >
                    <span className="text-3xl mb-3 block">⌚</span>
                    <span className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">Conectar Coros / Suunto</span>
                    <span className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-semibold">Vía Strava Bridge</span>
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between pt-4 border-t border-zinc-800/80">
                <button onClick={() => setStep(3)} className="px-6 py-3 text-sm font-semibold text-zinc-400 hover:text-white transition flex items-center"><ChevronLeft className="w-4 h-4 mr-1" /> Atrás</button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-3 text-sm font-semibold text-zinc-500 hover:text-zinc-300 transition-all"
                >
                  {loading ? 'Generando IA Plan...' : 'Saltar y finalizar'}
                </button>
              </div>
            </ProCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
