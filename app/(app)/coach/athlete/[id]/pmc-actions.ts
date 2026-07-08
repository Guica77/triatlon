'use server';

import { createClient } from '@/lib/supabase/server';

export async function getAthletePMC(athleteId: string, days: number = 90) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  // Calculate the start date
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const { data: workouts, error } = await supabase
    .from('user_workouts')
    .select('scheduled_date, actual_tss')
    .eq('user_id', athleteId)
    .gte('scheduled_date', startStr)
    .lte('scheduled_date', endStr)
    .order('scheduled_date', { ascending: true });

  if (error) {
    console.error('Error fetching PMC workouts:', error);
    return { error: 'Error fetching data' };
  }

  // Aggregate TSS by day
  const tssByDay: Record<string, number> = {};
  
  // Initialize with 0 for all days in the range
  for (let i = 0; i <= days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    tssByDay[d.toISOString().split('T')[0]] = 0;
  }

  // Fill in actual TSS
  workouts.forEach(w => {
    if (w.actual_tss && tssByDay[w.scheduled_date] !== undefined) {
      tssByDay[w.scheduled_date] += w.actual_tss;
    }
  });

  // Calculate PMC
  const pmcData = [];
  let ctl = 0;
  let atl = 0;

  for (let i = 0; i <= days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const tss = tssByDay[dateStr] || 0;

    // TSB is calculated BEFORE today's TSS is added
    const tsb = ctl - atl;

    // Update CTL and ATL
    ctl = ctl + (tss - ctl) / 42;
    atl = atl + (tss - atl) / 7;

    pmcData.push({
      date: dateStr,
      tss: tss,
      ctl: Math.round(ctl * 10) / 10,
      atl: Math.round(atl * 10) / 10,
      tsb: Math.round(tsb * 10) / 10,
    });
  }

  return { data: pmcData };
}
