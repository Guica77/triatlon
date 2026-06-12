'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface AthleteRosterItem {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  level: string | null
  active_plan_id: string | null
  active_plan_name: string | null
  today_workout: {
    sport_type: string
    description: string
    duration_min: number
    status: 'pending' | 'completed' | 'missed'
  } | null
  today_biometrics: {
    hrv: number | null
    readiness_score: number | null
    fatigue_rating: number | null
    stress_level: number | null
  } | null
  weekly_stats: {
    actual_tss: number
    target_tss: number
    completed_workouts: number
    total_workouts: number
  }
  alerts: {
    low_hrv: boolean
    high_tss: boolean
    high_fatigue: boolean
  }
}

/**
 * Fetches all athletes associated with the current coach, including today's workouts, biometrics, and weekly stats.
 */
export async function fetchCoachAthletes(): Promise<{ data?: AthleteRosterItem[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autorizado' }
  }

  try {
    // 1. Get athlete links
    const { data: roster, error: rosterError } = await supabase
      .from('coach_athletes')
      .select('athlete_id')
      .eq('coach_id', user.id)

    if (rosterError) {
      console.error('Error fetching coach roster:', rosterError)
      return { error: 'Error al obtener el roster de atletas' }
    }

    if (!roster || roster.length === 0) {
      return { data: [] }
    }

    const athleteIds = roster.map(r => r.athlete_id)

    // 2. Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*, training_plans(id, name)')
      .in('id', athleteIds)

    if (profilesError || !profiles) {
      console.error('Error fetching athlete profiles:', profilesError)
      return { error: 'Error al obtener perfiles de los atletas' }
    }

    // Dates calculations
    const todayStr = new Date().toISOString().split('T')[0]
    
    const now = new Date()
    const currentDay = now.getDay() || 7 // 1 Monday ... 7 Sunday
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - currentDay + 1)
    startOfWeek.setHours(0,0,0,0)
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23,59,59,999)

    const startOfWeekStr = startOfWeek.toISOString().split('T')[0]
    const endOfWeekStr = endOfWeek.toISOString().split('T')[0]

    // 3. Fetch today's workouts for all athletes in the roster
    const { data: todayWorkouts } = await supabase
      .from('user_workouts')
      .select('*, training_sessions(*)')
      .in('user_id', athleteIds)
      .eq('scheduled_date', todayStr)

    // 4. Fetch today's biometrics for all athletes
    const { data: todayBiometrics } = await supabase
      .from('user_biometrics')
      .select('*')
      .in('user_id', athleteIds)
      .eq('date', todayStr)

    // 5. Fetch weekly workouts for TSS calculations
    const { data: weeklyWorkouts } = await supabase
      .from('user_workouts')
      .select('*, training_sessions(*)')
      .in('user_id', athleteIds)
      .gte('scheduled_date', startOfWeekStr)
      .lte('scheduled_date', endOfWeekStr)

    // 6. Map everything together
    const rosterItems: AthleteRosterItem[] = profiles.map(profile => {
      const p = profile as any
      const athleteId = p.id

      // Today's workout
      const workout = todayWorkouts?.find(w => w.user_id === athleteId)
      let today_workout: AthleteRosterItem['today_workout'] = null
      if (workout && workout.training_sessions) {
        today_workout = {
          sport_type: workout.training_sessions.sport_type,
          description: workout.training_sessions.description,
          duration_min: workout.training_sessions.duration_min || 0,
          status: workout.status as any,
        }
      }

      // Today's biometrics
      const bio = todayBiometrics?.find(b => b.user_id === athleteId)
      let today_biometrics: AthleteRosterItem['today_biometrics'] = null
      if (bio) {
        today_biometrics = {
          hrv: bio.hrv,
          readiness_score: bio.readiness_score,
          fatigue_rating: bio.fatigue_rating,
          stress_level: bio.stress_level,
        }
      }

      // Weekly stats
      const athWeekly = weeklyWorkouts?.filter(w => w.user_id === athleteId) || []
      const completed = athWeekly.filter(w => w.status === 'completed')
      
      let actual_tss = 0
      completed.forEach(w => {
        if (w.actual_tss) {
          actual_tss += w.actual_tss
        } else if (w.training_sessions) {
          // Fallback estimate
          const dur = w.training_sessions.duration_min || 0
          const desc = (w.training_sessions.description || '').toLowerCase()
          let intensity = 0.75
          if (desc.includes('z4') || desc.includes('umbral')) intensity = 0.88
          else if (desc.includes('z3') || desc.includes('tempo')) intensity = 0.80
          else if (desc.includes('z1') || desc.includes('suave')) intensity = 0.65
          actual_tss += Math.round((dur / 60) * Math.pow(intensity, 2) * 100)
        }
      })

      const completedCount = completed.length
      const totalCount = athWeekly.filter(w => w.training_sessions?.sport_type !== 'descanso').length

      // Target TSS defaults to 400 for beginners, 480 for intermediate, 600 for advanced
      let target_tss = 450
      if (p.level === 'principiante') target_tss = 350
      if (p.level === 'avanzado') target_tss = 600

      // Alerts
      const low_hrv = today_biometrics ? ((today_biometrics.hrv !== null && today_biometrics.hrv < 55) || (today_biometrics.readiness_score !== null && today_biometrics.readiness_score < 60)) : false
      const high_tss = actual_tss > target_tss
      const high_fatigue = today_biometrics ? (today_biometrics.fatigue_rating !== null && today_biometrics.fatigue_rating >= 4) : false

      return {
        id: athleteId,
        first_name: p.first_name,
        last_name: p.last_name,
        email: p.email,
        level: p.level,
        active_plan_id: p.active_plan_id,
        active_plan_name: p.training_plans?.name || null,
        today_workout,
        today_biometrics,
        weekly_stats: {
          actual_tss,
          target_tss,
          completed_workouts: completedCount,
          total_workouts: totalCount,
        },
        alerts: {
          low_hrv,
          high_tss,
          high_fatigue,
        }
      }
    })

    return { data: rosterItems }
  } catch (err: any) {
    console.error('Exception in fetchCoachAthletes:', err)
    return { error: err.message || 'Error inesperado' }
  }
}

