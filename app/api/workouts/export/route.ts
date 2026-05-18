import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  // Generamos un archivo TCX (Training Center XML) estructurado universal para Garmin Connect y Coros.
  // El formato TCX es el estándar oficial de Garmin totalmente compatible con la importación directa en relojes.
  const tcxContent = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">
  <Workouts>
    <Workout Sport="${sport === 'ciclismo' ? 'Biking' : sport === 'carrera' ? 'Running' : sport === 'natacion' ? 'Swimming' : 'Other'}">
      <Name>${sport.toUpperCase()} • ${session.day_name}</Name>
      <Notes>${desc}</Notes>
      <Step xsi:type="Step_t">
        <StepId>1</StepId>
        <Name>Calentamiento</Name>
        <Duration xsi:type="Time_t">
          <Seconds>600</Seconds>
        </Duration>
        <Intensity>Active</Intensity>
        <Target xsi:type="HeartRate_t">
          <HeartRateZone xsi:type="CustomHeartRateZone_t">
            <Low>110</Low>
            <High>135</High>
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
            <Low>145</Low>
            <High>175</High>
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
            <Low>100</Low>
            <High>125</High>
          </HeartRateZone>
        </Target>
      </Step>
    </Workout>
  </Workouts>
</TrainingCenterDatabase>`;

  // Configuramos las cabeceras para forzar la descarga y apertura automática en Garmin Connect / Coros
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
