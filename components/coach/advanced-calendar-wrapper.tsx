'use client';

import * as React from 'react';
import { AdvancedCalendar, WorkoutItem } from './advanced-calendar';
import { updateWorkoutDate } from '@/app/(app)/coach/athlete/[id]/actions';

interface AdvancedCalendarWrapperProps {
  athleteId: string;
  initialWorkouts: WorkoutItem[];
}

export function AdvancedCalendarWrapper({ athleteId, initialWorkouts }: AdvancedCalendarWrapperProps) {
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

  // Update local state if initialWorkouts change (e.g. from server revalidation)
  React.useEffect(() => {
    setWorkouts(initialWorkouts);
  }, [initialWorkouts]);

  return (
    <AdvancedCalendar 
      workouts={workouts} 
      onWorkoutMove={handleWorkoutMove} 
      athleteId={athleteId}
    />
  );
}
