'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function updatePhysiologicalData(data: {
  current_ftp?: number | null;
  current_swim_pace?: string | null;
  current_run_pace?: string | null;
  baseline_training_hours?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      current_ftp: data.current_ftp,
      current_swim_pace: data.current_swim_pace,
      current_run_pace: data.current_run_pace,
      baseline_training_hours: data.baseline_training_hours,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating physiological data:', error);
    return { error: 'Error al actualizar los datos fisiológicos' };
  }

  (revalidateTag as any)('analytics');
  revalidatePath('/settings');
  revalidatePath('/dashboard');
  
  return { success: true };
}

export async function updateVirtualGarage(virtual_garage: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      virtual_garage: virtual_garage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating virtual garage:', error);
    return { error: 'Error al actualizar el garaje virtual' };
  }

  revalidatePath('/settings');
  revalidatePath('/dashboard');
  revalidatePath('/marketplace');
  
  return { success: true };
}

export async function disconnectTelemetry(provider: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  const isProfileProvider = provider === 'strava' || provider === 'garmin';

  if (isProfileProvider) {
    if (provider === 'strava') {
      updateData.strava_connected = false;
      updateData.strava_auth_tokens = null;
    } else if (provider === 'garmin') {
      updateData.garmin_connected = false;
      updateData.garmin_auth_tokens = null;
    }

    // If both disconnected, clear external_athlete_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('strava_connected, garmin_connected')
      .eq('id', user.id)
      .single();

    const willBeStravaConnected = provider === 'strava' ? false : !!profile?.strava_connected;
    const willBeGarminConnected = provider === 'garmin' ? false : !!profile?.garmin_connected;

    if (!willBeStravaConnected && !willBeGarminConnected) {
      updateData.external_athlete_id = null;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData as any)
      .eq('id', user.id);

    if (error) {
      console.error('Error disconnecting telemetry:', error);
      return { error: 'Error al desconectar el dispositivo' };
    }
  }

  // Also delete from user_connected_devices
  await supabase
    .from('user_connected_devices')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', provider);

  (revalidateTag as any)('analytics');
  revalidatePath('/settings');
  revalidatePath('/dashboard');
  
  return { success: true };
}

export async function syncPacesFromStravaAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  const { getOrRefreshStravaToken, syncPhysiologyFromStrava } = await import('@/lib/telemetry/strava-sync');
  const token = await getOrRefreshStravaToken(user.id);

  if (!token) {
    return { error: 'No tienes una cuenta de Strava conectada o el token ha expirado y no se pudo refrescar.' };
  }

  await syncPhysiologyFromStrava(user.id, token);

  (revalidateTag as any)('analytics');
  revalidatePath('/settings');
  revalidatePath('/dashboard');
  
  return { success: true };
}

export async function pushWeekWorkoutsToGarminAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  // 1. Check if Garmin (or Strava) is connected (In a real scenario, we check for Garmin tokens)
  const { data: profile } = await supabase
    .from('profiles')
    .select('garmin_connected, strava_connected')
    .eq('id', user.id)
    .single();

  if (!profile?.garmin_connected && !profile?.strava_connected) {
    return { error: 'No tienes ningún reloj Garmin (o cuenta conectada) para enviar entrenamientos.' };
  }

  // 2. Fetch the next 7 days of workouts for this user
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const { data: workouts } = await supabase
    .from('user_workouts')
    .select('id, scheduled_date')
    .eq('user_id', user.id)
    .gte('scheduled_date', todayStr)
    .lte('scheduled_date', nextWeekStr);

  const workoutCount = workouts?.length || 0;

  if (workoutCount === 0) {
    return { error: 'No tienes entrenamientos planificados para los próximos 7 días en tu calendario.' };
  }

  // 3. Simulate pushing to Garmin Training API
  // In a real scenario, we would iterate through workouts, generate FIT files or Garmin API JSON payloads,
  // and send them via `POST https://apis.garmin.com/training-api/workouts`
  await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API latency

  return { success: true, count: workoutCount };
}

export async function updateSubscriptionStatus(status: 'free' | 'pro') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating subscription status:', error);
    return { error: 'Error al actualizar el estado de suscripción' };
  }

  revalidatePath('/settings');
  revalidatePath('/dashboard');
  
  return { success: true };
}