/**
 * Associates an athlete with the coach by looking up their email.
 */
export async function addAthleteByEmail(email: string): Promise<{ success?: boolean; error?: string }> {
  if (!email || !email.trim()) {
    return { error: 'El correo electrónico es obligatorio' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autorizado' }
  }

  try {
    // 1. Find the athlete profile by email
    const { data: athleteProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()

    if (profileError) {
      console.error('Error looking up athlete by email:', profileError)
      return { error: 'Error al buscar el atleta en la base de datos' }
    }

    if (!athleteProfile) {
      return { error: 'No se encontró ningún atleta registrado con ese correo electrónico' }
    }

    if (athleteProfile.id === user.id) {
      return { error: 'No puedes añadirte a ti mismo como atleta' }
    }

    // 2. Insert link into coach_athletes
    const { error: linkError } = await supabase
      .from('coach_athletes')
      .insert({
        coach_id: user.id,
        athlete_id: athleteProfile.id,
        status: 'active'
      })

    if (linkError) {
      if (linkError.code === '23505') { // unique_violation
        return { error: 'Este atleta ya se encuentra en tu roster' }
      }
      console.error('Error linking coach and athlete:', linkError)
      return { error: 'Error al añadir el atleta al roster' }
    }

    // 3. Update profiles.coach_id for backwards compatibility
    await supabase
      .from('profiles')
      .update({ coach_id: user.id } as any)
      .eq('id', athleteProfile.id)

    revalidatePath('/coach/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error('Exception in addAthleteByEmail:', err)
    return { error: err.message || 'Error inesperado' }
  }
}

/**
 * Assigns a training plan to a specific athlete and instantiates its calendar.
 */
export async function assignPlanToAthlete(athleteId: string, planId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autorizado' }
  }

  try {
    // 1. Verify link exists
    const { data: link } = await supabase
      .from('coach_athletes')
      .select('id')
      .eq('coach_id', user.id)
      .eq('athlete_id', athleteId)
      .single()

    if (!link) {
      return { error: 'Este atleta no pertenece a tu roster' }
    }

    // 2. Update profiles active_plan_id
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ active_plan_id: planId } as any)
      .eq('id', athleteId)

    if (profileError) {
      console.error('Error updating plan on athlete profile:', profileError)
      return { error: 'Error al asignar el plan' }
    }

    // 3. Clear existing workouts for the athlete
    await supabase
      .from('user_workouts')
      .delete()
      .eq('user_id', athleteId)

    // 4. Fetch the plan sessions
    const { data: sessions, error: sessionsError } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('plan_id', planId)
      .order('week_number', { ascending: true })

    if (sessionsError) {
      console.error('Error fetching plan sessions:', sessionsError)
      return { error: 'Plan sin sesiones detalladas' }
    }

    if (sessions && sessions.length > 0) {
      // 5. Instantiate user_workouts starting from the Monday of this week
      const dayMap: Record<string, number> = {
        'Lunes': 1,
        'Martes': 2,
        'Miércoles': 3,
        'Jueves': 4,
        'Viernes': 5,
        'Sábado': 6,
        'Domingo': 7,
      }

      const now = new Date()
      const currentDay = now.getDay() || 7
      const daysSinceMonday = currentDay - 1
      
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - daysSinceMonday)
      startDate.setHours(0, 0, 0, 0)

      const workoutInserts = sessions.map(session => {
        const weekOffset = (session.week_number - 1) * 7
        const dayOffset = (dayMap[session.day_name] || 1) - 1
        
        const scheduledDate = new Date(startDate)
        scheduledDate.setDate(scheduledDate.getDate() + weekOffset + dayOffset)

        return {
          user_id: athleteId,
          session_id: session.id,
          scheduled_date: scheduledDate.toISOString().split('T')[0],
          status: 'pending',
        }
      })

      const { error: workoutsError } = await supabase
        .from('user_workouts')
        .insert(workoutInserts)

      if (workoutsError) {
        console.error('Error inserting workouts for athlete:', workoutsError)
        return { error: 'Error al instanciar el plan en el calendario del atleta' }
      }
    }

    revalidatePath('/coach/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error('Exception in assignPlanToAthlete:', err)
    return { error: err.message || 'Error inesperado' }
  }
}

