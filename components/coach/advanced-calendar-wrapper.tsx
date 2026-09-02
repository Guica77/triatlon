'use client';

import * as React from 'react';
import { AdvancedCalendar, WorkoutItem } from './advanced-calendar';
import {
  assignTemplateToAthleteDay,
  getCoachAthleteWorkouts,
  updateWorkoutDate,
} from '@/app/(app)/coach/athlete/[id]/actions';

interface AdvancedCalendarWrapperProps {
  athleteId: string;
  initialWorkouts: WorkoutItem[];
  initialLibraryTemplates?: any[];
}

export function AdvancedCalendarWrapper({ athleteId, initialWorkouts, initialLibraryTemplates = [] }: AdvancedCalendarWrapperProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  const [workouts, setWorkouts] = React.useState<WorkoutItem[]>(initialWorkouts);
  const workoutsRef = React.useRef(workouts);
  const pendingMovesRef = React.useRef<Record<string, { previousDate: string; newDate: string }>>({});

  React.useEffect(() => {
    workoutsRef.current = workouts;
  }, [workouts]);

  const updateWorkouts = (updater: (current: WorkoutItem[]) => WorkoutItem[]) => {
    setWorkouts((current) => {
      const next = updater(current);
      workoutsRef.current = next;
      return next;
    });
  };

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleWorkoutMove = async (workoutId: string, newDate: string) => {
    const currentWorkout = workoutsRef.current.find((workout) => workout.id === workoutId);
    const previousDate = currentWorkout?.scheduled_date;
    if (!previousDate || previousDate === newDate) return;

    const pendingMove = { previousDate, newDate };
    pendingMovesRef.current[workoutId] = pendingMove;
    updateWorkouts((current) => current.map((workout) =>
      workout.id === workoutId ? { ...workout, scheduled_date: newDate } : workout
    ));

    try {
      const res = await updateWorkoutDate(athleteId, workoutId, newDate);
      if (res.error) throw new Error(res.error);
      if (pendingMovesRef.current[workoutId] === pendingMove) {
        delete pendingMovesRef.current[workoutId];
      }
    } catch (error) {
      const isCurrentMove = pendingMovesRef.current[workoutId] === pendingMove;
      if (isCurrentMove) {
        delete pendingMovesRef.current[workoutId];
        updateWorkouts((current) => current.map((workout) =>
          workout.id === workoutId && workout.scheduled_date === newDate
            ? { ...workout, scheduled_date: previousDate }
            : workout
        ));
      }
      alert(error instanceof Error ? error.message : 'Error al mover la sesión');
      throw error;
    }
  };

  const handleTemplateDrop = async (templateId: string, date: string) => {
    const res = await assignTemplateToAthleteDay(athleteId, templateId, date);
    if (res.error) {
      alert(res.error);
      throw new Error(res.error);
    }
  };

  const handleLoadRange = React.useCallback(async (startDate: string, endDate: string) => {
    const res = await getCoachAthleteWorkouts(athleteId, startDate, endDate);
    if (res.error) throw new Error(res.error);
    return (res.data || []) as WorkoutItem[];
  }, [athleteId]);

  React.useEffect(() => {
    setWorkouts((current) => {
      const merged = new Map(current.map((workout) => [workout.id, workout]));
      initialWorkouts.forEach((workout) => {
        const pendingMove = pendingMovesRef.current[workout.id];
        merged.set(
          workout.id,
          pendingMove ? { ...workout, scheduled_date: pendingMove.newDate } : workout
        );
      });
      return Array.from(merged.values());
    });
  }, [initialWorkouts]);

  if (!isMounted) {
    return <div className="h-96 flex items-center justify-center bg-surface-hover rounded-2xl animate-pulse">
      <div className="w-8 h-8 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin"></div>
    </div>;
  }

  return (
    <AdvancedCalendar
      workouts={workouts}
      onWorkoutMove={handleWorkoutMove}
      onTemplateDrop={handleTemplateDrop}
      onLoadRange={handleLoadRange}
      athleteId={athleteId}
      libraryTemplates={initialLibraryTemplates}
    />
  );
}
