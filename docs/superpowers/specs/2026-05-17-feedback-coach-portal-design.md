# Especificación Técnica: Portal de Entrenadores y Recogida de Feedback Integrado

## 1. Visión General y Objetivos
El objetivo de este módulo es establecer un canal bidireccional de comunicación y supervisión entre los atletas y los entrenadores profesionales. Permite capturar la percepción subjetiva del esfuerzo (RPE) y sensaciones del atleta tras cada entrenamiento, al mismo tiempo que dota a los entrenadores de un portal dedicado (`/coach-portal`) para monitorear cargas biométricas, ajustar planes y proponer mejoras a la plataforma.

---

## 2. Arquitectura de Base de Datos (Supabase Postgres)

Se creará una nueva migración SQL (`supabase/migrations/20260517000003_feedback_schema.sql`) para instanciar las tablas y políticas de seguridad RLS.

### 2.1 Esquema de Tablas
```sql
-- Tabla para el feedback diario del atleta tras cada sesión
CREATE TABLE IF NOT EXISTS workout_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES user_workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rpe_score INTEGER NOT NULL CHECK (rpe_score >= 1 AND rpe_score <= 10),
  feeling TEXT NOT NULL CHECK (feeling IN ('excelente', 'buena', 'fatigado', 'lesionado')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla para sugerencias y evaluaciones de entrenadores profesionales
CREATE TABLE IF NOT EXISTS coach_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('platform_improvement', 'plan_adjustment', 'athlete_review')),
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'implemented')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Añadir relación opcional de coach_id en perfiles si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
```

### 2.2 Políticas de Seguridad (RLS)
```sql
ALTER TABLE workout_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_feedback ENABLE ROW LEVEL SECURITY;

-- Políticas para workout_feedback
CREATE POLICY "Atletas gestionan su propio feedback" ON workout_feedback
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Entrenadores leen feedback de sus atletas" ON workout_feedback
FOR SELECT USING (EXISTS (
  SELECT 1 FROM profiles WHERE id = workout_feedback.user_id AND coach_id = auth.uid()
));

-- Políticas para coach_feedback
CREATE POLICY "Entrenadores gestionan sus sugerencias" ON coach_feedback
FOR ALL USING (auth.uid() = coach_id);
```

---

## 3. Diseño de Interfaz y Experiencia de Usuario (UI/UX Pro Max)

### 3.1 Módulo del Atleta: `WorkoutFeedbackModal`
Ubicado en el Dashboard del atleta tras completar una sesión.
*   **Estética Visual (Glassmorphism)**: Modal flotante con fondo `bg-zinc-900/90 backdrop-blur-xl border border-zinc-800`.
*   **RPE Dinámico (1-10)**: Botones semánticos progresivos (Z1 Verde a Z4 Rojo Intenso) con tamaño mínimo de área táctil de `44x44px`.
*   **Selector de Sensaciones**: Cuatro opciones visuales (`😄 Excelente`, `🙂 Buena`, `⚠️ Fatigado`, `🛑 Lesionado`).

### 3.2 Portal del Entrenador: `/coach-portal` (Bento Grid)
Un panel de control de alta densidad informativa para la supervisión de múltiples atletas.
*   **Grid de Monitoreo**: Tabla con el TSB (Balance de Estrés de Entrenamiento), cumplimiento de TSS y alertas de RPE.
*   **Panel de Ajustes y Sugerencias**: Formulario estructurado para proponer cambios de plan o mejoras directas para la plataforma.

---

## 4. Lógica Backend y Server Actions (`app/feedback/feedback-actions.ts`)

```typescript
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitWorkoutFeedback(formData: {
  workout_id: string;
  rpe_score: number;
  feeling: string;
  notes?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const { error } = await supabase.from('workout_feedback').insert({
    workout_id: formData.workout_id,
    user_id: user.id,
    rpe_score: formData.rpe_score,
    feeling: formData.feeling,
    notes: formData.notes
  });

  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  return { success: true };
}

export async function submitCoachFeedback(formData: {
  athlete_id?: string;
  feedback_type: string;
  content: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const { error } = await supabase.from('coach_feedback').insert({
    coach_id: user.id,
    athlete_id: formData.athlete_id || null,
    feedback_type: formData.feedback_type,
    content: formData.content
  });

  if (error) return { error: error.message };
  revalidatePath('/coach-portal');
  return { success: true };
}
```

---

## 5. Estrategia de Verificación y Pruebas
1.  **Validación de TypeScript**: Ejecución de `npx tsc --noEmit` para verificar tipos y Server Actions.
2.  **Pruebas de RLS**: Comprobación de que un atleta no puede acceder ni modificar el feedback de otros atletas.
3.  **Pruebas de Interfaz**: Verificación de que el modal de feedback se abre correctamente al finalizar un workout y que el portal de entrenadores renderiza la tabla de atletas sin errores.