/**
 * Removes an athlete from the roster.
 */
export async function removeAthlete(athleteId: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autorizado' }
  }

  try {
    // 1. Delete connection
    const { error: deleteError } = await supabase
      .from('coach_athletes')
      .delete()
      .eq('coach_id', user.id)
      .eq('athlete_id', athleteId)

    if (deleteError) {
      console.error('Error removing link from coach_athletes:', deleteError)
      return { error: 'Error al desvincular el atleta' }
    }

    // 2. Clear profiles coach_id
    await supabase
      .from('profiles')
      .update({ coach_id: null } as any)
      .eq('id', athleteId)
      .eq('coach_id', user.id) // security check

    revalidatePath('/coach/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error('Exception in removeAthlete:', err)
    return { error: err.message || 'Error inesperado' }
  }
}

/**
 * Updates the coach's custom invite code.
 */
export async function updateInviteCode(code: string): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autorizado' }
  }

  try {
    const formattedCode = code.trim().toUpperCase()
    
    // Si lo deja vacío, lo guardamos como null
    if (!formattedCode) {
      const { error } = await supabase
        .from('profiles')
        .update({ invite_code: null } as any)
        .eq('id', user.id)
      
      if (error) throw error
      revalidatePath('/coach/dashboard')
      return { success: true }
    }

    // Check if the code is already taken by someone else
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('invite_code' as any, formattedCode)
      .neq('id', user.id)
      .maybeSingle()

    if (existing) {
      return { error: 'Este código ya está en uso por otro entrenador' }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ invite_code: formattedCode } as any)
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating invite code:', updateError)
      return { error: 'Error al actualizar el código' }
    }

    revalidatePath('/coach/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error('Exception in updateInviteCode:', err)
    return { error: err.message || 'Error inesperado' }
  }
}
