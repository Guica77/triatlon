'use client';

import * as React from 'react';
import { RACES_CATALOG, RaceCatalogItem, MultisportModality } from '@/lib/races-data';
import { saveRaceGoalAndPlan } from '@/app/(app)/onboarding/actions';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Search, Trophy, Calendar, Zap, Flag, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function RaceFinder() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<'catalog' | 'custom'>('catalog');
  
  // Estado para Catálogo Oficial
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedRace, setSelectedRace] = React.useState<RaceCatalogItem | null>(RACES_CATALOG[0]);

  // Estado para Desafío a Medida
  const [customName, setCustomName] = React.useState('');
  const [customModality, setCustomModality] = React.useState<MultisportModality>('triatlon');
  const [customDistance, setCustomDistance] = React.useState<'sprint' | 'olimpico' | 'half' | 'full'>('half');
  const [customDate, setCustomDate] = React.useState('2027-10-18');

  const [loading, setLoading] = React.useState(false);

  // Filtrar catálogo
  const filteredCatalog = React.useMemo(() => {
    if (!searchQuery) return RACES_CATALOG;
    const q = searchQuery.toLowerCase();
    return RACES_CATALOG.filter(
      r => r.name.toLowerCase().includes(q) || 
           r.city.toLowerCase().includes(q) || 
           r.country.toLowerCase().includes(q) ||
           r.distance.toLowerCase().includes(q) ||
           r.modality.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Carrera activa actual según la pestaña
  const currentGoal = React.useMemo(() => {
    if (activeTab === 'catalog' && selectedRace) {
      return {
        name: selectedRace.name,
        date: selectedRace.estimatedDate,
        distance: selectedRace.distance,
        modality: selectedRace.modality,
        location: `${selectedRace.city}, ${selectedRace.country}`
      };
    } else {
      return {
        name: customName || 'Mi Desafío Multisport',
        date: customDate || '2027-10-18',
        distance: customDistance,
        modality: customModality,
        location: 'Carrera Independiente'
      };
    }
  }, [activeTab, selectedRace, customName, customDistance, customModality, customDate]);

  // Calcular semanas restantes
  const weeksRemaining = React.useMemo(() => {
    if (!currentGoal.date) return 20;
    const target = new Date(currentGoal.date);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return Math.max(1, diffWeeks);
  }, [currentGoal.date]);

  // Calcular distribución de fases (Opción 2: Tactical / Performance)
  const phases = React.useMemo(() => {
    const total = weeksRemaining;
    if (total < 4) {
      return [
        { name: 'Puesta a punto exprés', weeks: total, color: 'bg-emerald-500', desc: 'Ajuste directo para competición' }
      ];
    }

    const phase1 = Math.round(total * 0.30); // Acondicionamiento Anatómico
    const phase2 = Math.round(total * 0.40); // Sobrecarga Progresiva
    const phase3 = Math.round(total * 0.20); // Bloque de Intensidad Máxima
    const phase4 = total - phase1 - phase2 - phase3; // Tapering Biométrica

    return [
      { name: 'Acondicionamiento Anatómico', weeks: phase1, color: 'bg-cyan-500', desc: 'Base aeróbica Z1/Z2 y adaptación tendinosa' },
      { name: 'Sobrecarga Progresiva', weeks: phase2, color: 'bg-amber-500', desc: 'Aumento de TSS, series tempo Z3 y fuerza' },
      { name: 'Intensidad Máxima', weeks: phase3, color: 'bg-rose-500', desc: 'VO2Max Z4, simulaciones y transiciones brick' },
      { name: 'Tapering Biométrica', weeks: phase4, color: 'bg-emerald-500', desc: 'Supercompensación y frescura TSB positiva' }
    ];
  }, [weeksRemaining]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await saveRaceGoalAndPlan({
        target_race_name: currentGoal.name,
        target_race_date: currentGoal.date,
        target_race_distance: currentGoal.distance,
        target_race_modality: currentGoal.modality
      });
      if (result && result.error) {
        console.error('Error del servidor:', result.error);
        setLoading(false);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error al guardar objetivo:', error);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl space-y-8">
      {/* Pestañas de Navegación */}
      <div className="flex bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800/80 max-w-md mx-auto shadow-2xl">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all ${
            activeTab === 'catalog'
              ? 'bg-zinc-800 text-cyan-400 shadow-md border border-zinc-700/50'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Catálogo Oficial</span>
        </button>

        <button
          onClick={() => setActiveTab('custom')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all ${
            activeTab === 'custom'
              ? 'bg-zinc-800 text-cyan-400 shadow-md border border-zinc-700/50'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Desafío a Medida</span>
        </button>
      </div>

      {/* Contenedor Principal en Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Panel Izquierdo: Selección / Formulario (7 columnas) */}
        <div className="lg:col-span-7 space-y-6">
          {activeTab === 'catalog' ? (
            <ProCard className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
                <div>
                  <h2 className="text-lg font-medium text-zinc-100">Pruebas Homologadas</h2>
                  <p className="text-xs text-zinc-400 mt-0.5">Selecciona tu competición en el circuito internacional</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 font-medium">
                  {RACES_CATALOG.length} Carreras
                </span>
              </div>

              {/* Barra de Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar por ciudad, país, franquicia, distancia o modalidad (ej. Acuabike)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>

              {/* Lista de Carreras */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredCatalog.map((race) => {
                  const isSelected = selectedRace?.id === race.id;
                  return (
                    <div
                      key={race.id}
                      onClick={() => setSelectedRace(race)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-800/80 border-cyan-500 shadow-lg shadow-cyan-950/20'
                          : 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700/80'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-zinc-950 text-xs shadow-md shrink-0"
                          style={{ backgroundColor: race.logoBg }}
                        >
                          {race.distance === 'half' ? '70.3' : race.distance === 'full' ? 'FULL' : race.distance.toUpperCase().slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-zinc-100">{race.name}</h3>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-cyan-400 font-medium uppercase tracking-wider border border-zinc-700">
                              {race.modality}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">{race.city}, {race.country} • {race.month}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-zinc-500">{race.estimatedDate}</span>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-cyan-400 border-cyan-400 text-zinc-950' : 'border-zinc-700'}`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ProCard>
          ) : (
            <ProCard className="space-y-6">
              <div className="border-b border-zinc-800/80 pb-4">
                <h2 className="text-lg font-medium text-zinc-100">Configuración a Medida</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Define los parámetros de tu propio desafío deportivo</p>
              </div>

              {/* Formulario */}
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-2 uppercase tracking-wider">
                    Nombre de la Prueba
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Acuabike de mi Ciudad 2027"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                {/* Selector de Modalidad Multisport */}
                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-2 uppercase tracking-wider">
                    Modalidad Deportiva (Multisport)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {[
                      { label: 'Triatlón', val: 'triatlon', desc: '🏊 🚴 🏃', color: 'border-cyan-500 text-cyan-400' },
                      { label: 'Duatlón', val: 'duatlon', desc: '🏃 🚴 🏃', color: 'border-emerald-500 text-emerald-400' },
                      { label: 'Acuatlón', val: 'acuatlon', desc: '🏊 🏃', color: 'border-blue-500 text-blue-400' },
                      { label: 'Acuabike', val: 'acuabike', desc: '🏊 🚴', color: 'border-teal-500 text-teal-400' },
                      { label: 'Cross', val: 'cross', desc: '🏊 🌲 🏃', color: 'border-lime-500 text-lime-400' },
                    ].map((m) => (
                      <button
                        key={m.val}
                        type="button"
                        onClick={() => setCustomModality(m.val as any)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                          customModality === m.val
                            ? `bg-zinc-800 ${m.color} shadow-md`
                            : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase tracking-wider">{m.label}</span>
                        <span className="text-xs mt-1">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-2 uppercase tracking-wider">
                    Distancia Objetivo
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Sprint', val: 'sprint', desc: 'Corta dist.' },
                      { label: 'Olímpico', val: 'olimpico', desc: 'Estándar' },
                      { label: 'Half 70.3', val: 'half', desc: 'Media dist.' },
                      { label: 'Full', val: 'full', desc: 'Larga dist.' },
                    ].map((d) => (
                      <button
                        key={d.val}
                        type="button"
                        onClick={() => setCustomDistance(d.val as any)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                          customDistance === d.val
                            ? 'bg-zinc-800 border-cyan-500 text-cyan-400 shadow-md'
                            : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase tracking-wider">{d.label}</span>
                        <span className="text-[10px] text-zinc-500 mt-1">{d.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-400 block mb-2 uppercase tracking-wider">
                    Fecha de la Competición
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl pl-10 pr-4 py-3 text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </ProCard>
          )}
        </div>

        {/* Panel Derecho: Previsualización y Periodización (5 columnas) */}
        <div className="lg:col-span-5 space-y-6 sticky top-24">
          <ProCard className="space-y-6 border-cyan-500/20 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 backdrop-blur-xl">
            
            {/* Cabecera del Objetivo */}
            <div className="flex justify-between items-start border-b border-zinc-800/80 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Objetivo de Temporada
                  </span>
                </div>
                <h3 className="text-xl font-medium text-zinc-50 mt-2 line-clamp-1">
                  {currentGoal.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-cyan-400 font-medium uppercase tracking-wider border border-zinc-700">
                    {currentGoal.modality}
                  </span>
                  <span className="text-xs text-zinc-400 capitalize">
                    • {currentGoal.distance} • {currentGoal.location}
                  </span>
                </div>
              </div>

              {/* Badge de Semanas */}
              <div className="bg-zinc-950/80 px-4 py-2 rounded-xl border border-zinc-800 text-center shadow-inner">
                <span className="text-2xl font-light text-cyan-400 block tracking-tight">
                  {weeksRemaining}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium block">
                  Semanas
                </span>
              </div>
            </div>

            {/* Barra de Periodización Dinámica */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-zinc-300">Periodización Fisiológica</span>
                <span className="text-zinc-500 font-mono text-[10px]">Opción 2: Tactical / Performance</span>
              </div>

              {/* Barra Visual */}
              <div className="flex gap-1 h-3 bg-zinc-950 rounded-full overflow-hidden p-0.5 border border-zinc-800/80">
                {phases.map((p, i) => (
                  <div
                    key={i}
                    className={`h-full first:rounded-l-full last:rounded-r-full transition-all duration-500 ${p.color}`}
                    style={{ width: `${Math.max(5, (p.weeks / weeksRemaining) * 100)}%` }}
                    title={`${p.name}: ${p.weeks} semanas`}
                  />
                ))}
              </div>

              {/* Leyenda de Fases */}
              <div className="space-y-2.5 pt-2">
                {phases.map((p, i) => (
                  <div key={i} className="flex items-start justify-between gap-4 bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/40">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${p.color} shrink-0`} />
                      <div>
                        <span className="text-xs font-semibold text-zinc-200 block">{p.name}</span>
                        <span className="text-[10px] text-zinc-500 block leading-tight mt-0.5">{p.desc}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-zinc-400 font-medium shrink-0 bg-zinc-900/80 px-2 py-1 rounded-md border border-zinc-800">
                      {p.weeks} sem
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botón de Acción */}
            <div className="pt-4">
              <AnimatedButton
                variant="primary"
                className="w-full py-4 text-sm font-semibold tracking-wide shadow-xl shadow-cyan-950/30"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Generando Calendario...' : 'Confirmar Objetivo y Comenzar'}
              </AnimatedButton>
            </div>

          </ProCard>
        </div>

      </div>
    </div>
  );
}
