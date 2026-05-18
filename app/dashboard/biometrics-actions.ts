'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface DailyBiometrics {
  id?: string
  user_id: string
  date: string
  hrv: number | null
  rhr: number | null
  sleep_hours: number | null
  sleep_score: number | null
  weight: number | null
  fatigue_rating: number | null // 1 a 5
  stress_level: number | null // 1 a 5
  readiness_score: number | null
}

export async function calculateReadiness(
  hrv: number,
  rhr: number,
  sleepHours: number,
  fatigueRating: number,
  stressLevel: number
) {
  // Ponderación Holística:
  // Sueño (35%): Meta 8.0h -> (sleepHours / 8.0) * 35 (max 35)
  // HRV (25%): Media 65ms -> (hrv / 65) * 25 (max 25)
  // RHR (20%): Media 52bpm -> (52 / rhr) * 20 (max 20)
  // Fatiga Muscular (10%): Escala inversa -> (6 - fatigueRating) / 5 * 10 (max 10)
  // Nivel de Estrés (10%): Escala inversa -> (6 - stressLevel) / 5 * 10 (max 10)

  const sleepScoreNum = Math.min(35, (sleepHours / 8.0) * 35)
  const hrvScoreNum = Math.min(25, (hrv / 65) * 25)
  const rhrScoreNum = Math.min(20, (52 / rhr) * 20)
  const fatigueScoreNum = ((6 - fatigueRating) / 5) * 10
  const stressScoreNum = ((6 - stressLevel) / 5) * 10

  const totalScore = Math.round(sleepScoreNum + hrvScoreNum + rhrScoreNum + fatigueScoreNum + stressScoreNum)
  const readiness_score = Math.min(100, Math.max(0, totalScore))

  // Calcular etiquetas de estado
  const sleepStatus = sleepHours >= 7.5 ? 'Óptimo' : sleepHours >= 6.0 ? 'Moderado' : 'Deficiente'
  const hrvStatus = hrv >= 65 ? '+12% vs Media' : hrv >= 55 ? 'Estable' : 'Por debajo de media'
  const rhrStatus = rhr <= 52 ? 'Óptimo' : rhr <= 58 ? 'Estable' : 'Elevado'

  return {
    data: {
      readiness_score,
      sleepStatus,
      hrvStatus,
      rhrStatus,
    }
  }
}

export async function getDailyBiometrics(): Promise<{ data?: DailyBiometrics; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const today = new Date().toISOString().split('T')[0]

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('user_biometrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (existing) {
      return { data: existing }
    }

    // Generar Simulación Inicial Automática
    const defaultBiometrics: DailyBiometrics = {
      user_id: user.id,
      date: today,
      hrv: 68,
      rhr: 48,
      sleep_hours: 7.8,
      sleep_score: 88,
      weight: 72.0,
      fatigue_rating: 2,
      stress_level: 2,
      readiness_score: 88,
    }

    const { data: calc } = await calculateReadiness(
      defaultBiometrics.hrv || 68,
      defaultBiometrics.rhr || 48,
      defaultBiometrics.sleep_hours || 7.8,
      defaultBiometrics.fatigue_rating || 2,
      defaultBiometrics.stress_level || 2
    )
    defaultBiometrics.readiness_score = calc.readiness_score

    const { data: inserted, error: insertError } = await supabase
      .from('user_biometrics')
      .insert(defaultBiometrics)
      .select()
      .single()

    if (insertError) {
      console.error("Error insertando biometría por defecto:", insertError)
      // Devolver los datos en memoria para que la UI funcione aunque falle BD
      return { data: defaultBiometrics }
    }

    return { data: inserted }
  } catch (err: any) {
    console.error("Excepción en getDailyBiometrics:", err)
    return { error: err.message || "Error al obtener biometría" }
  }
}

export async function updateBiometrics(formData: Partial<DailyBiometrics>): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const today = new Date().toISOString().split('T')[0]

  try {
    const hrv = formData.hrv ?? 65
    const rhr = formData.rhr ?? 52
    const sleep_hours = formData.sleep_hours ?? 7.5
    const weight = formData.weight ?? 72.0
    const fatigue_rating = formData.fatigue_rating ?? 2
    const stress_level = formData.stress_level ?? 2

    const { data: calc } = await calculateReadiness(hrv, rhr, sleep_hours, fatigue_rating, stress_level)

    const { error: upsertError } = await supabase
      .from('user_biometrics')
      .upsert(
        {
          user_id: user.id,
          date: today,
          hrv,
          rhr,
          sleep_hours,
          sleep_score: Math.round(sleep_hours * 10),
          weight,
          fatigue_rating,
          stress_level,
          readiness_score: calc.readiness_score,
        },
        { onConflict: 'user_id,date' }
      )

    if (upsertError) {
      console.error("Error en updateBiometrics:", upsertError)
      return { error: upsertError.message }
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error("Excepción en updateBiometrics:", err)
    return { error: err.message || "Error al actualizar biometría" }
  }
}
