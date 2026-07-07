'use client';

import * as React from 'react';
import { AdvancedCalendar, WorkoutItem } from './advanced-calendar';
import { assignTemplateToGroupDay } from '@/app/(app)/coach/group/[id]/actions';

interface GroupCalendarWrapperProps {
  groupId: string;
  initialWorkouts: WorkoutItem[];
  initialLibraryTemplates?: any[];
}

export function GroupCalendarWrapper({ groupId, initialWorkouts, initialLibraryTemplates = [] }: GroupCalendarWrapperProps) {
  const [workouts, setWorkouts] = React.useState<WorkoutItem[]>(initialWorkouts);

  const handleWorkoutMove = async (workoutId: string, newDate: string) => {
    // In a group context, moving a single workout might just mean moving it for that specific athlete?
    // Wait, if it's a group calendar, we might want to disable dragging individual workouts, 
    // OR we would need to move the workout for ALL athletes in the group.
    // For now, let's keep it simple: moving an existing workout on the group calendar is disabled or just shows an alert
    alert("Para mover un entrenamiento ya asignado, hazlo desde el calendario individual de cada atleta.");
    
    // Revert visually immediately
    setWorkouts([...workouts]);
  };

  const handleTemplateDrop = async (templateId: string, date: string) => {
    // This is fired when a library template is dropped on a day in the Group Calendar
    const res = await assignTemplateToGroupDay(groupId, templateId, date);
    if (res?.error) {
      alert(res.error);
    }
    // We rely on the revalidatePath from the server action to refresh the page/data
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
      libraryTemplates={initialLibraryTemplates}
    />
  );
}
