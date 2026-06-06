import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Ensures the 'elite-ironman-plan-001' training plan template exists in the DB.
 * If not, it creates it and seeds its sessions so the calendar instantiation works.
 */
async function ensurePlanExists(supabase: any) {
  const { data: plan } = await supabase
    .from('training_plans')
    .select('id')
    .eq('id', 'elite-ironman-plan-001')
    .maybeSingle()

  if (plan) return

  console.log('Seeding elite-ironman-plan-001 template...')

  // Insert plan
  await supabase
    .from('training_plans')
    .insert({
      id: 'elite-ironman-plan-001',
      name: 'Elite Ironman (Doble Sesión)',
      description: 'Plan avanzado: 2 sesiones diarias (mañana/tarde), 1 día de descanso activo (cool off), 1 día de recuperación total (full relax).',
      distance: 'Ironman / Full',
      level: 'avanzado',
      duration_weeks: 1
    })

  // Insert sessions
  const sessions = [
    { day_name: 'Lunes', sport_type: 'natacion', duration_min: 60, description: 'Series de Fuerza en Agua 10x100m. Ritmo Z3' },
    { day_name: 'Lunes', sport_type: 'fuerza', duration_min: 45, description: 'Fuerza Máxima Tren Inferior (Sentadilla Búlgara). Z1' },
    { day_name: 'Martes', sport_type: 'ciclismo', duration_min: 90, description: 'Series Vo2Max en Rodillo (Pulsaciones altas). Z4/Z5' },
    { day_name: 'Martes', sport_type: 'carrera', duration_min: 40, description: 'Carrera suave transición (Brick). Z2' },
    { day_name: 'Miércoles', sport_type: 'natacion', duration_min: 60, description: 'Natación continua aeróbica 2500m. Z2' },
    { day_name: 'Miércoles', sport_type: 'fuerza', duration_min: 45, description: 'Fuerza Estabilizadora Core y Hombros. Z1' },
    { day_name: 'Jueves', sport_type: 'carrera', duration_min: 75, description: 'Fartlek 10x(1min rápido, 1min lento). Z3/Z4' },
    { day_name: 'Jueves', sport_type: 'ciclismo', duration_min: 60, description: 'Rodaje suave recuperador. Z1/Z2' },
    { day_name: 'Viernes', sport_type: 'natacion', duration_min: 30, description: 'Natación Suave (Cool Off / Técnica). Z1' },
    { day_name: 'Sábado', sport_type: 'ciclismo', duration_min: 180, description: 'Tirada Larga (Endurance). Z2' },
    { day_name: 'Sábado', sport_type: 'carrera', duration_min: 30, description: 'Transición rápida post-bici. Z3' }
  ]

  const sessionInserts = sessions.map(s => ({
    plan_id: 'elite-ironman-plan-001',
    week_number: 1,
    day_name: s.day_name,
    sport_type: s.sport_type,
    duration_min: s.duration_min,
    description: s.description
  }))

  await supabase
    .from('training_sessions')
    .insert(sessionInserts)
}

/**
 * Instantiates the template plan workouts into the athlete's calendar for the current week.
 */
