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

export function HybridWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);

  // Step 1: Physiological & Planning Preference
  const [wantsCoach, setWantsCoach] = React.useState<boolean>(false);
  const [inviteCode, setInviteCode] = React.useState('');
  const [currentFtp, setCurrentFtp] = React.useState('');
  const [currentSwimPace, setCurrentSwimPace] = React.useState('');
  const [currentRunPace, setCurrentRunPace] = React.useState('');
  const [preferredIngredients, setPreferredIngredients] = React.useState<string[]>([]);
  const [allergies, setAllergies] = React.useState<string[]>([]);
  const [dislikedIngredients, setDislikedIngredients] = React.useState<string[]>([]);

  // Step 2: Virtual Garage
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

      const result = await saveRaceGoalAndPlan({
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
      const result = await saveRaceGoalAndPlan({
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
        setLoading(false);
      } else {
        window.location.href = `/api/auth/telemetry/connect?provider=${provider}`;
      }
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  // Determine which steps to show
  const totalSteps = wantsCoach ? 2 : 3;

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
                {num === 1 ? 'Fisiología' : num === 2 ? (wantsCoach ? 'Entrenador' : 'Garaje') : 'Conexión'}
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
            currentFtp={currentFtp}
            setCurrentFtp={setCurrentFtp}
            currentSwimPace={currentSwimPace}
            setCurrentSwimPace={setCurrentSwimPace}
            currentRunPace={currentRunPace}
            setCurrentRunPace={setCurrentRunPace}
            onPrev={() => setStep(1)}
            onNext={() => setStep(2)}
            preferredIngredients={preferredIngredients}
            setPreferredIngredients={setPreferredIngredients}
            allergies={allergies}
            setAllergies={setAllergies}
            dislikedIngredients={dislikedIngredients}
            setDislikedIngredients={setDislikedIngredients}
          />
        )}

        {step === 2 && wantsCoach && (
          <StepCoachSelection
            inviteCode={inviteCode}
            setInviteCode={setInviteCode}
            onPrev={() => setStep(1)}
            onNext={() => handleSave(false)}
            onSearchDirectory={() => handleSave(true)}
            loading={loading}
          />
        )}

        {step === 2 && !wantsCoach && (
          <StepGarage
            virtualGarage={virtualGarage}
            toggleGear={toggleGear}
            onPrev={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && !wantsCoach && (
          <StepTelemetry
            loading={loading}
            onPrev={() => setStep(2)}
            handleSave={() => handleSave(false)}
            handleSaveAndConnect={handleSaveAndConnect}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
