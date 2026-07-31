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
  selectedDateStr: string;
  onSelectDate: (dateStr: string) => void;
}

export function WeeklyNav({ workouts, selectedDateStr, onSelectDate }: WeeklyNavProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

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

  if (!isMounted) {
    return (
      <ProCard className="p-4 py-6 relative z-10 border-border-default bg-bg-card h-32 animate-pulse flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-swim border-t-transparent animate-spin"></div>
      </ProCard>
    );
  }

  return (
    <ProCard className="p-4 py-6 relative z-10 border-border-default bg-bg-card">
      <div className="flex justify-between items-center gap-2 max-w-2xl mx-auto">
        {days.map((d, i) => {
          let complianceClass = '';
          const todayStr = new Date().toISOString().split('T')[0];
          const isSelected = d.dateStr === selectedDateStr;
 
          if (d.workouts.length > 0) {
            const hasCompleted = d.workouts.some(w => w.status === 'completed');
            const hasMissed = d.workouts.some(w => w.status === 'missed');
            const hasPending = d.workouts.some(w => w.status === 'pending');
 
            if (d.workouts.every(w => w.status === 'completed')) {
              complianceClass = 'bg-bike/10 border border-bike/30 text-bike';
            } else if (hasMissed) {
              complianceClass = 'bg-danger/10 border border-danger/30 text-danger';
            } else if (hasPending && d.workouts.some(w => w.scheduled_date <= todayStr)) {
              complianceClass = 'bg-warning/10 border border-warning/30 text-warning';
            } else {
              complianceClass = 'bg-bg-hover border border-border-default text-text-secondary hover:bg-bg-hover';
            }
          } else {
            complianceClass = d.isToday 
              ? 'bg-bg-hover border border-border-default text-text-primary' 
              : 'border border-transparent hover:bg-bg-hover text-text-muted';
          }
 
          const activeClass = isSelected
            ? 'bg-bg-elevated border-swim ring-1 ring-swim text-swim'
            : complianceClass;
 
          return (
            <button 
              key={i} 
              onClick={() => onSelectDate(d.dateStr)}
              className={cn(
                "relative flex flex-col items-center justify-center p-3 rounded-2xl w-16 transition-all border cursor-pointer select-none",
                activeClass,
                d.isToday && !isSelected && "bg-bg-hover border-border-default text-text-primary"
              )}
            >
              <span className="text-[10px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 z-10">
                {d.dayName}
              </span>
              <span className={cn(
                "text-lg font-bold mb-2 z-10", 
                isSelected ? "text-swim" : d.isToday ? "text-text-primary" : "text-text-secondary"
              )}>
                {d.dayNum}
              </span>
 
              {/* Dots o Check */}
              <div className="h-3 flex items-center justify-center gap-1 z-10">
                {d.isCompleted ? (
                  <div className="w-4 h-4 rounded-full bg-green-100 border border-green-200 flex items-center justify-center">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                ) : d.workouts.length > 0 ? (
                  d.workouts.map((w, wIdx) => (
                    <span 
                       key={wIdx} 
                       className={cn("w-1.5 h-1.5 rounded-full", sportDotColors[w.training_sessions?.sport_type] || 'bg-zinc-400')} 
                    />
                  ))
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-surface-hover" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </ProCard>
  );
}
