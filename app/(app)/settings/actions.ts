'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function deleteOwnAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'La sesión ha caducado. Vuelve a iniciar sesión.' };
  try {
    let appleRevocation: 'revoked' | 'manual' | 'not-applicable' = 'not-applicable';
    if (user.identities?.some(identity => identity.provider === 'apple')) {
      const { revokeAppleAuthorization } = await import('@/lib/auth/apple-revocation');
      // A linked identity does not prove the current session token belongs to Apple.
      appleRevocation = await revokeAppleAuthorization(user.id, null);
    }
    const { createAdminClient } = await import('@/lib/supabase/admin');
    const { error } = await createAdminClient().auth.admin.deleteUser(user.id, false);
    if (error) return { error: 'No se ha podido eliminar la cuenta. Inténtalo de nuevo.' };
    // The account is already gone: a sign-out failure must not report a false deletion failure.
    try { await supabase.auth.signOut({ scope: 'local' }); } catch {}
    return { success: true, appleRevocation };
  } catch { return { error: 'No se ha podido completar la solicitud. Inténtalo de nuevo.' }; }
}

export async function updatePhysiologicalData(data: {
  current_ftp?: number | null;
  current_swim_pace?: string | null;
  current_run_pace?: string | null;
  baseline_training_hours?: string;
  previous_injuries?: string | null;
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
      previous_injuries: data.previous_injuries,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating physiological data:', error);
    return { error: 'Error al actualizar los datos fisiológicos' };
  }

  revalidateTag('analytics', 'max');
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
  if (!['strava', 'garmin'].includes(provider)) return { error: 'Proveedor no admitido.' };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const admin = createAdminClient();
  if (provider === 'strava') {
    const { getOrRefreshStravaToken } = await import('@/lib/telemetry/strava-sync');
    const token = await getOrRefreshStravaToken(user.id);
    if (token) {
      try {
        const response = await fetch('https://www.strava.com/oauth/deauthorize', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
        if (!response.ok && response.status !== 401) return { error: 'Strava no ha confirmado la desconexión. Inténtalo de nuevo.' };
      } catch { return { error: 'No se ha podido contactar con Strava. Inténtalo de nuevo.' }; }
    }
  }
  const { error } = await admin.from('user_connected_devices').delete().eq('user_id', user.id).eq('provider', provider);
  if (error) return { error: 'No se pudo eliminar la conexión.' };
  const { error: profileError } = await admin.from('profiles').update(provider === 'strava'
    ? { strava_connected: false, strava_auth_tokens: null, external_athlete_id: null }
    : { garmin_connected: false, garmin_auth_tokens: null }).eq('id', user.id);
  if (profileError) return { error: 'Conexión eliminada; no se pudo actualizar su estado. Recarga e inténtalo de nuevo.' };
  revalidatePath('/settings'); revalidatePath('/dashboard');
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

  const result = await syncPhysiologyFromStrava(user.id, token);
  if (!result.success) return { error: result.error, needsReconnect: 'needsReconnect' in result && result.needsReconnect === true };

  revalidateTag('analytics', 'max');
  revalidatePath('/settings');
  revalidatePath('/dashboard');
  
  return { success: true };
}

export async function pushWeekWorkoutsToGarminAction(): Promise<{ error?: string; success?: boolean; count?: number }> {
  return { error: 'El envío directo a Garmin todavía no está disponible. Puedes exportar tu calendario desde Ajustes.' };
}

export async function updateSubscriptionStatus(_status: 'free' | 'pro' | 'coach') {
  return { error: 'Las compras y los cambios de suscripción todavía no están disponibles. No se ha realizado ningún cobro ni cambio de plan.' };
}

export async function updateNutritionSettings(data: {
  custom_carbs_per_hour: number | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      custom_carbs_per_hour: data.custom_carbs_per_hour,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating nutrition settings:', error);
    return { error: 'Error al actualizar la configuración de nutrición' };
  }

  revalidatePath('/settings');
  revalidatePath('/dashboard');
  
  return { success: true };
}

export async function saveGarminCredentialsAction(_email: string, _password: string) {
  return { error: 'La conexión de Garmin con contraseña está deshabilitada. No guardamos tus credenciales de Garmin.' };
}

export async function testGarminSyncLocalAction() {
  return { error: 'La sincronización directa con Garmin no está disponible.' };
}