async function instantiateWorkoutsForAthlete(supabase: any, athleteId: string, planId: string) {
  // Clear existing workouts
  await supabase
    .from('user_workouts')
    .delete()
    .eq('user_id', athleteId)

  // Fetch plan sessions
  const { data: sessions } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('plan_id', planId)
    .order('week_number', { ascending: true })

  if (sessions && sessions.length > 0) {
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

    const workoutInserts = sessions.map((session: any) => {
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

    await supabase
      .from('user_workouts')
      .insert(workoutInserts)
  }
}

/**
 * Seeds daily biometrics for a demo athlete to create realistic dashboards and alert triggers.
 */
async function seedAthleteBiometrics(supabase: any, athleteId: string, email: string) {
  const todayStr = new Date().toISOString().split('T')[0]
  
  let hrv = 68
  let rhr = 52
  let sleepHours = 7.8
  let sleepScore = 84
  let fatigue = 2
  let stress = 2
  let readiness = 82

  if (email === 'carlos.garcia@triatlonpro.com') {
    // LOW HRV & HIGH FATIGUE ALERT
    hrv = 34
    rhr = 64
    sleepHours = 4.5
    sleepScore = 48
    fatigue = 5
    stress = 4
    readiness = 41
  } else if (email === 'marta.ruiz@triatlonpro.com') {
    // LOW HRV ALERT
    hrv = 51
    rhr = 58
    sleepHours = 5.8
    sleepScore = 62
    fatigue = 4
    stress = 3
    readiness = 55
  }

  await supabase
    .from('user_biometrics')
    .upsert({
      user_id: athleteId,
      date: todayStr,
      hrv,
      rhr,
      sleep_hours: sleepHours,
      sleep_score: sleepScore,
      fatigue_rating: fatigue,
      stress_level: stress,
      readiness_score: readiness
    }, { onConflict: 'user_id,date' })
}

/**
 * Updates workout statuses to completed or missed for the current week to show calendar compliance colors.
 */
async function seedAthleteWorkoutStatuses(supabase: any, athleteId: string, email: string) {
  const now = new Date()
  const currentDay = now.getDay() || 7
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - currentDay + 1)
  startOfWeek.setHours(0,0,0,0)
  
  const mondayStr = startOfWeek.toISOString().split('T')[0]
  
  const tuesday = new Date(startOfWeek)
  tuesday.setDate(startOfWeek.getDate() + 1)
  const tuesdayStr = tuesday.toISOString().split('T')[0]

  const wednesday = new Date(startOfWeek)
  wednesday.setDate(startOfWeek.getDate() + 2)
  const wednesdayStr = wednesday.toISOString().split('T')[0]

  const thursday = new Date(startOfWeek)
  thursday.setDate(startOfWeek.getDate() + 3)
  const thursdayStr = thursday.toISOString().split('T')[0]

  const friday = new Date(startOfWeek)
  friday.setDate(startOfWeek.getDate() + 4)
  const fridayStr = friday.toISOString().split('T')[0]

  const { data: workouts } = await supabase
    .from('user_workouts')
    .select('*')
    .eq('user_id', athleteId)
    .gte('scheduled_date', mondayStr)
    .lte('scheduled_date', fridayStr)

  if (!workouts || workouts.length === 0) return

  const todayStr = new Date().toISOString().split('T')[0]

  for (const w of workouts) {
    let status = 'pending'
    let actual_tss = null
    let completed_at = null

    if (email === 'demo@triatlonpro.com') {
      if (w.scheduled_date <= todayStr) {
        status = 'completed'
        actual_tss = 80
        completed_at = new Date().toISOString()
      }
    } else if (email === 'carlos.garcia@triatlonpro.com') {
      // High TSS: Completed with massive training stress
      if (w.scheduled_date <= todayStr) {
        status = 'completed'
        actual_tss = 240 // very high TSS
        completed_at = new Date().toISOString()
      }
    } else if (email === 'marta.ruiz@triatlonpro.com') {
      // Marta: Some completed, some missed, some pending
      if (w.scheduled_date === mondayStr) {
        status = 'completed'
        actual_tss = 60
        completed_at = new Date().toISOString()
      } else if (w.scheduled_date === tuesdayStr) {
        status = 'missed'
      } else if (w.scheduled_date === wednesdayStr) {
        status = 'pending'
      }
    }

    await supabase
      .from('user_workouts')
      .update({
        status,
        actual_tss,
        completed_at
      } as any)
      .eq('id', w.id)
  }
}

/**
 * Seeds the Coach Demo Account environment.
 */
async function seedCoachDemo(supabase: any, coachId: string) {
  // 1. Ensure the coach profile is set up correctly
  await supabase
    .from('profiles')
    .upsert({
      id: coachId,
      first_name: 'Demo',
      last_name: 'Entrenador',
      role: 'coach',
      email: 'coach-demo@triatlonpro.com',
      level: 'avanzado'
    })

  // Ensure the elite plan template exists
  await ensurePlanExists(supabase)

  // 2. Define the athletes to seed
  const demoAthletes = [
    { email: 'demo@triatlonpro.com', firstName: 'Demo', lastName: 'Atleta', level: 'intermedio' },
    { email: 'carlos.garcia@triatlonpro.com', firstName: 'Carlos', lastName: 'García', level: 'avanzado' },
    { email: 'marta.ruiz@triatlonpro.com', firstName: 'Marta', lastName: 'Ruiz', level: 'principiante' }
  ]

  for (const athlete of demoAthletes) {
    let athleteId = ''

    // A. Check if the athlete profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', athlete.email)
      .maybeSingle()

    if (existingProfile) {
      athleteId = existingProfile.id
    } else {
      // B. If not, create them in auth.users using admin auth
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: athlete.email,
          password: 'demo123456',
          email_confirm: true
        })

        if (authData?.user) {
          athleteId = authData.user.id
          
          // Insert the profile
          await supabase.from('profiles').upsert({
            id: athleteId,
            first_name: athlete.firstName,
            last_name: athlete.lastName,
            level: athlete.level,
            email: athlete.email,
            role: 'athlete'
          })
        } else {
          console.error('Failed to create auth user for demo athlete:', athlete.email, authError)
          continue
        }
      } catch (err) {
        console.error('Error creating demo athlete:', athlete.email, err)
        continue
      }
    }

    if (!athleteId) continue

    // C. Link the athlete to the coach
    await supabase
      .from('coach_athletes')
      .upsert({
        coach_id: coachId,
        athlete_id: athleteId,
        status: 'active'
      }, { onConflict: 'coach_id,athlete_id' })

    // D. Update coach_id reference in profiles
    await supabase
      .from('profiles')
      .update({ coach_id: coachId } as any)
      .eq('id', athleteId)

    // E. Ensure they have active plan 'elite-ironman-plan-001'
    const { data: profileWithPlan } = await supabase
      .from('profiles')
      .select('active_plan_id')
      .eq('id', athleteId)
      .single()

    if (!profileWithPlan?.active_plan_id) {
      await supabase
        .from('profiles')
        .update({ active_plan_id: 'elite-ironman-plan-001' } as any)
        .eq('id', athleteId)

      await instantiateWorkoutsForAthlete(supabase, athleteId, 'elite-ironman-plan-001')
    }

    // F. Seed daily biometrics
    await seedAthleteBiometrics(supabase, athleteId, athlete.email)
    
    // G. Seed workouts status
    await seedAthleteWorkoutStatuses(supabase, athleteId, athlete.email)
  }
}

