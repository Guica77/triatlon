'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Loader2, Sun, Heart, Activity, BrainCircuit, Check } from 'lucide-react';
import { updateBiometrics } from '@/app/(app)/dashboard/biometrics-actions';

interface MorningCheckInModalProps {
  hasCompletedCheckIn: boolean;
  hasGarminSync: boolean;
}

export function MorningCheckInModal({ hasCompletedCheckIn, hasGarminSync }: MorningCheckInModalProps) {
  // Start open if they haven't completed it today
  const [isOpen, setIsOpen] = React.useState(!hasCompletedCheckIn);
  const [loading, setLoading] = React.useState(false);

  // States
  const [fatigue, setFatigue] = React.useState(3);
  const [stress, setStress] = React.useState(3);
  const [sleepHours, setSleepHours] = React.useState(7.5);
  const [hrv, setHrv] = React.useState(65);
  const [rhr, setRhr] = React.useState(52);

  // Prevent closing by clicking outside if they haven't checked in
  const handleOpenChange = (open: boolean) => {
    if (!hasCompletedCheckIn && !open) return; // Force them to complete it
    setIsOpen(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Only send sleep/hrv/rhr if Garmin is NOT synced, otherwise we rely on the Garmin data
    // For this prototype, we'll send it all, and the action will handle it.
    await updateBiometrics({
      fatigue_rating: fatigue,
      stress_level: stress,
      ...( !hasGarminSync && {
        sleep_hours: sleepHours,
        hrv,
        rhr
      })
    });
    
    setLoading(false);
    setIsOpen(false);
  };

  const getFatigueLabel = (val: number) => {
    switch (val) {
      case 1: return 'Destrozado 🥵';
      case 2: return 'Muy cansado 😩';
      case 3: return 'Normal 😐';
      case 4: return 'Fresco 🙂';
      case 5: return 'A tope 🚀';
      default: return '';
    }
  };

  const getStressLabel = (val: number) => {
    switch (val) {
      case 1: return 'Muy alto 🤯';
      case 2: return 'Alto 😰';
      case 3: return 'Normal 😐';
      case 4: return 'Bajo 🙂';
      case 5: return 'Zen 🧘‍♂️';
      default: return '';
    }
  };

  // If they already completed it and we don't want to show a button, we can return null.
  // Or we can return a button to let them edit it.
  if (hasCompletedCheckIn && !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-6 bg-zinc-50/95 backdrop-blur-xl sm:rounded-3xl border-0 sm:border border-zinc-200">
        <DialogHeader className="mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-3 mx-auto shadow-lg shadow-orange-500/20">
            <Sun className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-2xl font-black text-center text-zinc-900 tracking-tight">
            Buenos días
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500 font-medium">
            Completa tu check-in matutino para calcular tu Readiness.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="space-y-4">
            {/* Fatiga */}
            <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-500" />
                  Sensación Muscular
                </label>
                <span className="text-sm font-black text-zinc-800">{getFatigueLabel(fatigue)}</span>
              </div>
              <input 
                type="range" 
                min="1" max="5" 
                value={fatigue} 
                onChange={(e) => setFatigue(Number(e.target.value))}
                className="w-full accent-rose-500"
                aria-label="Nivel de fatiga muscular"
                title="Nivel de fatiga muscular"
              />
              <div className="flex justify-between mt-2 text-[10px] font-bold text-zinc-400">
                <span>Mucha Fatiga</span>
                <span>Fresco</span>
              </div>
            </div>

            {/* Estrés */}
            <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                  <BrainCircuit className="w-4 h-4 text-indigo-500" />
                  Estrés Mental
                </label>
                <span className="text-sm font-black text-zinc-800">{getStressLabel(stress)}</span>
              </div>
              <input 
                type="range" 
                min="1" max="5" 
                value={stress} 
                onChange={(e) => setStress(Number(e.target.value))}
                className="w-full accent-indigo-500"
                aria-label="Nivel de estrés mental"
                title="Nivel de estrés mental"
              />
              <div className="flex justify-between mt-2 text-[10px] font-bold text-zinc-400">
                <span>Estresado</span>
                <span>Tranquilo</span>
              </div>
            </div>

            {/* Si NO tiene garmin conectado, pedimos manual el sueño y HRV */}
            {!hasGarminSync && (
              <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Horas de Sueño</label>
                    <span className="text-sm font-black text-zinc-800">{sleepHours}h</span>
                  </div>
                  <input 
                    type="range" 
                    min="3" max="12" step="0.5"
                    value={sleepHours} 
                    onChange={(e) => setSleepHours(Number(e.target.value))}
                    className="w-full accent-blue-500"
                    aria-label="Horas de sueño"
                    title="Horas de sueño"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">HRV (ms)</label>
                    <input 
                      type="number" 
                      value={hrv} 
                      onChange={(e) => setHrv(Number(e.target.value))}
                      className="w-full p-2 text-sm font-bold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-lg outline-none"
                      aria-label="Variabilidad de Frecuencia Cardíaca (HRV)"
                      title="Variabilidad de Frecuencia Cardíaca"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">FC Reposo</label>
                    <input 
                      type="number" 
                      value={rhr} 
                      onChange={(e) => setRhr(Number(e.target.value))}
                      className="w-full p-2 text-sm font-bold text-zinc-800 bg-zinc-50 border border-zinc-200 rounded-lg outline-none"
                      aria-label="Frecuencia Cardíaca en Reposo"
                      title="Frecuencia Cardíaca en Reposo"
                    />
                  </div>
                </div>
              </div>
            )}
            
            {hasGarminSync && (
              <p className="text-[10px] font-bold text-zinc-400 text-center flex items-center justify-center gap-1">
                <Heart className="w-3 h-3" /> Datos de sueño y pulso obtenidos de Garmin
              </p>
            )}
          </div>

          <AnimatedButton 
            type="submit" 
            disabled={loading}
            className="w-full py-4 text-base bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            Completar Check-in
          </AnimatedButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
