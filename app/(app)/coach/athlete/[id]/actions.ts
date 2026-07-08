'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveCoachWorkout(
  athleteId: string,
  data: {
    scheduledDate: string
    sportType: string
    durationMin: number
    title: string
    warmup: string
    main: string
    cooldown: string
  }
) {
  const supabase = await createClient()

  // 1. Authenticate coach
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'No autorizado' }
  }

  const { data: coachProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!coachProfile || coachProfile.role !== 'coach') {
    return { error: 'No autorizado' }
  }

  // 2. Verify athlete belongs to coach roster
  const { data: rosterCheck } = await supabase
    .from('coach_athletes')
    .select('id')
    .eq('coach_id', user.id)
    .eq('athlete_id', athleteId)
    .maybeSingle()

  if (!rosterCheck) {
    return { error: 'El atleta no pertenece a tu roster' }
  }

  try {
    // 3. Format description using expected markers
    const description = `Calentamiento: ${data.warmup || 'Calentamiento suave.'}\nParte principal: ${data.title ? '**' + data.title + '** - ' : ''}${data.main || 'Rodaje cómodo.'}\nEnfriamiento: ${data.cooldown || 'Enfriamiento y estiramientos.'}`

    // 4. Calculate day name (timezone-safe)
    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const dateParts = data.scheduledDate.split('-')
    const parsedDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
    const dayName = daysOfWeek[parsedDate.getDay()] || 'Lunes'

    // 5. Insert into training_sessions
    const { data: session, error: sessionError } = await supabase
      .from('training_sessions')
      .insert({
        sport_type: data.sportType,
        duration_min: data.durationMin,
        description: description,
        week_number: 1,
        day_name: dayName
      })
      .select('id')
      .single()

    if (sessionError || !session) {
      console.error('Error inserting training session:', sessionError)
      return { error: 'Error al guardar la sesión de entrenamiento' }
    }

    // 6. Insert into user_workouts
    const { error: workoutError } = await supabase
      .from('user_workouts')
      .insert({
        user_id: athleteId,
        session_id: session.id,
        scheduled_date: data.scheduledDate,
        status: 'pending'
      })

    if (workoutError) {
      console.error('Error inserting user workout:', workoutError)
      return { error: 'Error al programar la sesión en el calendario del atleta' }
    }

    revalidatePath(`/coach/athlete/${athleteId}`)
    revalidatePath('/dashboard')
    
    return { success: true }
  } catch (err: unknown) {
    console.error('Exception in saveCoachWorkout:', err)
    return { error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

export async function updateWorkoutDate(
  athleteId: string,
  workoutId: string,
  newDate: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  // Verify coach
  const { data: rosterCheck } = await supabase
    .from('coach_athletes')
    .select('id')
    .eq('coach_id', user.id)
    .eq('athlete_id', athleteId)
    .maybeSingle()

  if (!rosterCheck) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('user_workouts')
    .update({ scheduled_date: newDate })
    .eq('id', workoutId)
    .eq('user_id', athleteId)

  if (error) {
    console.error('Error updating workout date:', error)
    return { error: 'Error al mover la sesión' }
  }

  revalidatePath(`/coach/athlete/${athleteId}`)
  revalidatePath('/dashboard')
  
  return { success: true }
}

export async function updateCoachWorkoutDetails(
  athleteId: string,
  workoutId: string,
  sessionId: string,
  data: {
    sportType: string
    durationMin: number
    title: string
    warmup: string
    main: string
    cooldown: string
  }
) {
  const supabase = await createClient()

  // 1. Authenticate coach
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  // 2. Verify athlete belongs to coach roster
  const { data: rosterCheck } = await supabase
    .from('coach_athletes')
    .select('id')
    .eq('coach_id', user.id)
    .eq('athlete_id', athleteId)
    .maybeSingle()

  if (!rosterCheck) return { error: 'No autorizado' }

  try {
    // 3. Format description using expected markers
    const description = `Calentamiento: ${data.warmup || 'Calentamiento suave.'}\nParte principal: ${data.title ? '**' + data.title + '** - ' : ''}${data.main || 'Rodaje cómodo.'}\nEnfriamiento: ${data.cooldown || 'Enfriamiento y estiramientos.'}`

    // 4. Update training_sessions
    const { error: sessionError } = await supabase
      .from('training_sessions')
      .update({
        sport_type: data.sportType,
        duration_min: data.durationMin,
        description: description,
      })
      .eq('id', sessionId)

    if (sessionError) {
      console.error('Error updating training session:', sessionError)
      return { error: 'Error al actualizar los detalles del entrenamiento' }
    }

    revalidatePath(`/coach/athlete/${athleteId}`)
    revalidatePath('/dashboard')
    
    return { success: true }
  } catch (err: unknown) {
    console.error('Exception in updateCoachWorkoutDetails:', err)
    return { error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

export async function updateAthleteZonesByCoach(athleteId: string, payload: {
  current_ftp?: number | null;
  current_swim_pace?: string | null;
  current_run_pace?: string | null;
}) {
  const supabase = await createClient()

  // 1. Authenticate coach
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autorizado' }

  // 2. Verify athlete belongs to coach roster
  const { data: rosterCheck } = await supabase
    .from('coach_athletes')
    .select('id')
    .eq('coach_id', user.id)
    .eq('athlete_id', athleteId)
    .maybeSingle()

  if (!rosterCheck) return { error: 'No autorizado' }

  try {
    // 3. Use Admin Client to bypass RLS since users can normally only update their own profile
    const { createAdminClient } = await import('@/lib/supabase/admin')
    const adminSupabase = createAdminClient()

    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update(payload)
      .eq('id', athleteId)

    if (updateError) {
      console.error('Error updating athlete zones:', updateError)
      return { error: 'Error al actualizar las métricas fisiológicas' }
    }

    revalidatePath(`/coach/athlete/${athleteId}`)
    return { success: true }
  } catch (err: unknown) {
    console.error('Exception in updateAthleteZonesByCoach:', err)
    return { error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

// --- COACH WORKOUT LIBRARY ACTIONS ---

export async function getCoachLibrary() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { data: [], error: 'No autorizado' }

  const { data, error } = await supabase
    .from('coach_workout_library')
    .select('*')
    .eq('coach_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  return { data }
}

export async function createLibraryTemplate(payload: {
  name: string
  sport_type: string
  duration_min: number
  warmup?: string
  main?: string
  cooldown?: string
  intensity_type?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const { data, error } = await supabase
    .from('coach_workout_library')
    .insert({
      coach_id: user.id,
      ...payload
    })
    .select()
    .single()

  if (error) return { error: error.message }
  
  // No revalidation needed if we handle state client-side, but let's revalidate the path
  revalidatePath('/coach/athlete/[id]', 'page')
  return { data }
}

export async function deleteLibraryTemplate(templateId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  const { error } = await supabase
    .from('coach_workout_library')
    .delete()
    .eq('id', templateId)
    .eq('coach_id', user.id)

  if (error) return { error: error.message }
  
  revalidatePath('/coach/athlete/[id]', 'page')
  return { success: true }
}

export async function assignTemplateToAthleteDay(athleteId: string, templateId: string, date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'No autorizado' }

  // Verify athlete belongs to coach
  const { data: rosterCheck } = await supabase
    .from('coach_athletes')
    .select('id')
    .eq('coach_id', user.id)
    .eq('athlete_id', athleteId)
    .maybeSingle()

  if (!rosterCheck) return { error: 'No autorizado' }

  // Get template details
  const { data: template } = await supabase
    .from('coach_workout_library')
    .select('*')
    .eq('id', templateId)
    .eq('coach_id', user.id)
    .single()

  if (!template) return { error: 'Plantilla no encontrada' }

  try {
    const description = `Calentamiento: ${template.warmup || 'Suave'}\nParte principal: ${template.main || 'Rodaje'}\nEnfriamiento: ${template.cooldown || 'Suave'}`

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('training_sessions')
      .insert({
        sport_type: template.sport_type,
        duration_min: template.duration_min,
        description: description,
        day_name: 'Custom',
        week_number: 0
      })
      .select('id')
      .single()

    if (sessionError) throw sessionError

    // Create workout linked to session
    const { error: workoutError } = await supabase
      .from('user_workouts')
      .insert({
        user_id: athleteId,
        session_id: session.id,
        scheduled_date: date,
        status: 'pending'
      })

    if (workoutError) throw workoutError

    revalidatePath(`/coach/athlete/${athleteId}`)
    return { success: true }
  } catch (err: unknown) {
    console.error('Error in assignTemplateToAthleteDay:', err)
    return { error: err instanceof Error ? err.message : 'Error inesperado' }
  }
}

export async function addWorkoutComment(workoutId: string, athleteId: string, content: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };
  
  const { data, error } = await supabase
    .from('workout_comments')
    .insert({
      workout_id: workoutId,
      user_id: user.id,
      content: content
    })
    .select(`
      id, content, created_at, user_id,
      profiles ( first_name, last_name, role )
    `)
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    return { error: 'Error al añadir el comentario' };
  }

  revalidatePath(`/coach/athlete/${athleteId}`);
  return { data: data as any };
}

export async function getWorkoutComments(workoutId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const { data, error } = await supabase
    .from('workout_comments')
    .select(`
      id, content, created_at, user_id,
      profiles ( first_name, last_name, role )
    `)
    .eq('workout_id', workoutId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    return { error: 'Error al obtener comentarios' };
  }

  return { data: data as any };
}

export async function seedDefaultTemplates() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const defaultTemplates = [
    {
      coach_id: user.id,
      name: 'Test FTP Ciclismo (20 min)',
      sport_type: 'ciclismo',
      duration_min: 60,
      intensity_type: 'z5',
      warmup: '15 min Z1-Z2 progresivo.\n3 x (1 min Z4 + 1 min Z1).\n5 min Z1 fácil.',
      main: '5 min Z5 (Vaciado).\n10 min Z1 recuperación.\n20 min TEST FTP (Máximo esfuerzo sostenido).',
      cooldown: '10 min Z1 rodar suave para soltar.'
    },
    {
      coach_id: user.id,
      name: 'Rodaje Largo Aeróbico',
      sport_type: 'carrera',
      duration_min: 90,
      intensity_type: 'z2',
      warmup: '10 min Z1 suave, movilidad articular.',
      main: '70 min Z2 estricto. Mantener pulsaciones bajas. Si suben, caminar.',
      cooldown: '10 min Z1 + estiramientos completos.'
    },
    {
      coach_id: user.id,
      name: 'Series Umbral 4x2000m',
      sport_type: 'carrera',
      duration_min: 75,
      intensity_type: 'z4',
      warmup: '15 min Z1-Z2 + Técnica de carrera + 4 progresiones de 80m.',
      main: '4 x 2000m en Z4 (Ritmo 10k). Recuperación 90 seg trote muy suave (Z1) entre series.',
      cooldown: '15 min Z1 trote cochinero.'
    },
    {
      coach_id: user.id,
      name: 'Nado Continuo 80/20',
      sport_type: 'natacion',
      duration_min: 60,
      intensity_type: 'z2',
      warmup: '400m libres suave.\n200m estilos (50m cada).',
      main: '1500m continuos en Z2. Foco en la técnica y deslizamiento, respiración bilateral.',
      cooldown: '200m suaves a elección.'
    },
    {
      coach_id: user.id,
      name: 'Series VO2Max Bici 5x3min',
      sport_type: 'ciclismo',
      duration_min: 75,
      intensity_type: 'z5',
      warmup: '20 min progresivos hasta Z3.\n3x30 seg Z4 (rec 1 min).',
      main: '5 x 3 min en Z5 (>106% FTP). Recuperación 3 min en Z1 entre series.',
      cooldown: '15 min Z1 alta cadencia (>95rpm).'
    }
  ];

  const { error } = await supabase
    .from('coach_workout_library')
    .insert(defaultTemplates);

  if (error) {
    console.error('Error seeding templates:', error);
    return { error: 'Error al generar plantillas' };
  }

  revalidatePath('/coach/dashboard');
  revalidatePath(`/coach/athlete/[id]`, 'page');
  return { success: true };
}
