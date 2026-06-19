# Especificación Técnica: Cuestionario de Feedback Adaptativo para Entrenamientos y Conexión con IA y Entrenador

Este documento detalla el diseño técnico para la recolección de feedback subjetivo de los atletas tras completar entrenamientos (sincronizados de Strava/Garmin o marcados manualmente), y cómo estos datos activan reajustes automáticos de la carga por IA y alertas en tiempo real al chat del entrenador.

## 1. Objetivos del Sistema
- **Recolección Completa de Feedback**: RPE (1-10), Feeling (caritas), Adherencia a la Intensidad, Presencia de Dolor Localizado y Comentarios Libres.
- **Automatización Adaptativa de IA**: Reducir preventivamente la carga de las próximas 2 sesiones si el atleta reporta cansancio extremo, dolor localizado o un esfuerzo muy desproporcionado.
- **Canalización Entrenador**: Enviar una alerta automatizada en el chat interno al entrenador cuando su atleta registre métricas preocupantes de sobreentrenamiento o lesión.
- **Notificaciones al Atleta Sin Entrenador**: Proporcionar información en el dashboard de que el plan ha sido adaptado preventivamente para optimizar su recuperación.
- **UX/UI Premium**: Modal emergente tras sincronizaciones de Strava en vivo, banner de alerta persistente en el dashboard si hay feedbacks pendientes y una interfaz sumamente cuidada e interactiva (TrainingPeaks style).

## 2. Cambios de Arquitectura y Archivos

### 2.1 Base de Datos (Migración SQL)
- **[NEW] [20260619000000_add_feedback_extended_columns.sql](file:///Users/guillermohaya/Desktop/triatlon/triatlon-app/supabase/migrations/20260619000000_add_feedback_extended_columns.sql)**:
  - Añadir columnas `pain_localized` (boolean) e `intensity_adherence` (text) a la tabla `workout_feedback`.
  - Crear o actualizar la restricción check para `feeling` asegurando que permita `'excelente', 'buena', 'fatigado', 'lesionado'`.

### 2.2 Server Actions de Feedback y Dashboard
- **[MODIFY] [feedback-actions.ts](file:///Users/guillermohaya/Desktop/triatlon/triatlon-app/app/(app)/feedback/feedback-actions.ts)**:
  - Actualizar la interfaz `WorkoutFeedbackData` para soportar `pain_localized` (boolean) e `intensity_adherence` (string).
  - Modificar `submitWorkoutFeedback` para persistir estas nuevas columnas.
- **[MODIFY] [actions.ts](file:///Users/guillermohaya/Desktop/triatlon/triatlon-app/app/(app)/dashboard/actions.ts)**:
  - Modificar `completeWorkoutWithFeedback` para que acepte todos los nuevos campos y los inserte en `workout_feedback`.
  - Integrar la llamada al motor de ajuste adaptativo tras persistir el feedback.

### 2.3 Motor de Adaptación de IA y Alertas
- **[MODIFY] [telemetry-actions.ts](file:///Users/guillermohaya/Desktop/triatlon/triatlon-app/app/telemetry/telemetry-actions.ts)**:
  - Implementar una función `evaluateFeedbackAndAdaptPlan(userId, workoutId, feedback)`:
    - Analiza si `rpe >= 8`, `feeling IN ('fatigado', 'lesionado')` o `pain_localized === true`.
    - Si se cumple alguno de estos gatillos de fatiga/lesión:
      1. Obtiene los próximos 2 entrenamientos pendientes del atleta.
      2. Reduce su duración en un 30% y modifica sus descripciones agregando un aviso de "Ajuste preventivo por fatiga por la IA".
      3. Actualiza el estado a `auto_adjusted: true`.
      4. Si el perfil del usuario tiene un `coach_id`, genera una entrada en la tabla `chat_messages` enviando una alerta al chat del entrenador (ej. `"⚠️ Alerta de Fatiga: [Nombre] completó el entrenamiento con RPE [X] y reporta dolor en la rodilla. La IA ha suavizado sus próximas sesiones."`).

### 2.4 Componente de Detalle del Workout y Modal de Feedback
- **[MODIFY] [workout-detail-client.tsx](file:///Users/guillermohaya/Desktop/triatlon/triatlon-app/app/(app)/dashboard/workout/[id]/workout-detail-client.tsx)**:
  - Implementar un formulario interactivo y animado para capturar el feedback.
  - El formulario se mostrará cuando el estado de la sesión sea `completed` pero no se haya registrado feedback aún.
  - Diseño:
    - Deslizador de RPE (1 al 10) con colores que cambian de verde a rojo vivo.
    - Botones de caritas animadas para el Feeling (Excelente, Bueno, Fatigado, Lesionado).
    - Botones para adherencia de intensidad (Más suave, Clavado, Más duro).
    - Switch/Toggle moderno para "¿Sientes dolor localizado?".
    - Textarea auto-expandible para comentarios libres.
    - Animaciones de carga y éxito con Framer Motion.

### 2.5 Banner Recordatorio en Dashboard e Ingesta Strava
- **[MODIFY] [daily-workout-card.tsx](file:///Users/guillermohaya/Desktop/triatlon/triatlon-app/components/dashboard/daily-workout-card.tsx)**:
  - Cuando se detecte una sincronización automática exitosa desde Strava/Garmin, en lugar de solo cambiar el estado y mostrar un toast, abrirá automáticamente un modal emergente conteniendo el formulario de feedback rápido para asegurar que el atleta lo llene en caliente.

---

## 3. Plan de Verificación

### 3.1 Base de Datos y Tipos
- Comprobar que la migración SQL se ejecuta de manera exitosa en Supabase y que las nuevas columnas aceptan valores correctos.
- Ejecutar verificación de tipos TypeScript (`npx tsc --noEmit`) para asegurar coherencia.

### 3.2 Flujo del Atleta y UI
- Marcar un entrenamiento como completado y verificar que aparece el formulario de feedback extendido.
- Rellenar el formulario con datos de fatiga alta (ej. RPE = 9, sensación = fatigado, dolor localizado = true) y enviarlo.
- Validar que los datos se guardan en la tabla `workout_feedback`.
- Comprobar que los próximos dos entrenamientos pendientes del usuario han sido modificados (duración reducida un 30% y flag de `auto_adjusted` activado).

### 3.3 Flujo del Entrenador (Alertas)
- Con un usuario que tiene entrenador asignado, rellenar el feedback con alerta de fatiga.
- Acceder al panel de chat del entrenador y validar que se ha enviado un mensaje automático detallando el estado de fatiga y la acción tomada por la IA.
