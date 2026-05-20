import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Rango de la semana actual (Lunes a Domingo)
  const now = new Date();
  const currentDay = now.getDay() || 7;
  const monday = new Date(now);
  monday.setDate(monday.getDate() - currentDay + 1);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const mondayStr = monday.toISOString().split('T')[0];
  const sundayStr = sunday.toISOString().split('T')[0];

  const { data: workouts, error } = await supabase
    .from('user_workouts')
    .select('*, training_sessions(*)')
    .eq('user_id', user.id)
    .gte('scheduled_date', mondayStr)
    .lte('scheduled_date', sundayStr)
    .order('scheduled_date', { ascending: true });

  if (error || !workouts) {
    console.error('Error al exportar calendario:', error);
    return NextResponse.json({ error: 'No se encontraron entrenamientos' }, { status: 404 });
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Triatlon Pro//Training Calendar//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Plan Triatlón Pro',
    'X-WR-TIMEZONE:Europe/Madrid'
  ];

  for (const w of workouts) {
    if (!w.training_sessions || w.training_sessions.sport_type === 'descanso') continue;

    const dateStr = w.scheduled_date.replace(/-/g, ''); // YYYYMMDD
    const start = `${dateStr}T080000`; // 8:00 AM
    const end = `${dateStr}T090000`; // 9:00 AM
    const sport = w.training_sessions.sport_type.toUpperCase();
    const duration = w.training_sessions.duration_min ? `${w.training_sessions.duration_min} min` : 'volumen libre';
    const title = `${sport} (${duration}) • Triatlón Pro`;
    const desc = w.training_sessions.description || 'Sesión de entrenamiento estructurada.';

    icsContent.push('BEGIN:VEVENT');
    icsContent.push(`UID:workout-${w.id}@triatlon-pro`);
    icsContent.push(`DTSTART;VALUE=DATE:${dateStr}`); // Todo el día para mejor visualización
    icsContent.push(`SUMMARY:${title}`);
    icsContent.push(`DESCRIPTION:${desc.replace(/\n/g, '\\n')}`);
    icsContent.push('END:VEVENT');
  }

  icsContent.push('END:VCALENDAR');

  return new NextResponse(icsContent.join('\r\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="calendario_semanal.ics"',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
