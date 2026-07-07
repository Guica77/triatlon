'use client';

import * as React from 'react';
import { AdvancedCalendar, WorkoutItem } from './advanced-calendar';
import { updateWorkoutDate } from '@/app/(app)/coach/athlete/[id]/actions';

import { assignTemplateToAthleteDay } from '@/app/(app)/coach/athlete/[id]/actions';

interface AdvancedCalendarWrapperProps {
  athleteId: string;
  initialWorkouts: WorkoutItem[];
  initialLibraryTemplates?: any[];
}

export function AdvancedCalendarWrapper({ athleteId, initialWorkouts, initialLibraryTemplates = [] }: AdvancedCalendarWrapperProps) {
  const [workouts, setWorkouts] = React.useState<WorkoutItem[]>(initialWorkouts);

  const handleWorkoutMove = async (workoutId: string, newDate: string) => {
    // Optimistic update
    setWorkouts(prev => 
      prev.map(w => 
        w.id === workoutId ? { ...w, scheduled_date: newDate } : w
      )
    );

    // Server Action
    const res = await updateWorkoutDate(athleteId, workoutId, newDate);
    
    if (res.error) {
      alert(res.error);
    // Revert on error
      setWorkouts(initialWorkouts);
    }
  };

  const handleTemplateDrop = async (templateId: string, date: string) => {
    // This is fired when a library template is dropped on a day
    const res = await assignTemplateToAthleteDay(athleteId, templateId, date);
    if (res.error) {
      alert(res.error);
    }
    // We rely on the revalidatePath from the server action to refresh the page/data
    // For immediate optimistic update we could fake the workout, but it's safer to just let the page refresh
  };

  // Update local state if initialWorkouts change (e.g. from server revalidation)
  React.useEffect(() => {
    setWorkouts(initialWorkouts);
  }, [initialWorkouts]);

  return (
    <AdvancedCalendar 
      workouts={workouts} 
      onWorkoutMove={handleWorkoutMove} 
      onTemplateDrop={handleTemplateDrop}
      athleteId={athleteId}
      libraryTemplates={initialLibraryTemplates}
    />
  );
}
