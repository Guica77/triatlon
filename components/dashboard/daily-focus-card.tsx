'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Flame, Cloud, Sun, Droplets, CheckCircle2, MessageSquarePlus } from 'lucide-react';
import { calculateSessionPacing } from '@/lib/nutrition-utility';
import { WorkoutFeedbackModal } from '@/components/feedback/workout-feedback-modal';
import { getCurrentWeather, WeatherData } from '@/lib/weather';
import { cn } from '@/lib/utils';

interface DailyFocusCardProps {
  workout: any;
  athleteLevel?: string;
  sweatRate?: number | null;
  onToggleComplete: () => void;
}

const sportRail: Record<string, string> = {
  natacion: 'bg-swim',
  ciclismo: 'bg-bike',
  carrera: 'bg-run',
  brick: 'bg-warning',
  fuerza: 'bg-accent',
};

export function DailyFocusCard({ workout, athleteLevel = 'intermedio', sweatRate, onToggleComplete }: DailyFocusCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const w = await getCurrentWeather(position.coords.latitude, position.coords.longitude);
          setWeather(w);
        },
        (error) => {
          console.warn("Geolocation denied or failed", error);
          setLocationError(true);
        }
      );
    }
  }, []);

  if (!workout) return null;

  const session = workout.training_sessions;
  const isCompleted = workout.status === 'completed';
  const hasFeedback = workout.rpe || workout.workout_feedback?.length > 0;

  // Calculate nutrition context
  const intensityFactor = 0.8; // default to Z3 average
  const weightKg = 70; // fallback weight
  const carbsNeeded = Math.round(session.duration_min * (intensityFactor * 1.5));
  const hydrationNeeded = Math.round((session.duration_min / 60) * (sweatRate || 0.8) * 1000);

  const rail = sportRail[session.sport_type] || 'bg-border-default';

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-border-default bg-surface-card">
      {/* Discipline left-rail */}
      <span className={cn('absolute left-0 top-0 bottom-0 w-1', rail)} aria-hidden="true" />

      <CardContent className="p-8 sm:p-12 pl-7 sm:pl-14 relative">
        <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">

          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-surface-hover border border-border-subtle">
              <Flame className="w-4 h-4 text-warning" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">Objetivo Principal de Hoy</span>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-text-primary leading-tight">
              {session.title || `Sesión de ${session.sport_type}`}
            </h1>

            <p className="text-base text-text-secondary font-medium leading-relaxed">
              {session.description}
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <div className="flex items-center gap-2 bg-surface-hover rounded-xl p-3 border border-border-subtle">
                <Sun className="w-6 h-6 text-warning" />
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Nutrición</p>
                  <p className="text-sm font-bold text-text-primary">{carbsNeeded}g Carbos</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-surface-hover rounded-xl p-3 border border-border-subtle">
                <Droplets className="w-6 h-6 text-swim" />
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Hidratación</p>
                  <p className="text-sm font-bold text-text-primary">{hydrationNeeded}ml Líquido</p>
                </div>
              </div>

              {weather && (
                <div className="flex items-center gap-2 bg-surface-hover rounded-xl p-3 border border-border-subtle">
                  <Cloud className="w-6 h-6 text-text-secondary" />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Clima Actual</p>
                    <p className="text-sm font-bold text-text-primary">{weather.temperature}°C • {weather.condition}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col gap-3 min-w-[240px]">
            {isCompleted ? (
              <>
                <div className="p-4 rounded-2xl bg-bike/15 border border-bike/30 text-center">
                  <CheckCircle2 className="w-8 h-8 text-bike mx-auto mb-2" />
                  <p className="font-bold text-bike">¡Entrenamiento Completado!</p>
                </div>
                <AnimatedButton
                  variant="secondary"
                  className="w-full py-4"
                  onClick={() => setIsFeedbackOpen(true)}
                >
                  <MessageSquarePlus className="w-5 h-5 mr-2" />
                  {hasFeedback ? 'Editar Valoración (RPE)' : 'Evaluar Sesión (RPE)'}
                </AnimatedButton>
              </>
            ) : (
              <AnimatedButton
                variant="primary"
                className="w-full py-6 font-black text-lg"
                onClick={onToggleComplete}
              >
                <CheckCircle2 className="w-6 h-6 mr-2" />
                Marcar Completado
              </AnimatedButton>
            )}
          </div>
        </div>
      </CardContent>

      <WorkoutFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        workoutId={workout.id}
        workoutTitle={session.title || `Sesión de ${session.sport_type}`}
      />
    </Card>
  );
}
