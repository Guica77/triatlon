'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Export workout data to CSV format
 */
export async function exportWorkoutsCSV(): Promise<{ csv: string; filename: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autorizado')
  }

  const { data: workouts } = await supabase
    .from('user_workouts')
    .select(`
      scheduled_date,
      status,
      actual_tss,
      training_sessions(
        sport_type,
        duration_min,
        description,
        intensity_type
      )
    `)
    .eq('user_id', user.id)
    .order('scheduled_date', { ascending: false })

  if (!workouts || workouts.length === 0) {
    return { csv: '', filename: 'entrenamientos.csv' }
  }

  // Build CSV
  const headers = ['Fecha', 'Deporte', 'Duración (min)', 'Estado', 'TSS', 'Intensidad', 'Descripción']
  const rows = workouts.map(w => {
    const session = w.training_sessions as any
    return [
      w.scheduled_date,
      session?.sport_type || '',
      session?.duration_min || '',
      w.status || '',
      w.actual_tss || '',
      session?.intensity_type || '',
      (session?.description || '').replace(/,/g, ';').replace(/\n/g, ' '),
    ]
  })

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const filename = `entrenamientos_${new Date().toISOString().split('T')[0]}.csv`

  return { csv, filename }
}

/**
 * Generate ICS calendar from workouts
 */
export async function exportCalendarICS(): Promise<{ ics: string; filename: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autorizado')
  }

  const { data: workouts } = await supabase
    .from('user_workouts')
    .select(`
      scheduled_date,
      status,
      training_sessions(
        sport_type,
        duration_min,
        description
      )
    `)
    .eq('user_id', user.id)
    .order('scheduled_date', { ascending: true })

  if (!workouts || workouts.length === 0) {
    return { ics: '', filename: 'calendario.ics' }
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Triatlon Pro//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Triatlon Pro - Entrenamientos',
  ]

  workouts.forEach((w, i) => {
    const session = w.training_sessions as any
    const date = w.scheduled_date.replace(/-/g, '')
    const sportEmoji = session?.sport_type === 'natacion' ? '🏊' :
      session?.sport_type === 'ciclismo' ? '🚴' :
        session?.sport_type === 'carrera' ? '🏃' :
          session?.sport_type === 'brick' ? '⚡' :
            session?.sport_type === 'fuerza' ? '🏋️' : '📋'

    const sportName = session?.sport_type === 'natacion' ? 'Natación' :
      session?.sport_type === 'ciclismo' ? 'Ciclismo' :
        session?.sport_type === 'carrera' ? 'Carrera' :
          session?.sport_type === 'brick' ? 'Brick' :
            session?.sport_type === 'fuerza' ? 'Fuerza' :
              session?.sport_type === 'descanso' ? 'Descanso' : 'Entreno'

    const duration = session?.duration_min || 60
    const endHour = 7 + Math.floor(duration / 60)
    const endMin = duration % 60

    lines.push('BEGIN:VEVENT')
    lines.push(`DTSTART:${date}T070000`)
    lines.push(`DTEND:${date}T${String(endHour).padStart(2, '0')}${String(endMin).padStart(2, '0')}00`)
    lines.push(`SUMMARY:${sportEmoji} ${sportName} ${duration}min`)
    lines.push(`DESCRIPTION:${(session?.description || 'Sin descripción').replace(/\n/g, '\\n')}`)
    lines.push(`UID:tp-${w.scheduled_date}-${i}@triatlonpro.com`)
    lines.push('END:VEVENT')
  })

  lines.push('END:VCALENDAR')

  const ics = lines.join('\r\n')
  const filename = `triatlon_pro_${new Date().toISOString().split('T')[0]}.ics`

  return { ics, filename }
}