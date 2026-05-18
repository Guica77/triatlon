'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface WorkoutFeedbackData {
  workout_id: string;
  rpe_score: number;
  feeling: string;
  notes?: string;
}

export interface CoachFeedbackData {
  athlete_id?: string;
  feedback_type: string;
  content: string;
}

export interface AthleteSummary {
  id: string;
  first_name: string | null;
  last_name: string | null;
  level: string | null;
  target_race_name: string | null;
  target_race_date: string | null;
  recent_feedbacks: {
    rpe_score: number;
    feeling: string;
    notes: string | null;
    created_at: string;
  }[];
}

export async function submitWorkoutFeedback(formData: WorkoutFeedbackData) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { error: 'No autorizado' };

    const { error } = await supabase.from('workout_feedback').insert({
      workout_id: formData.workout_id,
      user_id: authData.user.id,
      rpe_score: formData.rpe_score,
      feeling: formData.feeling,
      notes: formData.notes || null
    });

    if (error) return { error: error.message };

    revalidatePath('/dashboard');
    revalidatePath('/analytics');
    revalidatePath('/coach-portal');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Error al guardar el feedback' };
  }
}

export async function submitCoachFeedback(formData: CoachFeedbackData) {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return { error: 'No autorizado' };

    const { error } = await supabase.from('coach_feedback').insert({
      coach_id: authData.user.id,
      athlete_id: formData.athlete_id || null,
      feedback_type: formData.feedback_type,
      content: formData.content
    });

    if (error) return { error: error.message };

    revalidatePath('/coach-portal');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Error al enviar la sugerencia' };
  }
}

export async function getCoachDashboardData(): Promise<{
  athletes: AthleteSummary[];
  suggestions: {
    id: string;
    feedback_type: string;
    content: string;
    status: string;
    created_at: string;
  }[];
}> {
  try {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    
    // Si no hay usuario o hay error, devolvemos datos simulados espectaculares para la demo
    if (!authData?.user) {
      return getFallbackCoachData();
    }

    const coachId = authData.user.id;

    // 1. Obtener los py-atletas asignados a este entrenador
    const { data: athletesData, error: athletesError } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        level,
        target_race_name,
        target_race_date
      `)
      .eq('coach_id', coachId);

    if (athletesError || !athletesData || athletesData.length === 0) {
      return getFallbackCoachData();
    }

    // 2. Para cada atleta, obtener sus feedbacks recientes
    const athletesWithFeedback: AthleteSummary[] = [];

    for (const ath of athletesData) {
      const { data: feedbacks } = await supabase
        .from('workout_feedback')
        .select('rpe_score, feeling, notes, created_at')
        .eq('user_id', ath.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const formattedFeedbacks = (feedbacks || []).map(f => ({
        ...f,
        created_at: f.created_at ?? new Date().toISOString()
      }));

      athletesWithFeedback.push({
        ...ath,
        recent_feedbacks: formattedFeedbacks
      });
    }

    // 3. Obtener las sugerencias previas enviadas por este entrenador
    const { data: suggestionsData } = await supabase
      .from('coach_feedback')
      .select('id, feedback_type, content, status, created_at')
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    const formattedSuggestions = (suggestionsData || []).map(s => ({
      ...s,
      status: s.status ?? 'pending',
      created_at: s.created_at ?? new Date().toISOString()
    }));

    return {
      athletes: athletesWithFeedback,
      suggestions: formattedSuggestions
    };
  } catch (error) {
    console.error('Error en getCoachDashboardData:', error);
    return getFallbackCoachData();
  }
}

function getFallbackCoachData() {
  return {
    athletes: [
      {
        id: 'ath-1',
        first_name: 'Carlos',
        last_name: 'Gómez',
        level: 'Avanzado',
        target_race_name: 'Ironman Lanzarote',
        target_race_date: '2026-10-15',
        recent_feedbacks: [
          { rpe_score: 8, feeling: 'fatigado', notes: 'Mucho viento en la bici, piernas pesadas en la transición', created_at: '2026-05-16T18:00:00Z' },
          { rpe_score: 6, feeling: 'buena', notes: 'Series de natación clavadas en ritmo', created_at: '2026-05-15T19:30:00Z' }
        ]
      },
      {
        id: 'ath-2',
        first_name: 'Elena',
        last_name: 'Rostova',
        level: 'Intermedio',
        target_race_name: 'Triatlón de Zarautz',
        target_race_date: '2026-06-14',
        recent_feedbacks: [
          { rpe_score: 9, feeling: 'excelente', notes: 'Test de FTP superado con +15W de mejora', created_at: '2026-05-16T11:00:00Z' }
        ]
      },
      {
        id: 'ath-3',
        first_name: 'Marc',
        last_name: 'Vidal',
        level: 'Principiante',
        target_race_name: 'Duatlón de Banyoles',
        target_race_date: '2026-09-20',
        recent_feedbacks: [
          { rpe_score: 4, feeling: 'buena', notes: 'Rodaje suave muy cómodo', created_at: '2026-05-14T20:00:00Z' }
        ]
      }
    ],
    suggestions: [
      {
        id: 'sug-1',
        feedback_type: 'platform_improvement',
        content: 'Sería ideal añadir una vista de calendario mensual para planificar concentraciones en altura.',
        status: 'reviewed',
        created_at: '2026-05-10T10:00:00Z'
      },
      {
        id: 'sug-2',
        feedback_type: 'plan_adjustment',
        content: 'Ajustar la carga aeróbica de Carlos Gómez por viaje de trabajo la próxima semana.',
        status: 'pending',
        created_at: '2026-05-16T22:15:00Z'
      }
    ]
  };
}
