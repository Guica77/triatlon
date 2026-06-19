'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, X, Save, AlertCircle } from 'lucide-react';
import { StepAmbition } from '@/components/onboarding/steps/step-ambition';
import { RACES_CATALOG, RaceCatalogItem, MultisportModality } from '@/lib/races-data';
import { saveRaceGoalAndPlan } from '@/app/(app)/onboarding/actions';
import { AnimatedButton } from '@/components/ui/animated-button';
import { useRouter } from 'next/navigation';

export function ObjectiveConfigModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // State for StepAmbition
  const [athleteLevel, setAthleteLevel] = React.useState('intermedio');
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
    setError(null);
    try {
      const result = await saveRaceGoalAndPlan({
        target_race_name: currentGoal.name,
        target_race_date: currentGoal.date,
        target_race_distance: currentGoal.distance as any,
        target_race_modality: currentGoal.modality,
        target_finish_time: targetFinishTime,
        baseline_training_hours: baselineHours,
        swim_weekly_hours: swimHours,
        bike_weekly_hours: bikeHours,
        run_weekly_hours: runHours,
        target_swim_time: targetSwimTime || undefined,
        target_bike_time: targetBikeTime || undefined,
        target_run_time: targetRunTime || undefined,
        athlete_level: athleteLevel
      });

      if (result && result.error) {
        setError(result.error);
        setLoading(false);
      } else {
        router.refresh();
        onClose();
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Error guardando el objetivo');
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white border border-zinc-200 rounded-2xl shadow-2xl p-6 scrollbar-none"
        >
          <button 
            onClick={onClose}
            title="Cerrar"
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 border border-zinc-200 text-zinc-550 hover:text-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Define tu Objetivo</h2>
              <p className="text-sm text-zinc-500">Selecciona tu carrera y disponibilidad para que la IA recalibre tu plan.</p>
            </div>
          </div>

          <div className="bg-zinc-50 p-4 sm:p-6 rounded-xl border border-zinc-200">
            <StepAmbition
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filteredCatalog={filteredCatalog}
              selectedRace={selectedRace}
              setSelectedRace={setSelectedRace}
              customName={customName}
              setCustomName={setCustomName}
              customDate={customDate}
              setCustomDate={setCustomDate}
              customDistance={customDistance}
              setCustomDistance={setCustomDistance}
              customModality={customModality}
              setCustomModality={setCustomModality}
              athleteLevel={athleteLevel}
              setAthleteLevel={setAthleteLevel}
              baselineHours={baselineHours}
              setBaselineHours={setBaselineHours}
              targetFinishTime={targetFinishTime}
              setTargetFinishTime={setTargetFinishTime}
              targetSwimTime={targetSwimTime}
              setTargetSwimTime={setTargetSwimTime}
              targetBikeTime={targetBikeTime}
              setTargetBikeTime={setTargetBikeTime}
              targetRunTime={targetRunTime}
              setTargetRunTime={setTargetRunTime}
              swimHours={swimHours}
              setSwimHours={setSwimHours}
              bikeHours={bikeHours}
              setBikeHours={setBikeHours}
              runHours={runHours}
              setRunHours={setRunHours}
              onNext={() => {}} // Not used inside the modal
            />
          </div>

          {error && (
            <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-650">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="mt-6 flex justify-end gap-3 border-t border-zinc-150 pt-6">
            <AnimatedButton
              variant="ghost"
              onClick={onClose}
              className="text-zinc-600 hover:text-zinc-800 bg-zinc-50 border border-zinc-200"
            >
              Cancelar
            </AnimatedButton>
            <AnimatedButton
              variant="primary"
              onClick={handleSave}
              disabled={loading}
              className="!bg-cyan-500 hover:!bg-cyan-400 !text-white flex items-center gap-2 font-bold"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Calculando Plan...' : 'Guardar y Recalibrar'}</span>
            </AnimatedButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
