# Especificación Técnica: Ingesta de Telemetría Universal ("Garmin y Todos") y Recálculo Dinámico

## 1. Visión General y Objetivos
El objetivo de este módulo es dotar a la plataforma de capacidad de ingesta omni-ecosistema (Garmin Connect, Strava, Apple Health, Polar, Suunto, Coros y Wahoo). El sistema extrae la totalidad de las métricas registradas por el reloj o dispositivo (minutos reales, distancia, zonas cardíacas, potencia, cadencia y desnivel) para cruzarla con el plan de entrenamiento y el feedback subjetivo (RPE). Si se detecta una desviación significativa entre la carga real y la planificada, el motor ejecuta un recálculo dinámico y autónomo para proteger al atleta del sobreentrenamiento o infratiempo.

---

## 2. Arquitectura de Base de Datos (Supabase Postgres)

Se creará una migración SQL (`supabase/migrations/20260517000004_universal_telemetry.sql`) para instanciar la tabla de normalización y sus políticas de seguridad RLS.

### 2.1 Esquema de Tablas (Extracción Total del Reloj y Strava)
```sql
CREATE TABLE IF NOT EXISTS universal_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES user_workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_provider TEXT NOT NULL CHECK (source_provider IN ('garmin', 'strava', 'apple_health', 'polar', 'suunto', 'coros', 'wahoo')),
  external_activity_id TEXT NOT NULL,
  
  -- Métricas de Tiempo y Distancia ("Minutos corridos")
  actual_duration_min NUMERIC NOT NULL,
  moving_time_min NUMERIC,
  actual_distance_km NUMERIC NOT NULL,
  elevation_gain_m NUMERIC DEFAULT 0,

  -- Métricas Fisiológicas y Biomecánicas
  actual_tss NUMERIC NOT NULL,
  avg_hr NUMERIC,
  max_hr NUMERIC,
  hr_zones_summary JSONB, -- Tiempo en segundos pasado en Z1, Z2, Z3, Z4, Z5
  avg_power NUMERIC,
  normalized_power NUMERIC,
  avg_cadence NUMERIC, -- SPM (zancadas) o RPM (pedaleo)
  training_effect_aerobic NUMERIC,
  training_effect_anaerobic NUMERIC,

  raw_payload JSONB NOT NULL, -- Respaldo del archivo FIT/JSON original completo
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_external_activity UNIQUE (source_provider, external_activity_id)
);

-- Añadir flag de ajuste automático a user_workouts
ALTER TABLE user_workouts ADD COLUMN IF NOT EXISTS auto_adjusted BOOLEAN DEFAULT false;
ALTER TABLE user_workouts ADD COLUMN IF NOT EXISTS actual_tss NUMERIC;
```

### 2.2 Políticas de Seguridad (RLS)
```sql
ALTER TABLE universal_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Atletas leen su propia telemetría" ON universal_telemetry
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Entrenadores leen telemetría de sus atletas" ON universal_telemetry
FOR SELECT USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = universal_telemetry.user_id AND coach_id = auth.uid()
));

-- La inserción la realiza el backend/webhooks con rol de servicio (Service Role)
```

---

## 3. Lógica Backend y Server Actions (`app/telemetry/telemetry-actions.ts`)

```typescript
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export interface TelemetryPayload {
  workout_id: string;
  user_id: string;
  source_provider: string;
  external_activity_id: string;
  actual_duration_min: number;
  moving_time_min?: number;
  actual_distance_km: number;
  elevation_gain_m?: number;
  actual_tss: number;
  avg_hr?: number;
  max_hr?: number;
  hr_zones_summary?: Record<string, number>;
  avg_power?: number;
  normalized_power?: number;
  avg_cadence?: number;
  training_effect_aerobic?: number;
  training_effect_anaerobic?: number;
  raw_payload: any;
}

export async function ingestActivityTelemetry(payload: TelemetryPayload) {
  const supabase = await createClient(); // En producción usaría Service Role Key para webhooks
  
  // 1. Insertar en la tabla de telemetría universal
  const { error: insertError } = await supabase.from('universal_telemetry').insert(payload);
  if (insertError) return { error: insertError.message };

  // 2. Actualizar el workout correspondiente marcándolo como completado y asignando el TSS real
  await supabase.from('user_workouts').update({
    status: 'completed',
    completed_at: new Date().toISOString(),
    actual_tss: payload.actual_tss
  }).eq('id', payload.workout_id);

  // 3. Evaluar cumplimiento y disparar recálculo dinámico si es necesario
  await evaluateAndAdjustTrainingPlan(payload.user_id, payload.workout_id, payload.actual_tss);

  revalidatePath('/dashboard');
  revalidatePath('/analytics');
  revalidatePath('/coach-portal');
  return { success: true };
}

async function evaluateAndAdjustTrainingPlan(userId: string, workoutId: string, actualTss: number) {
  const supabase = await createClient();
  
  // Obtener el TSS planificado
  const { data: workout } = await supabase.from('user_workouts')
    .select('training_sessions(duration_min, description)')
    .eq('id', workoutId)
    .single();

  if (!workout?.training_sessions) return;
  const plannedDuration = workout.training_sessions.duration_min;
  // Estimación rápida de TSS planificado (Z2 base IF 0.75)
  const plannedTss = (plannedDuration / 60) * Math.pow(0.75, 2) * 100;
  
  const deltaTss = actualTss - plannedTss;
  const percentageDiff = (deltaTss / plannedTss) * 100;

  // Si la desviación supera el ±15%, ajustamos los próximos 2 días
  if (Math.abs(percentageDiff) > 15) {
    const { data: upcomingWorkouts } = await supabase.from('user_workouts')
      .select('id, training_sessions(duration_min, description)')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('scheduled_date', { ascending: true })
      .limit(2);

    if (upcomingWorkouts && upcomingWorkouts.length > 0) {
      for (const nextWorkout of upcomingWorkouts) {
        // Lógica de compensación: si hizo de más, reducimos IF/duración; si hizo de menos, aumentamos
        await supabase.from('user_workouts').update({
          auto_adjusted: true,
          // Nota en BD para el entrenador
        }).eq('id', nextWorkout.id);
      }
    }
  }
}
```

---

## 4. Diseño de Interfaz y Experiencia de Usuario (UI/UX Pro Max)

### 4.1 Módulo del Atleta: Notificación Proactiva y Modal de Feedback
*   **Cruce de Datos**: Al abrir el `WorkoutFeedbackModal`, el atleta ve el resumen exacto extraído de su reloj/Strava (ej. *"Garmin registró 12.4 km en 1h 05m con 142 bpm medios"*).
*   **Aviso de Recálculo**: Notificación flotante (Toast) informando de adaptaciones automáticas en el calendario.

### 4.2 Portal del Entrenador: `/coach-portal`
*   **Bento Grid de Telemetría**: El profesional visualiza la comparativa directa entre el Plan, el Reloj (Telemetría) y la Mente del atleta (RPE).
*   **Sugerencias de Mejora a la Plataforma**: Botón directo para adjuntar reportes de discrepancia al equipo de desarrollo.

---

## 5. Estrategia de Verificación y Pruebas
1.  **Validación de TypeScript**: Comprobación de tipos con `npx tsc --noEmit`.
2.  **Pruebas de Ingesta**: Simulación de envíos de webhooks de Garmin y Strava para verificar la correcta normalización en `universal_telemetry`.
3.  **Pruebas de Recálculo**: Verificación de que un TSS real un 30% superior al planificado activa correctamente el flag `auto_adjusted` en las sesiones futuras.
