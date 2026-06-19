import { createAdminClient } from '@/lib/supabase/admin'

// Helper to estimate TSS
function estimateTss(durationMin: number, description: string) {
  if (!durationMin || durationMin <= 0) return 0;
  const desc = (description || '').toLowerCase();
  let intensityFactor = 0.75; // Z2
  if (desc.includes('zona 4') || desc.includes('z4') || desc.includes('series') || desc.includes('fuerte') || desc.includes('umbral')) {
    intensityFactor = 0.88;
  } else if (desc.includes('zona 3') || desc.includes('z3') || desc.includes('ritmo') || desc.includes('tempo')) {
    intensityFactor = 0.80;
  } else if (desc.includes('zona 1') || desc.includes('z1') || desc.includes('recuperación') || desc.includes('suave')) {
    intensityFactor = 0.65;
  }
  const tss = (durationMin / 60) * Math.pow(intensityFactor, 2) * 100;
  return Math.round(tss);
}

// Helper to get Monday of the current week
function getMonday(d: Date) {
  const date = new Date(d);
  const day = date.getDay() || 7;
  const daysSinceMonday = day - 1;
  const monday = new Date(date);
  monday.setDate(monday.getDate() - daysSinceMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Seeds a full 90-day training history, daily biometrics, and telemetry for a demo user.
 */
async function seedAthleteCompleteHistory(supabase: any, athleteId: string, email: string, planId: string) {
  // 1. Get training sessions
  const { data: sessions } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('plan_id', planId)
    .order('week_number', { ascending: true })

  if (!sessions || sessions.length === 0) return

  // 2. Clear old workouts
  await supabase
    .from('user_workouts')
    .delete()
    .eq('user_id', athleteId)

  // 3. Determine start date
  const now = new Date()
  const currentWeekMonday = getMonday(now)
  
  const { data: plan } = await supabase
    .from('training_plans')
    .select('duration_weeks')
    .eq('id', planId)
    .single()

  const durationWeeks = plan?.duration_weeks || 1
  const weeksInPast = Math.min(12, Math.floor(durationWeeks / 2))
  const startDate = new Date(currentWeekMonday)
  startDate.setDate(startDate.getDate() - weeksInPast * 7)

  const dayMap: Record<string, number> = {
    'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 7
  }

  const todayStr = now.toISOString().split('T')[0]
  const workoutsToInsert = []

  for (const session of sessions) {
    const weekOffset = (session.week_number - 1) * 7
    const dayOffset = (dayMap[session.day_name] || 1) - 1
    const scheduledDate = new Date(startDate)
    scheduledDate.setDate(startDate.getDate() + weekOffset + dayOffset)
    const scheduledDateStr = scheduledDate.toISOString().split('T')[0]

    let status = 'pending'
    let actual_tss = null
    let completed_at = null
    let rpe = null

    const durationMin = session.duration_min || 60
    const sport = (session.sport_type || '').toLowerCase()

    if (scheduledDateStr < todayStr) {
      status = 'completed'
      completed_at = new Date(scheduledDate)
      completed_at.setHours(18, 0, 0, 0)
      
      if (sport === 'descanso') {
        actual_tss = 0
      } else if (sport === 'fuerza') {
        actual_tss = 30
        rpe = Math.floor(Math.random() * 3) + 3 // 3 to 5
      } else {
        const baseTss = estimateTss(durationMin, session.description)
        actual_tss = Math.round(baseTss * (0.85 + Math.random() * 0.3))
        rpe = Math.floor(Math.random() * 4) + 4 // 4 to 7
      }
    } else if (scheduledDateStr === todayStr) {
      if (Math.random() > 0.5 && sport !== 'descanso') {
        status = 'completed'
        completed_at = new Date(now)
        if (sport === 'fuerza') {
          actual_tss = 30
          rpe = 4
        } else {
          const baseTss = estimateTss(durationMin, session.description)
          actual_tss = Math.round(baseTss * 0.95)
          rpe = 5
        }
      } else {
        status = 'pending'
      }
    } else {
      status = 'pending'
    }

    workoutsToInsert.push({
      user_id: athleteId,
      session_id: session.id,
      scheduled_date: scheduledDateStr,
      status,
      completed_at: completed_at ? completed_at.toISOString() : null,
      actual_tss,
      rpe,
      auto_adjusted: false
    })
  }

  // Insert workouts
  const { data: insertedWorkouts, error: workoutsError } = await supabase
    .from('user_workouts')
    .insert(workoutsToInsert)
    .select('id, status, scheduled_date, session_id, actual_tss')

  if (workoutsError || !insertedWorkouts) {
    console.error("Error inserting demo workouts:", workoutsError)
    return
  }

  // 4. Insert telemetry for completed workouts
  const sessionMap = new Map(sessions.map((s: any) => [s.id, s]))
  const telemetryToInsert = []

  for (const w of insertedWorkouts) {
    if (w.status !== 'completed') continue

    const session = sessionMap.get(w.session_id) as any
    if (!session) continue

    const sport = (session.sport_type || '').toLowerCase()
    if (sport === 'descanso' || sport === 'fuerza') continue

    const durationMin = session.duration_min || 60
    const actualDuration = durationMin * (0.92 + Math.random() * 0.16)
    const movingTime = actualDuration * 0.97
    
    let distanceKm = 0
    if (sport.includes('swim') || sport.includes('natación')) {
      distanceKm = Number((actualDuration * 0.038).toFixed(2))
    } else if (sport.includes('bike') || sport.includes('ciclismo')) {
      distanceKm = Number((actualDuration * 0.44).toFixed(1))
    } else if (sport.includes('run') || sport.includes('carrera')) {
      distanceKm = Number((actualDuration * 0.17).toFixed(1))
    } else if (sport.includes('brick')) {
      distanceKm = Number(((actualDuration * 0.44 * 0.7) + (actualDuration * 0.17 * 0.3)).toFixed(1))
    }

    const elevation = sport.includes('bike') ? Math.floor(actualDuration * 8 * Math.random()) :
                      sport.includes('run') ? Math.floor(actualDuration * 3 * Math.random()) : 0

    const avgHr = Math.floor(132 + Math.random() * 26)
    const maxHr = avgHr + Math.floor(16 + Math.random() * 12)
    const totalSec = Math.round(actualDuration * 60)

    const Z1 = Math.round(totalSec * 0.12)
    const Z2 = Math.round(totalSec * 0.68)
    const Z3 = Math.round(totalSec * 0.14)
    const Z4 = Math.round(totalSec * 0.05)
    const Z5 = Math.round(totalSec * 0.01)

    const telemetryPoint: any = {
      workout_id: w.id,
      user_id: athleteId,
      source_provider: 'garmin',
      external_activity_id: `garmin_fit_${w.id}`,
      actual_duration_min: Number(actualDuration.toFixed(1)),
      moving_time_min: Number(movingTime.toFixed(1)),
      actual_distance_km: distanceKm,
      elevation_gain_m: elevation,
      actual_tss: w.actual_tss || 60,
      avg_hr: avgHr,
      max_hr: maxHr,
      hr_zones_summary: { Z1, Z2, Z3, Z4, Z5 },
      avg_power: (sport.includes('bike') || sport.includes('brick')) ? Math.floor(190 + Math.random() * 60) : null,
      normalized_power: null,
      avg_cadence: sport.includes('bike') ? Math.floor(84 + Math.random() * 10) :
                   sport.includes('run') ? Math.floor(166 + Math.random() * 10) : null,
      training_effect_aerobic: Number((3.2 + Math.random() * 1.5).toFixed(1)),
      training_effect_anaerobic: Number((0.4 + Math.random() * 2.2).toFixed(1)),
      raw_payload: { seeded: true, importDate: new Date().toISOString() }
    }

    if (telemetryPoint.avg_power) {
      telemetryPoint.normalized_power = telemetryPoint.avg_power + Math.floor(8 + Math.random() * 12)
    }

    telemetryToInsert.push(telemetryPoint)
  }

  if (telemetryToInsert.length > 0) {
    await supabase.from('universal_telemetry').insert(telemetryToInsert)
  }

  // 5. Seed daily biometrics (90 days)
  await supabase.from('user_biometrics').delete().eq('user_id', athleteId)

  const biometricsToInsert = []
  const bioStartDate = new Date(now)
  bioStartDate.setDate(bioStartDate.getDate() - 90)

  for (let i = 0; i <= 90; i++) {
    const d = new Date(bioStartDate)
    d.setDate(bioStartDate.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]

    const angle = i / 6
    const hrv = Math.round(64 + Math.sin(angle) * 8 + Math.cos(i / 13) * 4)
    const rhr = Math.round(51 - Math.sin(angle) * 3 + Math.cos(i / 9) * 2)
    const sleepHours = Number((7.6 + Math.sin(angle / 2) * 0.8 + Math.cos(i / 7) * 0.4).toFixed(1))
    const sleepScore = Math.min(100, Math.round(sleepHours * 10.5 + Math.sin(angle) * 5))
    const weight = Number((72.5 + Math.sin(i / 15) * 0.6).toFixed(1))
    const fatigue = Math.floor(Math.sin(angle) * 1.5 + 2.5)
    const stress = Math.floor(Math.cos(angle / 2.2) * 1.2 + 2.2)

    const sleepScorePct = Math.min(35, (sleepHours / 8.0) * 35)
    const hrvScorePct = Math.min(25, (hrv / 65) * 25)
    const rhrScorePct = Math.min(20, (52 / rhr) * 20)
    const fatigueScorePct = ((6 - fatigue) / 5) * 10
    const stressScorePct = ((6 - stress) / 5) * 10
    const readiness = Math.min(100, Math.max(0, Math.round(sleepScorePct + hrvScorePct + rhrScorePct + fatigueScorePct + stressScorePct)))

    biometricsToInsert.push({
      user_id: athleteId,
      date: dateStr,
      hrv,
      rhr,
      sleep_hours: sleepHours,
      sleep_score: sleepScore,
      weight,
      fatigue_rating: Math.max(1, Math.min(5, fatigue)),
      stress_level: Math.max(1, Math.min(5, stress)),
      readiness_score: readiness
    })
  }

  await supabase.from('user_biometrics').insert(biometricsToInsert)
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

  // 2. Define the athletes to seed
  const demoAthletes = [
    { email: 'demo@triatlonpro.com', firstName: 'Demo', lastName: 'Atleta', level: 'intermedio', planId: '703_20sem' },
    { email: 'carlos.garcia@triatlonpro.com', firstName: 'Carlos', lastName: 'García', level: 'avanzado', planId: 'ironman_24sem' },
    { email: 'marta.ruiz@triatlonpro.com', firstName: 'Marta', lastName: 'Ruiz', level: 'principiante', planId: 'sprint_8sem' }
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
      .update({ coach_id: coachId, active_plan_id: athlete.planId } as any)
      .eq('id', athleteId)

    // E. Seed comprehensive history
    await seedAthleteCompleteHistory(supabase, athleteId, athlete.email, athlete.planId)
  }
}

/**
 * Seeds the Athlete Demo Account environment.
 */
async function seedAthleteDemo(supabase: any, athleteId: string) {
  const email = 'demo@triatlonpro.com'
  const planId = '703_20sem'

  // 1. Ensure profile is athlete
  await supabase
    .from('profiles')
    .upsert({
      id: athleteId,
      first_name: 'Demo',
      last_name: 'Atleta',
      role: 'athlete',
      email: email,
      level: 'intermedio',
      active_plan_id: planId
    })

  // 2. Seed comprehensive history
  await seedAthleteCompleteHistory(supabase, athleteId, email, planId)
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
