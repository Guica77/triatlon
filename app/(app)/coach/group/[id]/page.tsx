import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getGroupData, getGroupWorkouts } from './actions';
import { getCoachLibrary } from '@/app/(app)/coach/athlete/[id]/actions';
import { GroupDashboardView } from '@/components/coach/group-dashboard-view';
import { startOfWeek, addDays, format } from 'date-fns';

export const dynamic = 'force-dynamic';

interface GroupPageProps {
  params: { id: string }
}

export default async function CoachGroupPage({ params }: GroupPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const groupId = params.id;

  // Compute date range for the calendar (Monday to Sunday of the current week)
  const today = new Date();
  const calendarStart = startOfWeek(today, { weekStartsOn: 1 });
  const calendarEnd = addDays(calendarStart, 6);
  const startStr = format(calendarStart, 'yyyy-MM-dd');
  const endStr = format(calendarEnd, 'yyyy-MM-dd');

  // Fetch data in parallel
  const [groupDataRes, groupWorkoutsRes, libraryRes] = await Promise.all([
    getGroupData(groupId),
    getGroupWorkouts(groupId, startStr, endStr),
    getCoachLibrary()
  ]);

  if (groupDataRes.error || !groupDataRes.group) {
    redirect('/coach/dashboard');
  }

  return (
    <div className="flex-1 bg-zinc-950 p-4 md:p-8 overflow-y-auto">
      <GroupDashboardView 
        group={groupDataRes.group}
        athletes={groupDataRes.athletes || []}
        workouts={groupWorkoutsRes.data || []}
        libraryTemplates={libraryRes?.data || []}
      />
    </div>
  );
}
