'use client';

import * as React from 'react';
import { ProCard } from '@/components/ui/pro-card';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface WeeklyNavProps {
  workouts: Array<{
    id: string;
    scheduled_date: string;
    status: string;
    training_sessions: {
      sport_type: string;
      day_name: string;
    };
  }>;
}

export function WeeklyNav({ workouts }: WeeklyNavProps) {
  // Generar los 7 días de la semana actual
  const now = new Date();
  const currentDay = now.getDay() || 7; // 1 Lunes ... 7 Domingo
  const monday = new Date(now);
  monday.setDate(monday.getDate() - currentDay + 1);

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = d.toDateString() === now.toDateString();

    // Buscar workouts para este día
    const dayWorkouts = workouts.filter(w => w.scheduled_date === dateStr);
    const isCompleted = dayWorkouts.length > 0 && dayWorkouts.every(w => w.status === 'completed');

    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return {
      date: d,
      dateStr,
      dayName: dayNames[i],
      dayNum: d.getDate(),
      isToday,
      workouts: dayWorkouts,
      isCompleted,
    };
  });

  const sportDotColors: Record<string, string> = {
    natacion: 'bg-[var(--color-swim)]',
    ciclismo: 'bg-[var(--color-bike)]',
    carrera: 'bg-[var(--color-run)]',
    brick: 'bg-amber-400',
    descanso: 'bg-zinc-600',
  };

  return (
    <ProCard className="p-4 py-6">
      <div className="flex justify-between items-center gap-2 max-w-2xl mx-auto">
        {days.map((d, i) => (
          <div 
            key={i} 
            className={cn(
              "flex flex-col items-center justify-center p-3 rounded-2xl w-16 transition-all",
              d.isToday ? "bg-zinc-800 border border-zinc-700 shadow-lg" : "hover:bg-zinc-900/50"
            )}
          >
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
              {d.dayName}
            </span>
            <span className={cn(
              "text-lg font-semibold mb-2", 
              d.isToday ? "text-zinc-50" : "text-zinc-400"
            )}>
              {d.dayNum}
            </span>

            {/* Dots o Check */}
            <div className="h-3 flex items-center justify-center gap-1">
              {d.isCompleted ? (
                <div className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-400" />
                </div>
              ) : d.workouts.length > 0 ? (
                d.workouts.map((w, wIdx) => (
                  <span 
                    key={wIdx} 
                    className={cn("w-1.5 h-1.5 rounded-full", sportDotColors[w.training_sessions?.sport_type] || 'bg-zinc-600')} 
                  />
                ))
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
              )}
            </div>
          </div>
        ))}
      </div>
    </ProCard>
  );
}
