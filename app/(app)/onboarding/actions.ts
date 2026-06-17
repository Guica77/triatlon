'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function selectPlan(planId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Obtener nivel del plan
  const { data: planData } = await supabase
    .from('training_plans')
    .select('level')
    .eq('id', planId)
    .single()

  const level = planData?.level || 'intermedio'

  // 1.5 Comprobar si el perfil ya existe para evitar fallos de RLS con upsert en Supabase
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  const profilePayload = {
    id: user.id,
    first_name: user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.first_name || 'Triatleta',
    level: level,
    active_plan_id: planId 
  };

  let profileError = null;

  if (existingProfile) {
    const { error } = await supabase
      .from('profiles')
      .update(profilePayload)
      .eq('id', user.id);
    profileError = error;
  } else {
    const { error } = await supabase
      .from('profiles')
      .insert(profilePayload);
    profileError = error;
  }

  if (profileError) {
    console.error("Error actualizando plan en perfil:", profileError)
    return { error: profileError.message }
  }

  // 2. Limpiar workouts anteriores si tuviera
  await supabase
    .from('user_workouts')
    .delete()
    .eq('user_id', user.id)

  // 3. Obtener sesiones del plan
  const { data: sessions, error: sessionsError } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('plan_id', planId)
    .order('week_number', { ascending: true })

  if (sessionsError || !sessions || sessions.length === 0) {
    console.error("Error obteniendo sesiones del plan:", sessionsError)
    // Aunque no tenga sesiones detalladas, le dejamos ir al dashboard con el plan asignado
    redirect('/dashboard')
  }

  // 4. Instanciar en el calendario (user_workouts)
  // Mapeamos los días de la semana a números de día relativos
  const dayMap: Record<string, number> = {
    'Lunes': 1,
    'Martes': 2,
    'Miércoles': 3,
    'Jueves': 4,
    'Viernes': 5,
    'Sábado': 6,
    'Domingo': 7,
  }

  // El plan empieza el lunes de esta misma semana para tener entrenamientos activos hoy
  const now = new Date()
  const currentDay = now.getDay() || 7 // 1 Lunes ... 7 Domingo
  const daysSinceMonday = currentDay - 1
  
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - daysSinceMonday)
  startDate.setHours(0, 0, 0, 0)

  const workoutInserts = sessions.map(session => {
    // Calculamos el offset de días: (semana - 1) * 7 + (dia_semana - 1)
    const weekOffset = (session.week_number - 1) * 7
    const dayOffset = (dayMap[session.day_name] || 1) - 1
    
    const scheduledDate = new Date(startDate)
    scheduledDate.setDate(scheduledDate.getDate() + weekOffset + dayOffset)

    return {
      user_id: user.id,
      session_id: session.id,
      scheduled_date: scheduledDate.toISOString().split('T')[0],
      status: 'pending',
    }
  })

  const { error: workoutsError } = await supabase
    .from('user_workouts')
    .insert(workoutInserts)

  if (workoutsError) {
    console.error("Error insertando user_workouts:", workoutsError)
    return { error: workoutsError.message }
  }

  redirect('/dashboard')
}

