'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Sun, Heart, Activity, BrainCircuit, Check, Flame } from 'lucide-react';
import { updateBiometrics } from '@/app/(app)/dashboard/biometrics-actions';

interface MorningCheckInModalProps {
  hasCompletedCheckIn: boolean;
  hasGarminSync: boolean;
}

const STORAGE_KEY = 'triatlonpro_checkin_date';
const STREAK_KEY = 'triatlonpro_checkin_streak';

function getLastCheckinDate(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function setLastCheckinDate(date: string) {
  try { localStorage.setItem(STORAGE_KEY, date); } catch { /* noop */ }
}

function getStoredStreak(): number {
  try { return parseInt(localStorage.getItem(STREAK_KEY) || '0', 10) || 0; } catch { return 0; }
}

function setStoredStreak(n: number) {
  try { localStorage.setItem(STREAK_KEY, String(n)); } catch { /* noop */ }
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/** Compute the new streak after a check-in today. */
function computeStreak(): number {
  const last = getLastCheckinDate();
  const stored = getStoredStreak();
  const today = getTodayStr();
  if (!last) return 1; // first check-in ever
  if (last === today) return stored || 1; // already checked in today
  if (last === getYesterdayStr()) return stored + 1; // consecutive day
  return 1; // gap broken
}

export function MorningCheckInModal({ hasCompletedCheckIn, hasGarminSync }: MorningCheckInModalProps) {
  const today = getTodayStr();
  const alreadyDoneToday = hasCompletedCheckIn || getLastCheckinDate() === today;

  const [isOpen, setIsOpen] = React.useState(!alreadyDoneToday);
  const [loading, setLoading] = React.useState(false);
  const [currentStreak, setCurrentStreak] = React.useState(0);

  const [fatigue, setFatigue] = React.useState(3);
  const [stress, setStress] = React.useState(3);
  const [sleepHours, setSleepHours] = React.useState(7.5);
  const [hrv, setHrv] = React.useState(65);
  const [rhr, setRhr] = React.useState(52);

  // Show the streak if we're continuing it (checked in yesterday or already today)
  React.useEffect(() => {
    const last = getLastCheckinDate();
    if (last === getYesterdayStr() || last === today) {
      setCurrentStreak(getStoredStreak());
    }
  }, [today]);

  // Prevent closing by clicking outside
  const handleOpenChange = (open: boolean) => {
    if (!open && !alreadyDoneToday) return; // Force completion
    setIsOpen(open);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    await updateBiometrics({
      fatigue_rating: fatigue,
      stress_level: stress,
      ...( !hasGarminSync && { sleep_hours: sleepHours, hrv, rhr })
    });

    const newStreak = computeStreak();
    setLastCheckinDate(today);
    setStoredStreak(newStreak);
    setCurrentStreak(newStreak);
    setLoading(false);
    setIsOpen(false);
  };

  // If already done today, don't render anything
  if (alreadyDoneToday && !isOpen) return null;

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

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-6 bg-surface-card sm:rounded-xl border border-border-default shadow-elevated">
        <DialogHeader className="mb-4">
          <div className="w-12 h-12 rounded-xl bg-coral-500/15 flex items-center justify-center mb-3 mx-auto">
            <Sun className="w-6 h-6 text-coral-500" />
          </div>
          <DialogTitle className="text-xl font-bold text-center text-text-primary tracking-tight">
            Buenos días
          </DialogTitle>
          <DialogDescription className="text-center text-text-secondary text-sm">
            Completa tu check-in matutino para calcular tu Readiness.
          </DialogDescription>

          {/* Streak badge */}
          {currentStreak > 0 && (
            <div className="flex justify-center mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-coral-500/10 border border-coral-500/20 text-coral-500 text-xs font-bold">
                <Flame className="w-3.5 h-3.5" />
                {currentStreak} {currentStreak === 1 ? 'día' : 'días'} seguidos
              </span>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-3">
            {/* Fatigue */}
            <div className="bg-surface-hover p-4 rounded-lg border border-border-subtle">
              <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-bold text-text-muted uppercase flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-run" />
                  Sensación Muscular
                </label>
                <span className="text-sm font-bold text-text-primary">{getFatigueLabel(fatigue)}</span>
              </div>
              <input type="range" min="1" max="5" value={fatigue} onChange={e => setFatigue(Number(e.target.value))}
                className="w-full accent-coral-500" aria-label="Nivel de fatiga muscular" />
              <div className="flex justify-between mt-1.5 text-[9px] font-medium text-text-muted">
                <span>Mucha Fatiga</span><span>Fresco</span>
              </div>
            </div>

            {/* Stress */}
            <div className="bg-surface-hover p-4 rounded-lg border border-border-subtle">
              <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-bold text-text-muted uppercase flex items-center gap-1.5">
                  <BrainCircuit className="w-3.5 h-3.5 text-swim" />
                  Estrés Mental
                </label>
                <span className="text-sm font-bold text-text-primary">{getStressLabel(stress)}</span>
              </div>
              <input type="range" min="1" max="5" value={stress} onChange={e => setStress(Number(e.target.value))}
                className="w-full accent-coral-500" aria-label="Nivel de estrés mental" />
              <div className="flex justify-between mt-1.5 text-[9px] font-medium text-text-muted">
                <span>Estresado</span><span>Tranquilo</span>
              </div>
            </div>

            {/* Sleep/HRV (manual if no Garmin) */}
            {!hasGarminSync && (
              <div className="bg-surface-hover p-4 rounded-lg border border-border-subtle space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase">Horas de Sueño</label>
                    <span className="text-sm font-bold text-text-primary">{sleepHours}h</span>
                  </div>
                  <input type="range" min="3" max="12" step="0.5" value={sleepHours} onChange={e => setSleepHours(Number(e.target.value))}
                    className="w-full accent-coral-500" aria-label="Horas de sueño" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-text-muted uppercase block mb-1">HRV (ms)</label>
                    <input type="number" value={hrv} onChange={e => setHrv(Number(e.target.value))}
                      className="w-full p-2 text-sm font-bold text-text-primary bg-surface-card border border-border-default rounded-lg outline-none focus:border-coral-500/40" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-muted uppercase block mb-1">FC Reposo</label>
                    <input type="number" value={rhr} onChange={e => setRhr(Number(e.target.value))}
                      className="w-full p-2 text-sm font-bold text-text-primary bg-surface-card border border-border-default rounded-lg outline-none focus:border-coral-500/40" />
                  </div>
                </div>
              </div>
            )}

            {hasGarminSync && (
              <p className="text-[10px] text-text-muted text-center flex items-center justify-center gap-1">
                <Heart className="w-3 h-3" /> Datos de sueño y pulso obtenidos de Garmin
              </p>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-bold text-white bg-coral-500 hover:bg-coral-600 shadow-button flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Completar Check-in
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
