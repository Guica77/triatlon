'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { fetchGarminData } from '@/lib/telemetry/garmin-sync'

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
  raw_garmin_data?: any
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

export async function getDailyBiometrics(): Promise<{ data?: DailyBiometrics; history?: any[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const today = new Date().toISOString().split('T')[0]

  try {
    const { data: existing } = await supabase
      .from('user_biometrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    const { data: history } = await supabase
      .from('user_biometrics')
      .select('date, hrv, rhr, sleep_hours, readiness_score')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(7)

    const cronHistory = history ? [...history].reverse() : []

    // Retornar objeto vacío puesto a cero para el día de hoy (sin guardar en base de datos)
    const defaultBiometrics: DailyBiometrics = {
      user_id: user.id,
      date: today,
      hrv: null,
      rhr: null,
      sleep_hours: null,
      sleep_score: null,
      weight: null,
      fatigue_rating: null,
      stress_level: null,
      readiness_score: null,
    }

    return { data: existing || defaultBiometrics, history: cronHistory }
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

export async function syncGarminToDatabaseAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autorizado' }
  }

  try {
    // 1. Fetch Garmin credentials from user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('garmin_auth_tokens')
      .eq('id', user.id)
      .single()

    const tokens = profile?.garmin_auth_tokens
    if (!tokens || !tokens.email || !tokens.password) {
      return { error: 'No hay credenciales de Garmin guardadas. Por favor conéctalo en Ajustes.' }
    }

    // 2. Fetch data natively
    const res = await fetchGarminData(tokens.email, tokens.password, user.id)
    if (res.error || !res.data) {
      return { error: res.error || 'Fallo al ejecutar la extracción de Garmin.' }
    }

    const garminData = res.data
    const today = new Date().toISOString().split('T')[0]
    
    // Fetch current biometrics to not overwrite manual fatigue/stress
    const { data: existing } = await supabase
      .from('user_biometrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()
      
    let garminFatigue = null
    if (garminData.body_battery) {
      const bb = garminData.body_battery
      if (bb > 75) garminFatigue = 1
      else if (bb > 50) garminFatigue = 2
      else if (bb > 25) garminFatigue = 3
      else if (bb > 10) garminFatigue = 4
      else garminFatigue = 5
    }
      
    const fatigue = existing?.fatigue_rating ?? garminFatigue ?? 2
    const garminStress = garminData.stress ? Math.max(1, Math.min(5, Math.ceil(garminData.stress / 20))) : null
    const stress = garminStress ?? existing?.stress_level ?? 2
    const rawHrv = garminData.raw_garmin_data?.hrv?.hrvSummary?.lastNightAvg 
      ?? garminData.raw_garmin_data?.hrv?.lastNightAvg 
      ?? null
    
    const hrv = rawHrv ?? existing?.hrv ?? 65 // Default o el que tuviera
    
    const rhr = garminData.resting_hr ?? existing?.rhr ?? 52
    const sleepHours = garminData.sleep_duration_hours ?? existing?.sleep_hours ?? 7.5
    const sleepScore = garminData.sleep_score ?? existing?.sleep_score ?? Math.round(sleepHours * 10)
    
    // Calculate new readiness
    const { data: calc } = await calculateReadiness(hrv, rhr, sleepHours, fatigue, stress)
    
    const { error: upsertError } = await supabase
      .from('user_biometrics')
      .upsert({
        user_id: user.id,
        date: today,
        hrv,
        rhr,
        sleep_hours: Number(sleepHours.toFixed(1)),
        sleep_score: sleepScore,
        fatigue_rating: fatigue,
        stress_level: stress,
        readiness_score: calc?.readiness_score ?? 0,
        raw_garmin_data: garminData.raw_garmin_data
      } as any, { onConflict: 'user_id, date' })
      
    if (upsertError) {
      console.error("Error upsert Garmin data:", upsertError)
      return { error: 'Error guardando datos de Garmin en la BD.' }
    }
    
    revalidatePath('/dashboard')
    revalidatePath('/settings')
    return { success: true, data: garminData }
    
  } catch (e: any) {
    console.error('Error in syncGarminToDatabaseAction:', e)
    return { error: 'Error inesperado durante la sincronización.' }
  }
}
