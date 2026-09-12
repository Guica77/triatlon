'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Sun, Heart, Activity, BrainCircuit, Check, Flame } from 'lucide-react';
import { updateBiometrics } from '@/app/(app)/dashboard/biometrics-actions';

interface MorningCheckInModalProps {
  hasCompletedCheckIn: boolean;
  hasDeviceBiometrics: boolean;
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

export function MorningCheckInModal({ hasCompletedCheckIn, hasDeviceBiometrics }: MorningCheckInModalProps) {
  const today = getTodayStr();
  const alreadyDoneToday = hasCompletedCheckIn || getLastCheckinDate() === today;

  const [isOpen, setIsOpen] = React.useState(!alreadyDoneToday);
  const [loading, setLoading] = React.useState(false);
  const [currentStreak, setCurrentStreak] = React.useState(0);

  const [fatigue, setFatigue] = React.useState<number | null>(null);
  const [stress, setStress] = React.useState<number | null>(null);
  const [sleepHours, setSleepHours] = React.useState('');
  const [hrv, setHrv] = React.useState('');
  const [rhr, setRhr] = React.useState('');
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

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
    setErrorMessage(null);

    const manualMetrics = {
      sleep_hours: Number(sleepHours),
      hrv: Number(hrv),
      rhr: Number(rhr),
    };

    if (fatigue === null || stress === null || (!hasDeviceBiometrics && (!sleepHours || !hrv || !rhr))) {
      setErrorMessage('Completa tus sensaciones y las métricas de hoy. No usamos valores de ejemplo.');
      return;
    }

    setLoading(true);

    const result = await updateBiometrics({
      fatigue_rating: fatigue,
      stress_level: stress,
      ...(!hasDeviceBiometrics && manualMetrics),
    });

    if (result.error) {
      setErrorMessage(result.error);
      setLoading(false);
      return;
    }

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
      case 1: return 'Destrozado';
      case 2: return 'Muy cansado';
      case 3: return 'Normal';
      case 4: return 'Fresco';
      case 5: return 'A tope';
      default: return '';
    }
  };

  const getStressLabel = (val: number) => {
    switch (val) {
      case 1: return 'Muy alto';
      case 2: return 'Alto';
      case 3: return 'Normal';
      case 4: return 'Bajo';
      case 5: return 'Zen';
      default: return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-6 bg-surface-card sm:rounded-2xl border border-border-default shadow-elevated">
        <DialogHeader className="mb-4">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-3 mx-auto">
            <Sun className="w-6 h-6 text-accent" />
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
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold">
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
                <span className="text-sm font-bold text-text-primary">{fatigue === null ? 'Selecciona una opción' : getFatigueLabel(fatigue)}</span>
              </div>
              <input type="range" min="1" max="5" value={fatigue ?? 3} onChange={e => setFatigue(Number(e.target.value))}
                className="min-h-10 w-full accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50" aria-label="Nivel de fatiga muscular" />
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
                <span className="text-sm font-bold text-text-primary">{stress === null ? 'Selecciona una opción' : getStressLabel(stress)}</span>
              </div>
              <input type="range" min="1" max="5" value={stress ?? 3} onChange={e => setStress(Number(e.target.value))}
                className="min-h-10 w-full accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50" aria-label="Nivel de estrés mental" />
              <div className="flex justify-between mt-1.5 text-[9px] font-medium text-text-muted">
                <span>Estresado</span><span>Tranquilo</span>
              </div>
            </div>

            {/* Ask for manual metrics until a device has provided real measurements. */}
            {!hasDeviceBiometrics && (
              <div className="bg-surface-hover p-4 rounded-lg border border-border-subtle space-y-3">
                <p className="text-xs font-medium text-text-secondary">Introduce las métricas de hoy para que la recomendación sea tuya.</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-text-muted uppercase block mb-1">Sueño (h)</label>
                    <input type="number" min="0" max="24" step="0.25" value={sleepHours} onChange={e => setSleepHours(e.target.value)} placeholder="—"
                      className="min-h-10 w-full p-2 text-sm font-semibold text-text-primary bg-surface-card border border-border-default rounded-xl outline-none transition-[background-color,border-color,box-shadow,color] duration-150 ease-out focus:bg-surface-hover focus:border-accent/40 focus-visible:ring-2 focus-visible:ring-accent/50" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-muted uppercase block mb-1">HRV (ms)</label>
                    <input type="number" min="0" value={hrv} onChange={e => setHrv(e.target.value)} placeholder="—"
                      className="min-h-10 w-full p-2 text-sm font-semibold text-text-primary bg-surface-card border border-border-default rounded-xl outline-none transition-[background-color,border-color,box-shadow,color] duration-150 ease-out focus:bg-surface-hover focus:border-accent/40 focus-visible:ring-2 focus-visible:ring-accent/50" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-text-muted uppercase block mb-1">FC Reposo</label>
                    <input type="number" min="0" value={rhr} onChange={e => setRhr(e.target.value)} placeholder="—"
                      className="min-h-10 w-full p-2 text-sm font-semibold text-text-primary bg-surface-card border border-border-default rounded-xl outline-none transition-[background-color,border-color,box-shadow,color] duration-150 ease-out focus:bg-surface-hover focus:border-accent/40 focus-visible:ring-2 focus-visible:ring-accent/50" />
                  </div>
                </div>
              </div>
            )}

            {hasDeviceBiometrics && (
              <p className="text-[10px] text-text-muted text-center flex items-center justify-center gap-1">
                <Heart className="w-3 h-3" /> Datos de sueño y pulso obtenidos de Garmin
              </p>
            )}
          </div>

          {errorMessage && <p role="alert" className="text-xs font-medium text-red-600">{errorMessage}</p>}

          <button type="submit" disabled={loading}
            className="w-full min-h-11 py-3 rounded-xl text-sm font-semibold text-white bg-accent fine-hover:bg-accent-subtle shadow-button flex items-center justify-center gap-2 transition-[background-color,color,border-color,opacity,box-shadow,transform] duration-150 ease-out active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 disabled:active:scale-100">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Completar Check-in
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
