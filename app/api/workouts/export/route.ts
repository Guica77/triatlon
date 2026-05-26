import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parsePaceToSeconds, adaptWorkoutDescription } from '@/lib/zones-utility';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const workoutId = searchParams.get('workoutId');

  if (!workoutId) {
    return NextResponse.json({ error: 'Falta workoutId' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: workout, error } = await supabase.from('user_workouts')
    .select(`
      id,
      user_id,
      scheduled_date,
      training_sessions (
        sport_type,
        duration_min,
        description,
        day_name
      )
    `)
    .eq('id', workoutId)
    .single();

  if (error || !workout?.training_sessions) {
    return NextResponse.json({ error: 'Entrenamiento no encontrado' }, { status: 404 });
  }

  const session = workout.training_sessions;
  const sport = session.sport_type; // ciclismo, carrera, natacion
  const duration = session.duration_min || 60;
  const desc = session.description || 'Sesión estructurada Triatlón Pro';

  // Obtener perfil para personalizar el TCX
  const { data: profile } = await supabase.from('profiles')
    .select('current_ftp, current_swim_pace, current_run_pace, level')
    .eq('id', workout.user_id)
    .single();

  const isInterval = desc.toLowerCase().includes('series') || desc.toLowerCase().includes('x') || desc.toLowerCase().includes('z4');
  const level = profile?.level || 'intermedio';

  // Adaptar descripción para las notas del TCX
  const adaptedNotes = adaptWorkoutDescription(desc, sport, profile);

  // Calcular zonas de pulso adaptadas heurísticamente según nivel
  let warmupLow = 110, warmupHigh = 130;
  let mainLow = 120, mainHigh = 140;
  let coolLow = 100, coolHigh = 120;

  if (level === 'avanzado') {
    warmupLow = 115; warmupHigh = 135;
    mainLow = isInterval ? 155 : 130;
    mainHigh = isInterval ? 178 : 150;
    coolLow = 110; coolHigh = 128;
  } else if (level === 'principiante') {
    warmupLow = 105; warmupHigh = 125;
    mainLow = isInterval ? 140 : 115;
    mainHigh = isInterval ? 160 : 135;
    coolLow = 95; coolHigh = 115;
  } else {
    // Intermedio
    warmupLow = 110; warmupHigh = 130;
    mainLow = isInterval ? 148 : 122;
    mainHigh = isInterval ? 170 : 143;
    coolLow = 100; coolHigh = 122;
  }

  // Generamos un archivo TCX (Training Center XML) estructurado universal para Garmin Connect y Coros.
  const tcxContent = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">
  <Workouts>
    <Workout Sport="${sport === 'ciclismo' ? 'Biking' : sport === 'carrera' ? 'Running' : sport === 'natacion' ? 'Swimming' : 'Other'}">
      <Name>${sport.toUpperCase()} • ${session.day_name}</Name>
      <Notes>${adaptedNotes}</Notes>
      <Step xsi:type="Step_t">
        <StepId>1</StepId>
        <Name>Calentamiento</Name>
        <Duration xsi:type="Time_t">
          <Seconds>600</Seconds>
        </Duration>
        <Intensity>Active</Intensity>
        <Target xsi:type="HeartRate_t">
          <HeartRateZone xsi:type="CustomHeartRateZone_t">
            <Low>${warmupLow}</Low>
            <High>${warmupHigh}</High>
          </HeartRateZone>
        </Target>
      </Step>
      <Step xsi:type="Step_t">
        <StepId>2</StepId>
        <Name>Bloque Principal • Series</Name>
        <Duration xsi:type="Time_t">
          <Seconds>${Math.max((duration - 20) * 60, 1200)}</Seconds>
        </Duration>
        <Intensity>Active</Intensity>
        <Target xsi:type="HeartRate_t">
          <HeartRateZone xsi:type="CustomHeartRateZone_t">
            <Low>${mainLow}</Low>
            <High>${mainHigh}</High>
          </HeartRateZone>
        </Target>
      </Step>
      <Step xsi:type="Step_t">
        <StepId>3</StepId>
        <Name>Enfriamiento</Name>
        <Duration xsi:type="Time_t">
          <Seconds>600</Seconds>
        </Duration>
        <Intensity>Rest</Intensity>
        <Target xsi:type="HeartRate_t">
          <HeartRateZone xsi:type="CustomHeartRateZone_t">
            <Low>${coolLow}</Low>
            <High>${coolHigh}</High>
          </HeartRateZone>
        </Target>
      </Step>
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`;

  const filename = `triatlon_pro_${sport}_${workout.scheduled_date}.tcx`;

  return new NextResponse(tcxContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.garmin.tcx+xml',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
