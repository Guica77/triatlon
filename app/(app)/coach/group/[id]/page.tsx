import * as React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getGroupData, getGroupWorkouts } from './actions';
import { getCoachLibrary } from '@/app/(app)/coach/athlete/[id]/actions';
import { GroupDashboardView } from '@/components/coach/group-dashboard-view';
import { startOfWeek, startOfMonth, endOfMonth, endOfWeek, format } from 'date-fns';

export const dynamic = 'force-dynamic';

interface GroupPageProps {
  params: Promise<{ id: string }>
}

export default async function CoachGroupPage({ params }: GroupPageProps) {
  const { id: groupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Load the complete current month so both calendar views start with useful data.
  const today = new Date();
  const calendarStart = startOfWeek(startOfMonth(today), { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(endOfMonth(today), { weekStartsOn: 1 });
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
    <div className="flex-1 bg-bg-app p-4 md:p-8 overflow-y-auto">
      <GroupDashboardView 
        group={groupDataRes.group}
        athletes={groupDataRes.athletes || []}
        workouts={groupWorkoutsRes.data || []}
        libraryTemplates={libraryRes?.data || []}
      />
    </div>
  );
}
