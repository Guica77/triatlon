'use client';

import * as React from 'react';
import { RACES_CATALOG, RaceCatalogItem, MultisportModality } from '@/lib/races-data';
import { saveRaceGoalAndPlan } from '@/app/(app)/onboarding/actions';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';

import { StepPhysiology } from '@/components/onboarding/steps/step-physiology';
import { StepGarage } from '@/components/onboarding/steps/step-garage';
import { StepTelemetry } from '@/components/onboarding/steps/step-telemetry';
import { StepCoachSelection } from '@/components/onboarding/steps/step-coach-selection';
import { StepAmbition } from '@/components/onboarding/steps/step-ambition';

export function HybridWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  // Step 1: Objetivo / Ambición (Race Goal)
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
           r.country.toLowerCase().includes(q) ||
           r.distance.toLowerCase().includes(q) ||
           r.modality.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  // Step 2: Physiological & Planning Preference
  const [wantsCoach, setWantsCoach] = React.useState<boolean>(false);
  const [inviteCode, setInviteCode] = React.useState('');
  const [currentFtp, setCurrentFtp] = React.useState('');
  const [currentSwimPace, setCurrentSwimPace] = React.useState('');
  const [currentRunPace, setCurrentRunPace] = React.useState('');
  const [preferredIngredients, setPreferredIngredients] = React.useState<string[]>([]);
  const [allergies, setAllergies] = React.useState<string[]>([]);
  const [dislikedIngredients, setDislikedIngredients] = React.useState<string[]>([]);

  // Step 3: Virtual Garage
  const [virtualGarage, setVirtualGarage] = React.useState<string[]>([]);

  const toggleGear = (id: string) => {
    setVirtualGarage(prev => 
      prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]
    );
  };

  const handleSave = async (forceNoCode: boolean = false) => {
    setLoading(true);
    try {
      // Si quiere coach y ha puesto un código (y no forzamos omitirlo), intentamos vincularlo primero
      if (wantsCoach && inviteCode.trim() && !forceNoCode) {
        const { linkCoachByCode } = await import('@/app/(app)/chat/actions');
        const linkRes = await linkCoachByCode(inviteCode);
        if (linkRes.error) {
          alert(linkRes.error || 'Código de entrenador inválido');
          setLoading(false);
          return;
        }
      }

      const currentGoal = activeTab === 'catalog' && selectedRace
        ? {
            name: selectedRace.name,
            date: selectedRace.estimatedDate,
            distance: selectedRace.distance,
            modality: selectedRace.modality
          }
        : {
            name: customName || 'Mi Desafío',
            date: customDate || '2027-10-18',
            distance: customDistance,
            modality: customModality
          };

      const result = await saveRaceGoalAndPlan({
        target_race_name: currentGoal.name,
        target_race_date: currentGoal.date,
        target_race_distance: currentGoal.distance as any,
        target_race_modality: currentGoal.modality,
        target_finish_time: targetFinishTime || undefined,
        baseline_training_hours: baselineHours,
        swim_weekly_hours: swimHours,
        bike_weekly_hours: bikeHours,
        run_weekly_hours: runHours,
        target_swim_time: targetSwimTime || undefined,
        target_bike_time: targetBikeTime || undefined,
        target_run_time: targetRunTime || undefined,
        athlete_level: athleteLevel,
        current_ftp: currentFtp ? parseInt(currentFtp) : undefined,
        current_swim_pace: currentSwimPace || undefined,
        current_run_pace: currentRunPace || undefined,
        virtual_garage: virtualGarage,
        wants_coach: wantsCoach,
        preferred_ingredients: preferredIngredients,
        allergies,
        disliked_ingredients: dislikedIngredients,
      });

      if (result && result.error) {
        console.error('Error:', result.error);
        alert(`Error al guardar objetivos: ${result.error}`);
        setLoading(false);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const handleSaveAndConnect = async (provider: 'strava' | 'garmin' | 'coros' = 'strava') => {
    setLoading(true);
    try {
      const currentGoal = activeTab === 'catalog' && selectedRace
        ? {
            name: selectedRace.name,
            date: selectedRace.estimatedDate,
            distance: selectedRace.distance,
            modality: selectedRace.modality
          }
        : {
            name: customName || 'Mi Desafío',
            date: customDate || '2027-10-18',
            distance: customDistance,
            modality: customModality
          };

      const result = await saveRaceGoalAndPlan({
        target_race_name: currentGoal.name,
        target_race_date: currentGoal.date,
        target_race_distance: currentGoal.distance as any,
        target_race_modality: currentGoal.modality,
        target_finish_time: targetFinishTime || undefined,
        baseline_training_hours: baselineHours,
        swim_weekly_hours: swimHours,
        bike_weekly_hours: bikeHours,
        run_weekly_hours: runHours,
        target_swim_time: targetSwimTime || undefined,
        target_bike_time: targetBikeTime || undefined,
        target_run_time: targetRunTime || undefined,
        athlete_level: athleteLevel,
        current_ftp: currentFtp ? parseInt(currentFtp) : undefined,
        current_swim_pace: currentSwimPace || undefined,
        current_run_pace: currentRunPace || undefined,
        virtual_garage: virtualGarage,
        wants_coach: wantsCoach,
        preferred_ingredients: preferredIngredients,
        allergies,
        disliked_ingredients: dislikedIngredients,
      });

      if (result && result.error) {
        console.error('Error:', result.error);
        alert(`Error al guardar objetivos: ${result.error}`);
        setLoading(false);
      } else {
        window.location.href = `/api/auth/telemetry/connect?provider=${provider}&onboarding=true`;
      }
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  // Determine which steps to show
  const totalSteps = wantsCoach ? 3 : 4;

  return (
    <div className="w-full max-w-4xl space-y-8">
      {/* Stepper Header */}
      <div className="flex items-center justify-between relative mb-12 max-w-2xl mx-auto">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-zinc-800 -z-10" />
        {Array.from({ length: totalSteps }).map((_, i) => {
          const num = i + 1;
          return (
            <button
              key={num}
              type="button"
              onClick={() => setStep(num)}
              className="flex flex-col items-center gap-2 bg-[var(--color-background)] px-4 cursor-pointer focus:outline-none group"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-200 ${
                step >= num 
                  ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.5)] scale-105' 
                  : 'bg-zinc-900 border-zinc-700 text-zinc-500 group-hover:border-zinc-500 group-hover:text-zinc-300'
              }`}>
                {step > num ? <Check className="w-5 h-5" /> : num}
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-semibold transition-colors duration-200 ${
                step >= num ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-zinc-300'
              }`}>
                {num === 1 ? 'Fisiología' : num === 2 ? 'Objetivo' : num === 3 ? (wantsCoach ? 'Entrenador' : 'Garaje') : 'Conexión'}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <StepPhysiology
            wantsCoach={wantsCoach}
            setWantsCoach={setWantsCoach}
            inviteCode={inviteCode}
            setInviteCode={setInviteCode}
            onPrev={() => setStep(1)}
            onNext={() => setStep(2)}
            preferredIngredients={preferredIngredients}
            setPreferredIngredients={setPreferredIngredients}
            allergies={allergies}
            setAllergies={setAllergies}
            dislikedIngredients={dislikedIngredients}
            setDislikedIngredients={setDislikedIngredients}
            isFirstStep={true}
          />
        )}

        {step === 2 && (
          <StepAmbition
            wantsCoach={wantsCoach}
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
            currentFtp={currentFtp}
            setCurrentFtp={setCurrentFtp}
            currentSwimPace={currentSwimPace}
            setCurrentSwimPace={setCurrentSwimPace}
            currentRunPace={currentRunPace}
            setCurrentRunPace={setCurrentRunPace}
            onPrev={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && wantsCoach && (
          <StepCoachSelection
            inviteCode={inviteCode}
            setInviteCode={setInviteCode}
            onPrev={() => setStep(2)}
            onNext={() => handleSave(false)}
            onSearchDirectory={() => handleSave(true)}
            loading={loading}
          />
        )}

        {step === 3 && !wantsCoach && (
          <StepGarage
            virtualGarage={virtualGarage}
            toggleGear={toggleGear}
            onPrev={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}

        {step === 4 && !wantsCoach && (
          <StepTelemetry
            loading={loading}
            onPrev={() => setStep(3)}
            handleSave={() => handleSave(false)}
            handleSaveAndConnect={handleSaveAndConnect}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