/**
 * Seeds the Athlete Demo Account environment.
 */
async function seedAthleteDemo(supabase: any, athleteId: string) {
  // 1. Ensure profile is athlete
  await supabase
    .from('profiles')
    .upsert({
      id: athleteId,
      first_name: 'Demo',
      last_name: 'Atleta',
      role: 'athlete',
      email: 'demo@triatlonpro.com',
      level: 'intermedio'
    })

  // Ensure template exists
  await ensurePlanExists(supabase)

  // 2. Ensure they have active plan 'elite-ironman-plan-001'
  const { data: profileWithPlan } = await supabase
    .from('profiles')
    .select('active_plan_id')
    .eq('id', athleteId)
    .single()

  if (!profileWithPlan?.active_plan_id) {
    await supabase
      .from('profiles')
      .update({ active_plan_id: 'elite-ironman-plan-001' } as any)
      .eq('id', athleteId)

    await instantiateWorkoutsForAthlete(supabase, athleteId, 'elite-ironman-plan-001')
  }

  // 3. Seed daily biometrics
  await seedAthleteBiometrics(supabase, athleteId, 'demo@triatlonpro.com')

  // 4. Seed workout statuses
  await seedAthleteWorkoutStatuses(supabase, athleteId, 'demo@triatlonpro.com')
}

/**
 * Main seeding router called by server-side actions.
 */
export async function seedDemoData(email: string, userId: string) {
  const adminSupabase = createAdminClient()
  try {
    if (email === 'coach-demo@triatlonpro.com') {
      await seedCoachDemo(adminSupabase, userId)
    } else if (email === 'demo@triatlonpro.com') {
      await seedAthleteDemo(adminSupabase, userId)
    }
  } catch (err) {
    console.error('Error in seedDemoData:', err)
  }
}
