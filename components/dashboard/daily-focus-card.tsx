'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Flame, Cloud, Sun, Droplets, MapPin, CheckCircle2, MessageSquarePlus } from 'lucide-react';
import { calculateSessionPacing } from '@/lib/nutrition-utility';
import { WorkoutFeedbackModal } from '@/components/feedback/workout-feedback-modal';
import { getCurrentWeather, WeatherData } from '@/lib/weather';

interface DailyFocusCardProps {
  workout: any;
  athleteLevel?: string;
  sweatRate?: number | null;
  onToggleComplete: () => void;
}

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

  return (
    <Card className="overflow-hidden border-0 shadow-elevated bg-gradient-to-br from-surface-app to-surface-card text-white relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <CardContent className="p-8 sm:p-12 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
          
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
              <Flame className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary">Objetivo Principal de Hoy</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              {session.title || `Sesión de ${session.sport_type}`}
            </h1>
            
            <p className="text-lg text-text-secondary font-medium leading-relaxed">
              {session.description}
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <div className="flex items-center gap-2 bg-black/30 rounded-xl p-3 border border-white/10">
                <Sun className="w-6 h-6 text-amber-400" />
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Nutrición</p>
                  <p className="text-sm font-bold text-white">{carbsNeeded}g Carbos</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-black/30 rounded-xl p-3 border border-white/10">
                <Droplets className="w-6 h-6 text-cyan-400" />
                <div>
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Hidratación</p>
                  <p className="text-sm font-bold text-white">{hydrationNeeded}ml Líquido</p>
                </div>
              </div>

              {weather && (
                <div className="flex items-center gap-2 bg-black/30 rounded-xl p-3 border border-white/10">
                  <Cloud className="w-6 h-6 text-emerald-400" />
                  <div>
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Clima Actual</p>
                    <p className="text-sm font-bold text-white">{weather.temperature}°C • {weather.condition}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-full md:w-auto flex flex-col gap-3 min-w-[240px]">
            {isCompleted ? (
              <>
                <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="font-bold text-emerald-300">¡Entrenamiento Completado!</p>
                </div>
                <AnimatedButton 
                  variant="secondary"
                  className="w-full py-4 bg-white/10 hover:bg-white/20 text-white border-white/20"
                  onClick={() => setIsFeedbackOpen(true)}
                >
                  <MessageSquarePlus className="w-5 h-5 mr-2" />
                  {hasFeedback ? 'Editar Valoración (RPE)' : 'Evaluar Sesión (RPE)'}
                </AnimatedButton>
              </>
            ) : (
              <AnimatedButton 
                variant="primary"
                className="w-full py-6 bg-cyan-500 hover:bg-cyan-400 text-zinc-900 font-black text-lg shadow-[0_0_40px_-10px_rgba(6,182,212,0.6)]"
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