export async function saveRaceGoalAndPlan(formData: {
  target_race_name?: string;
  target_race_date?: string;
  target_race_distance?: 'sprint' | 'olimpico' | 'half' | 'full';
  target_race_modality?: string;
  target_finish_time?: string;
  baseline_training_hours?: string;
  current_ftp?: number;
  current_swim_pace?: string;
  current_run_pace?: string;
  virtual_garage?: string[];
  swim_weekly_hours?: number;
  bike_weekly_hours?: number;
  run_weekly_hours?: number;
  target_swim_time?: string;
  target_bike_time?: string;
  target_run_time?: string;
  athlete_level?: string;
  wants_coach?: boolean;
  preferred_ingredients?: string[];
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { 
    target_race_name = 'Objetivo Pendiente', target_race_date = '2026-12-31', 
    target_race_distance = 'half', target_race_modality = 'triatlon',
    target_finish_time, baseline_training_hours = '7-10h', virtual_garage = [],
    swim_weekly_hours = 2, bike_weekly_hours = 4, run_weekly_hours = 3,
    target_swim_time, target_bike_time, target_run_time, athlete_level = 'intermedio'
  } = formData;

  // AI Estimation Fallback Logic for Physiological Metrics
  let { current_ftp, current_swim_pace, current_run_pace } = formData;
  
  if (!current_ftp) {
    if (baseline_training_hours?.includes('12+')) current_ftp = 280;
    else if (baseline_training_hours?.includes('7-10')) current_ftp = 230;
    else current_ftp = 180;
  }
  
  if (!current_swim_pace) {
    if (baseline_training_hours?.includes('12+')) current_swim_pace = '01:30';
    else if (baseline_training_hours?.includes('7-10')) current_swim_pace = '01:45';
    else current_swim_pace = '02:00';
  }

  if (!current_run_pace) {
    if (baseline_training_hours?.includes('12+')) current_run_pace = '04:15';
    else if (baseline_training_hours?.includes('7-10')) current_run_pace = '04:45';
    else current_run_pace = '05:30';
  }

  // 1. Obtener todos los planes para buscar el que mejor coincida con la distancia y el nivel
  const { data: plans } = await supabase
    .from('training_plans')
    .select('*');

  let selectedPlanId = plans?.[0]?.id; // Respaldo por defecto

  if (plans && plans.length > 0) {
    // Buscar coincidencia por distancia y nivel
    let match = plans.find((p: any) => {
      const dist = (p.distance || '').toLowerCase();
      const planLvl = (p.level || '').toLowerCase();
      const targetLvl = (athlete_level || 'intermedio').toLowerCase();
      
      const distanceMatch = 
        (target_race_distance === 'sprint' && dist.includes('sprint')) ||
        (target_race_distance === 'olimpico' && (dist.includes('olimpico') || dist.includes('olímpico'))) ||
        (target_race_distance === 'half' && (dist.includes('half') || dist.includes('70.3') || dist.includes('media'))) ||
        (target_race_distance === 'full' && (dist.includes('full') || dist.includes('ironman') || dist.includes('larga')));

      const levelMatch = 
        planLvl === targetLvl || 
        (targetLvl === 'principiante' && (planLvl === 'principiante' || planLvl === 'principiante_absoluto'));

      return distanceMatch && levelMatch;
    });

    // Fallback si no hay coincidencia de nivel
    if (!match) {
      match = plans.find((p: any) => {
        const dist = (p.distance || '').toLowerCase();
        return (target_race_distance === 'sprint' && dist.includes('sprint')) ||
               (target_race_distance === 'olimpico' && (dist.includes('olimpico') || dist.includes('olímpico'))) ||
               (target_race_distance === 'half' && (dist.includes('half') || dist.includes('70.3') || dist.includes('media'))) ||
               (target_race_distance === 'full' && (dist.includes('full') || dist.includes('ironman') || dist.includes('larga')));
      });
    }

    if (match) {
      selectedPlanId = match.id;
    }
  }

  if (!selectedPlanId) {
    redirect('/dashboard');
  }

  // 1.8 Determinar nivel final
  const selectedPlan = plans?.find((p: any) => p.id === selectedPlanId);
  const level = athlete_level || selectedPlan?.level || 'intermedio';

  // 2. Comprobar si el perfil ya existe para evitar fallos de RLS con upsert en Supabase
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  const profilePayload = {
    id: user.id,
    first_name: user.user_metadata?.full_name?.split(' ')[0] || user.user_metadata?.first_name || 'Triatleta',
    last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || user.user_metadata?.last_name || '',
    level: level,
    target_race_name,
    target_race_date,
    target_race_distance,
    target_race_modality,
    target_finish_time,
    baseline_training_hours,
    current_ftp,
    current_swim_pace,
    current_run_pace,
    virtual_garage,
    swim_weekly_hours,
    bike_weekly_hours,
    run_weekly_hours,
    target_swim_time,
    target_bike_time,
    target_run_time,
    active_plan_id: selectedPlanId,
    preferred_ingredients: formData.preferred_ingredients || []
  };

  let profileError = null;

  if (existingProfile) {
    const { error } = await supabase
      .from('profiles')
      .update(profilePayload)
      .eq('id', user.id);
    profileError = error;
  } else {
    const { error } = await supabase
      .from('profiles')
      .insert(profilePayload);
    profileError = error;
  }

  if (profileError) {
    console.error("Error actualizando objetivos de carrera en perfil:", profileError);
    return { error: profileError.message };
  }

  // 3. Limpiar workouts anteriores
  await supabase
    .from('user_workouts')
    .delete()
    .eq('user_id', user.id);

  // 4. Obtener sesiones del plan seleccionado
  const { data: sessions, error: sessionsError } = await supabase
    .from('training_sessions')
    .select('*')
    .eq('plan_id', selectedPlanId)
    .order('week_number', { ascending: true });

  if (sessionsError || !sessions || sessions.length === 0) {
    redirect('/dashboard');
  }

  // Filtrado Inteligente de Sesiones según Modalidad Deportiva (Multisport)
  const filteredSessions = sessions.filter((session: any) => {
    const sport = (session.sport_type || '').toLowerCase();
    if (target_race_modality === 'acuabike' && sport.includes('run')) return false; // Sin carrera a pie
    if (target_race_modality === 'duatlon' && sport.includes('swim')) return false; // Sin natación
    if (target_race_modality === 'acuatlon' && sport.includes('bike')) return false; // Sin ciclismo
    return true;
  });

  // 5. Instanciar en el calendario (user_workouts)
  const dayMap: Record<string, number> = {
    'Lunes': 1,
    'Martes': 2,
    'Miércoles': 3,
    'Jueves': 4,
    'Viernes': 5,
    'Sábado': 6,
    'Domingo': 7,
  };

  const now = new Date();
  const currentDay = now.getDay() || 7;
  const daysSinceMonday = currentDay - 1;
  
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - daysSinceMonday);
  startDate.setHours(0, 0, 0, 0);

  const workoutInserts = filteredSessions.map((session: any) => {
    const weekOffset = (session.week_number - 1) * 7;
    const dayOffset = (dayMap[session.day_name] || 1) - 1;
    
    const scheduledDate = new Date(startDate);
    scheduledDate.setDate(scheduledDate.getDate() + weekOffset + dayOffset);

    return {
      user_id: user.id,
      session_id: session.id,
      scheduled_date: scheduledDate.toISOString().split('T')[0],
      status: 'pending',
    };
  });

  if (workoutInserts.length > 0) {
    const { error: workoutsError } = await supabase
      .from('user_workouts')
      .insert(workoutInserts);

    if (workoutsError) {
      console.error("Error insertando user_workouts en saveRaceGoalAndPlan:", workoutsError);
      return { error: workoutsError.message };
    }
  }

  return { success: true };
}

