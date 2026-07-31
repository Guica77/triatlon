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
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

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
        { name: 'Puesta a punto exprés', weeks: total, color: 'bg-bike', desc: 'Ajuste directo para competición' }
      ];
    }

    const phase1 = Math.round(total * 0.30); // Acondicionamiento Anatómico
    const phase2 = Math.round(total * 0.40); // Sobrecarga Progresiva
    const phase3 = Math.round(total * 0.20); // Bloque de Intensidad Máxima
    const phase4 = total - phase1 - phase2 - phase3; // Tapering Biométrica

    return [
      { name: 'Acondicionamiento Anatómico', weeks: phase1, color: 'bg-swim', desc: 'Base aeróbica Z1/Z2 y adaptación tendinosa' },
      { name: 'Sobrecarga Progresiva', weeks: phase2, color: 'bg-warning', desc: 'Aumento de TSS, series tempo Z3 y fuerza' },
      { name: 'Intensidad Máxima', weeks: phase3, color: 'bg-run', desc: 'VO2Max Z4, simulaciones y transiciones brick' },
      { name: 'Tapering Biométrica', weeks: phase4, color: 'bg-bike', desc: 'Supercompensación y frescura TSB positiva' }
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

  if (!isMounted) {
    return (
      <div className="w-full max-w-5xl space-y-8 min-h-[400px] flex items-center justify-center bg-surface-app/50 rounded-2xl animate-pulse">
        <div className="w-8 h-8 rounded-full border-4 border-swim border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl space-y-8">
      {/* Pestañas de Navegación */}
      <div className="flex bg-surface-card/80 p-1.5 rounded-2xl border border-border-subtle/80 max-w-md mx-auto shadow-elevated">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all ${
            activeTab === 'catalog'
              ? 'bg-surface-hover text-swim  border border-border-default'
              : 'text-text-secondary hover:text-text-muted'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Catálogo Oficial</span>
        </button>

        <button
          onClick={() => setActiveTab('custom')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all ${
            activeTab === 'custom'
              ? 'bg-surface-hover text-swim  border border-border-default'
              : 'text-text-secondary hover:text-text-muted'
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
              <div className="flex items-center justify-between border-b border-border-subtle/80 pb-4">
                <div>
                  <h2 className="text-lg font-medium text-text-primary">Pruebas Homologadas</h2>
                  <p className="text-xs text-text-muted mt-0.5">Selecciona tu competición en el circuito internacional</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-swim/10 text-swim border border-swim/30 font-medium">
                  {RACES_CATALOG.length} Carreras
                </span>
              </div>

              {/* Barra de Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Buscar por ciudad, país, franquicia, distancia o modalidad (ej. Acuabike)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-app border border-border-subtle/80 rounded-xl pl-10 pr-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-swim/50 transition-colors"
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
                          ? 'bg-surface-hover/80 border-swim'
                          : 'bg-surface-app/40 border-border-subtle/60 hover:border-border-default'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* We use tailwind background classes mapped in races-data.ts instead of inline style */}
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-zinc-950 text-xs  shrink-0 ${race.logoBg}`}
                        >
                          {race.distance === 'half' ? '70.3' : race.distance === 'full' ? 'FULL' : race.distance.toUpperCase().slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-text-primary">{race.name}</h3>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-surface-hover text-swim font-medium uppercase tracking-wider border border-border-default">
                              {race.modality}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted mt-0.5">{race.city}, {race.country} • {race.month}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-text-secondary">{race.estimatedDate}</span>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-swim border-swim text-white' : 'border-border-default'}`}>
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
              <div className="border-b border-border-subtle/80 pb-4">
                <h2 className="text-lg font-medium text-text-primary">Configuración a Medida</h2>
                <p className="text-xs text-text-muted mt-0.5">Define los parámetros de tu propio desafío deportivo</p>
              </div>

              {/* Formulario */}
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-text-muted block mb-2 uppercase tracking-wider">
                    Nombre de la Prueba
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Acuabike de mi Ciudad 2027"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-surface-app border border-border-subtle/80 rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-swim/50 transition-colors"
                  />
                </div>

                {/* Selector de Modalidad Multisport */}
                <div>
                  <label className="text-xs font-medium text-text-muted block mb-2 uppercase tracking-wider">
                    Modalidad Deportiva (Multisport)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {[
                      { label: 'Triatlón', val: 'triatlon', desc: '🏊 🚴 🏃', color: 'border-swim text-swim' },
                      { label: 'Duatlón', val: 'duatlon', desc: '🏃 🚴 🏃', color: 'border-bike text-bike' },
                      { label: 'Acuatlón', val: 'acuatlon', desc: '🏊 🏃', color: 'border-swim text-swim' },
                      { label: 'Acuabike', val: 'acuabike', desc: '🏊 🚴', color: 'border-bike text-bike' },
                      { label: 'Cross', val: 'cross', desc: '🏊 🌲 🏃', color: 'border-warning text-warning' },
                    ].map((m) => (
                      <button
                        key={m.val}
                        type="button"
                        onClick={() => setCustomModality(m.val as any)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                          customModality === m.val
                            ? `bg-surface-hover ${m.color} `
                            : 'bg-surface-app/60 border-border-subtle/80 text-text-muted hover:border-border-default'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase tracking-wider">{m.label}</span>
                        <span className="text-xs mt-1">{m.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-text-muted block mb-2 uppercase tracking-wider">
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
                            ? 'bg-surface-hover border-swim text-swim '
                            : 'bg-surface-app/60 border-border-subtle/80 text-text-muted hover:border-border-default'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase tracking-wider">{d.label}</span>
                        <span className="text-[10px] text-text-secondary mt-1">{d.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="custom-date-input" className="text-xs font-medium text-text-muted block mb-2 uppercase tracking-wider">
                    Fecha de la Competición
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-text-secondary" />
                    <input
                      id="custom-date-input"
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full bg-surface-app border border-border-subtle/80 rounded-xl pl-10 pr-4 py-3 text-sm text-text-primary focus:outline-none focus:border-swim/50 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </ProCard>
          )}
        </div>

        {/* Panel Derecho: Previsualización y Periodización (5 columnas) */}
        <div className="lg:col-span-5 space-y-6 sticky top-24">
          <ProCard className="space-y-6 border-swim/20 bg-gradient-to-b from-surface-card to-surface-app backdrop-blur-xl">
            
            {/* Cabecera del Objetivo */}
            <div className="flex justify-between items-start border-b border-border-subtle/80 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-swim" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Objetivo de Temporada
                  </span>
                </div>
                <h3 className="text-xl font-medium text-text-primary mt-2 line-clamp-1">
                  {currentGoal.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded bg-surface-hover text-swim font-medium uppercase tracking-wider border border-border-default">
                    {currentGoal.modality}
                  </span>
                  <span className="text-xs text-text-muted capitalize">
                    • {currentGoal.distance} • {currentGoal.location}
                  </span>
                </div>
              </div>

              {/* Badge de Semanas */}
              <div className="bg-surface-app/80 px-4 py-2 rounded-xl border border-border-subtle text-center shadow-inner">
                <span className="text-2xl font-light text-swim block tracking-tight">
                  {weeksRemaining}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-text-secondary font-medium block">
                  Semanas
                </span>
              </div>
            </div>

            {/* Barra de Periodización Dinámica */}
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-text-muted">Periodización Fisiológica</span>
                <span className="text-text-secondary font-mono text-[10px]">Opción 2: Tactical / Performance</span>
              </div>

              {/* Barra Visual */}
              <div className="flex gap-1 h-3 bg-surface-app rounded-full overflow-hidden p-0.5 border border-border-subtle/80">
                {phases.map((p, i) => (
                  <React.Fragment key={i}>
                    <style>{`
                      .phase-bar-${i} { width: ${Math.max(5, (p.weeks / weeksRemaining) * 100)}%; }
                    `}</style>
                    <div
                      className={`h-full first:rounded-l-full last:rounded-r-full transition-all duration-500 ${p.color} phase-bar-${i}`}
                      title={`${p.name}: ${p.weeks} semanas`}
                    />
                  </React.Fragment>
                ))}
              </div>

              {/* Leyenda de Fases */}
              <div className="space-y-2.5 pt-2">
                {phases.map((p, i) => (
                  <div key={i} className="flex items-start justify-between gap-4 bg-surface-app/40 p-2.5 rounded-xl border border-border-subtle/40">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full ${p.color} shrink-0`} />
                      <div>
                        <span className="text-xs font-semibold text-text-muted block">{p.name}</span>
                        <span className="text-[10px] text-text-secondary block leading-tight mt-0.5">{p.desc}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-text-muted font-medium shrink-0 bg-surface-card/80 px-2 py-1 rounded-md border border-border-subtle">
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
                className="w-full py-4 text-sm font-semibold tracking-wide shadow-elevated"
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
