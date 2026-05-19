'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

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

export async function disconnectTelemetry(provider: 'strava' | 'garmin') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

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

  // Also delete from user_connected_devices
  await supabase
    .from('user_connected_devices')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', provider);

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

  // Get current Strava token
  const { data: device } = await supabase
    .from('user_connected_devices')
    .select('access_token')
    .eq('user_id', user.id)
    .eq('provider', 'strava')
    .maybeSingle();

  if (!device?.access_token) {
    return { error: 'No tienes una cuenta de Strava conectada.' };
  }

  const { syncPhysiologyFromStrava } = await import('@/lib/telemetry/strava-sync');
  await syncPhysiologyFromStrava(user.id, device.access_token);

  revalidatePath('/settings');
  revalidatePath('/dashboard');
  
  return { success: true };
}
