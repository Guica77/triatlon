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
  } catch (err: any) {
    console.error('Exception in saveCoachWorkout:', err)
    return { error: err.message || 'Error inesperado' }
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
    .update({ scheduled_date: newDate } as any)
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
