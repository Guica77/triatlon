'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { parseISO, addDays, startOfWeek } from 'date-fns';

export interface GroupAthleteItem {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  today_workout: any | null;
  readiness_score: number | null;
  hrv: number | null;
  alerts: {
    low_hrv: boolean;
    high_tss: boolean;
    high_fatigue: boolean;
  };
}

export async function getGroupData(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify group ownership
  const { data: group, error: groupError } = await supabase
    .from('coach_groups')
    .select('*')
    .eq('id', groupId)
    .eq('coach_id', user.id)
    .single();

  if (groupError || !group) {
    return { error: 'Group not found or unauthorized' };
  }

  // Get athletes in the group
  const { data: rosterData, error: rosterError } = await supabase
    .from('coach_athletes')
    .select(`
      athlete_id,
      profiles!coach_athletes_athlete_id_fkey (
        id, first_name, last_name, email
      )
    `)
    .eq('coach_id', user.id)
    .eq('group_id', groupId);

  if (rosterError) {
    return { error: 'Failed to fetch group athletes' };
  }

  const athleteIds = rosterData.map(r => r.athlete_id);
  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch today's workouts for these athletes
  const { data: workoutsData } = await supabase
    .from('user_workouts')
    .select('*, training_sessions(*)')
    .in('user_id', athleteIds)
    .eq('scheduled_date', todayStr);

  // Fetch recent biometrics for alerts
  const { data: biometricsData } = await supabase
    .from('user_biometrics')
    .select('user_id, date, hrv, readiness_score')
    .in('user_id', athleteIds)
    .order('date', { ascending: false });

  // Map to group athletes
  const athletes: GroupAthleteItem[] = rosterData.map(r => {
    const profile = r.profiles as any;
    const athleteId = profile.id;
    
    // Find today's workout
    const todayWorkout = workoutsData?.find(w => w.user_id === athleteId);
    
    // Calculate alerts
    const athleteBiometrics = biometricsData?.filter(b => b.user_id === athleteId) || [];
    const latestBiometrics = athleteBiometrics[0];
    const avgHrv = athleteBiometrics.reduce((acc, b) => acc + (b.hrv || 0), 0) / (athleteBiometrics.length || 1);
    const lowHrvAlert = latestBiometrics?.hrv ? latestBiometrics.hrv < avgHrv * 0.8 : false;
    const highFatigueAlert = latestBiometrics?.readiness_score ? latestBiometrics.readiness_score < 40 : false;

    return {
      id: athleteId,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      today_workout: todayWorkout?.training_sessions || null,
      readiness_score: latestBiometrics?.readiness_score || null,
      hrv: latestBiometrics?.hrv || null,
      alerts: {
        low_hrv: lowHrvAlert,
        high_tss: false, // Could compute from telemetry
        high_fatigue: highFatigueAlert
      }
    };
  });

  return { group, athletes };
}

export async function getGroupWorkouts(groupId: string, startDateStr: string, endDateStr: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { data: null };

  // Get athletes in group
  const { data: rosterData } = await supabase
    .from('coach_athletes')
    .select('athlete_id')
    .eq('coach_id', user.id)
    .eq('group_id', groupId);

  if (!rosterData || rosterData.length === 0) return { data: [] };
  const athleteIds = rosterData.map(r => r.athlete_id);

  // Fetch ALL workouts for these athletes in the date range
  const { data: workoutsData, error } = await supabase
    .from('user_workouts')
    .select('*, training_sessions(*)')
    .in('user_id', athleteIds)
    .gte('scheduled_date', startDateStr)
    .lte('scheduled_date', endDateStr);

  if (error) {
    console.error("Failed to fetch group workouts:", error);
    return { data: [] };
  }

  return { data: workoutsData };
}

export async function assignTemplateToGroupDay(groupId: string, templateId: string, date: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // 1. Verify template ownership
  const { data: template, error: templateError } = await supabase
    .from('coach_workout_library')
    .select('*')
    .eq('id', templateId)
    .eq('coach_id', user.id)
    .single();

  if (templateError || !template) {
    return { error: 'Template not found or unauthorized' };
  }

  // 2. Get athletes in group
  const { data: rosterData, error: rosterError } = await supabase
    .from('coach_athletes')
    .select('athlete_id')
    .eq('coach_id', user.id)
    .eq('group_id', groupId);

  if (rosterError || !rosterData) {
    return { error: 'Failed to fetch group athletes' };
  }

  const athleteIds = rosterData.map(r => r.athlete_id);
  if (athleteIds.length === 0) {
    return { error: 'El grupo no tiene atletas.' };
  }

  // Assemble full description
  const parts = [];
  if (template.warmup) parts.push(`CALENTAMIENTO:\n${template.warmup}`);
  if (template.main) parts.push(`PARTE PRINCIPAL:\n${template.main}`);
  if (template.cooldown) parts.push(`ENFRIAMIENTO:\n${template.cooldown}`);
  const description = parts.join('\n\n');

  try {
    // 3. For each athlete, create the session and the workout.
    // For simplicity, we loop. For scale, we could use an RPC or bulk insert.
    for (const athleteId of athleteIds) {
      // Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from('training_sessions')
        .insert({
          sport_type: template.sport_type,
          duration_min: template.duration_min,
          description: description,
          day_name: 'Custom',
          week_number: 0
        })
        .select('id')
        .single();

      if (sessionError || !sessionData) {
        console.error("Failed to create training session for athlete", athleteId, sessionError);
        continue;
      }

      // Create user_workout
      await supabase
        .from('user_workouts')
        .insert({
          user_id: athleteId,
          session_id: sessionData.id,
          scheduled_date: date,
          status: 'pending'
        });
    }

    revalidatePath(`/coach/group/${groupId}`);
    return { success: true };
  } catch (err) {
    console.error(err);
    return { error: 'Failed to assign template to group' };
  }
}
