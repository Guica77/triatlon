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
