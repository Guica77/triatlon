'use client';

import React, { useEffect, useState } from 'react';
import { getGroupData, getGroupWorkouts } from '@/app/(app)/coach/group/[id]/actions';
import { getCoachLibrary } from '@/app/(app)/coach/athlete/[id]/actions';
import { GroupDashboardView } from './group-dashboard-view';
import { startOfWeek, addDays, format } from 'date-fns';
import { Loader2 } from 'lucide-react';

export function GroupTabContent({ groupId }: { groupId: string }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      
      const today = new Date();
      const calendarStart = startOfWeek(today, { weekStartsOn: 1 });
      const calendarEnd = addDays(calendarStart, 6);
      const startStr = format(calendarStart, 'yyyy-MM-dd');
      const endStr = format(calendarEnd, 'yyyy-MM-dd');

      const [groupRes, workoutsRes, libraryRes] = await Promise.all([
        getGroupData(groupId),
        getGroupWorkouts(groupId, startStr, endStr),
        getCoachLibrary()
      ]);

      if (isMounted) {
        setData({
          group: groupRes.group,
          athletes: groupRes.athletes || [],
          workouts: workoutsRes.data || [],
          libraryTemplates: libraryRes?.data || []
        });
        setLoading(false);
      }
    }
    
    if (groupId) {
      load();
    }
    
    return () => { isMounted = false; };
  }, [groupId]);

  if (loading) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-zinc-200 shadow-sm animate-in fade-in">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
        <p className="text-sm font-semibold text-zinc-500">Cargando el dashboard del grupo...</p>
      </div>
    );
  }

  if (!data?.group) {
    return (
      <div className="py-32 flex flex-col items-center justify-center gap-4 bg-white rounded-3xl border border-red-200 shadow-sm animate-in fade-in">
        <p className="text-sm font-semibold text-red-500">Error al cargar la información del grupo.</p>
      </div>
    );
  }

  return (
    <GroupDashboardView 
      group={data.group}
      athletes={data.athletes}
      workouts={data.workouts}
      libraryTemplates={data.libraryTemplates}
      hideBackButton={true}
    />
  );
}
