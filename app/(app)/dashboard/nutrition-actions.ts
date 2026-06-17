'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  calculateSweatRate,
  calculateDailyMacros,
  calculateSessionPacing,
  calculateWorkoutCalories,
  DynamicNutritionData
} from '@/lib/nutrition-utility'

export interface SweatTestData {
  weightBefore: number
  weightAfter: number
  fluidIntake: number // in ml
  durationMin: number
}

/**
 * Guarda los resultados del test de sudoración y calcula la tasa de sudoración (L/h)
 */
export async function saveSweatTest(data: SweatTestData): Promise<{ success?: boolean; error?: string; sweatRate?: number }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { weightBefore, weightAfter, fluidIntake, durationMin } = data

  if (weightBefore <= 0 || weightAfter <= 0 || durationMin <= 0) {
    return { error: 'Valores del test inválidos. Los pesos y la duración deben ser mayores que cero.' }
  }

  try {
    const sweatRate = calculateSweatRate(weightBefore, weightAfter, fluidIntake, durationMin)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        sweat_rate: sweatRate,
        sweat_test_weight_before: weightBefore,
        sweat_test_weight_after: weightAfter,
        sweat_test_fluid_intake: fluidIntake,
        sweat_test_duration_min: durationMin
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error al guardar el test de sudoración:', updateError)
      return { error: updateError.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/settings')
    return { success: true, sweatRate }
  } catch (err: any) {
    console.error('Excepción en saveSweatTest:', err)
    return { error: err.message || 'Error interno al guardar el test.' }
  }
}

/**
 * Calcula las calorías, macros del día y la estrategia de pacing del entrenamiento
 * basado en la carga programada para la fecha y el perfil biométrico del usuario
 */
export async function getDailyNutrition(dateString: string): Promise<{ data?: DynamicNutritionData; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  try {
    // 1. Obtener perfil del atleta
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('sweat_rate, custom_carbs_per_hour')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { error: 'No se pudo cargar el perfil del atleta.' }
    }

    // 2. Obtener peso del atleta para el día (de biometrics) o el más reciente
    const { data: latestBiometrics } = await supabase
      .from('user_biometrics')
      .select('weight')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)

    // Si no hay registro previo, usamos 72.0 kg por defecto
    const weight = Number(latestBiometrics?.[0]?.weight || 72.0)

    // 3. Obtener entrenamientos del día
    const { data: workouts, error: workoutsError } = await supabase
      .from('user_workouts')
      .select('id, status, training_sessions(sport_type, duration_min, description)')
      .eq('user_id', user.id)
      .eq('scheduled_date', dateString)

    if (workoutsError) {
      console.error('Error al cargar entrenamientos para la nutrición:', workoutsError)
      return { error: 'Error al cargar los entrenamientos diarios.' }
    }

    // 4. Calcular gasto por actividad y duración total
    let activeExpenditure = 0
    let totalWorkoutHours = 0
    let hasStrengthSession = false
    let hasBrickSession = false

    const sessionsPacing: Array<any> = []

    workouts?.forEach((w: any) => {
      const session = w.training_sessions
      if (!session || session.sport_type === 'descanso') return

      const durationMin = session.duration_min || 0
      const durationHours = durationMin / 60
      totalWorkoutHours += durationHours

      const sport = session.sport_type
      if (sport === 'fuerza') hasStrengthSession = true
      if (sport === 'brick') hasBrickSession = true

      // Calcular calorías quemadas
      const kcalBurned = calculateWorkoutCalories(sport, weight, durationMin)
      activeExpenditure += kcalBurned

      // Calcular pacing
      const sweatRate = Number(profile.sweat_rate || 0.8)
      const pacing = calculateSessionPacing(sport, durationMin, sweatRate, profile.custom_carbs_per_hour)

      sessionsPacing.push({
        workoutId: w.id,
        sportType: sport,
        durationMin,
        hourlyFluidMl: pacing.hourlyFluidMl,
        totalFluidMl: pacing.totalFluidMl,
        hourlySodiumMg: pacing.hourlySodiumMg,
        totalSodiumMg: pacing.totalSodiumMg,
        hourlyCarbsG: pacing.hourlyCarbsG,
        totalCarbsG: pacing.totalCarbsG,
        practicalGuide: pacing.practicalGuide
      })
    })

    // 5. Calcular distribución diaria de macronutrientes
    const macrosCalc = calculateDailyMacros(
      weight,
      totalWorkoutHours,
      hasStrengthSession,
      hasBrickSession,
      activeExpenditure
    )

    const data: DynamicNutritionData = {
      bmr: macrosCalc.bmr,
      baseExpenditure: macrosCalc.baseExpenditure,
      activeExpenditure: macrosCalc.activeExpenditure,
      totalCalories: macrosCalc.totalCalories,
      weight,
      macros: {
        carbs: macrosCalc.carbs,
        protein: macrosCalc.protein,
        fat: macrosCalc.fat
      },
      sessionsPacing
    }

    return { data }
  } catch (err: any) {
    console.error('Excepción en getDailyNutrition:', err)
    return { error: err.message || 'Error interno al calcular la nutrición.' }
  }
}
