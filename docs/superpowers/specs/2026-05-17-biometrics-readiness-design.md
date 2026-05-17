# Documento de Especificación de Diseño: Biometría y Preparación (Estilo Oura/Whoop)

**Fecha:** 2026-05-17  
**Módulo:** Módulo 1 - Seguimiento Biométrico y Readiness Score  
**Estado:** Aprobado por el Usuario (con mejoras de métricas subjetivas y UX explicativa)  

---

## 1. Visión General y Objetivos
El objetivo de este módulo es dotar a la plataforma de triatlón "Minimal Luxury" de un motor de seguimiento biométrico avanzado al estilo de Oura Ring y Whoop. Permitirá a los atletas monitorizar su fatiga, calidad de sueño, estrés y preparación diaria (Readiness Score) para tomar decisiones informadas sobre la intensidad de sus entrenamientos.

Se implementa una **Arquitectura Híbrida Premium**: el sistema genera datos de sincronización simulados de forma automática para asegurar que el dashboard siempre esté vivo y funcional, al mismo tiempo que ofrece un control total para que el usuario (o futuras integraciones de relojes inteligentes) edite y ajuste manualmente cualquier valor.

---

## 2. Arquitectura de Base de Datos (Supabase)

### 2.1 Nueva Tabla: `user_biometrics`
Almacenará las métricas biométricas diarias objetivas y subjetivas de los usuarios.

| Columna | Tipo | Restricciones / Detalles |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key, `gen_random_uuid()` |
| `user_id` | UUID | Foreign Key a `auth.users`, Not Null, On Delete Cascade |
| `date` | Date | Not Null, Unique(user_id, date) |
| `hrv` | Integer | Variabilidad de frecuencia cardíaca en milisegundos (ej. 68) |
| `rhr` | Integer | Frecuencia cardíaca en reposo en bpm (ej. 48) |
| `sleep_hours` | Numeric(4,1) | Horas totales de sueño (ej. 7.8) |
| `sleep_score` | Integer | Puntuación de calidad del sueño (0-100) |
| `weight` | Numeric(5,1) | Peso corporal en kg (ej. 72.5) |
| `fatigue_rating`| Integer | Nivel de fatiga/dolor muscular percibido (1 a 5) |
| `stress_level` | Integer | Nivel de estrés/carga mental percibido (1 a 5) |
| `readiness_score` | Integer | Puntuación global calculada de preparación (0-100) |
| `created_at` | Timestamp | `now()` |

### 2.2 Ampliación de la Tabla `profiles`
Se añaden columnas para almacenar las métricas clave de rendimiento del atleta:
- `ftp`: Integer (Functional Threshold Power en vatios para ciclismo, ej. 250).
- `swim_pace`: Text (Ritmo umbral de natación por 100m, ej. "1:45").
- `run_pace`: Text (Ritmo umbral de carrera por km, ej. "4:30").

---

## 3. Lógica Backend y Server Actions (`app/dashboard/biometrics-actions.ts`)

Las siguientes Server Actions gestionarán la persistencia y el motor de cálculo:

### 3.1 `getDailyBiometrics()`
- **Propósito**: Obtener la biometría del usuario para la fecha actual.
- **Flujo**:
  1. Consulta `user_biometrics` para el `user.id` actual y la fecha de hoy.
  2. Si existe el registro, lo devuelve.
  3. Si no existe, invoca el generador de simulación automática para crear un registro inicial con valores realistas basados en el perfil del atleta (ej. HRV 65, RHR 50, Sueño 7.5h, Fatiga 2, Estrés 2, calculando el Readiness Score correspondiente) y lo inserta en la base de datos.

### 3.2 `calculateReadiness(hrv, rhr, sleepHours, fatigueRating, stressLevel)`
- **Propósito**: Calcular la puntuación global de preparación (0-100).
- **Algoritmo Ponderado Holístico**:
  - **Sueño (35%)**: Se evalúa respecto a una meta de 8.0 horas.
  - **HRV (25%)**: Se evalúa respecto a una media base de 65 ms.
  - **RHR (20%)**: Se evalúa respecto a una media base de 52 bpm.
  - **Fatiga Muscular (10%)**: Escala inversa (Fatiga 1 aporta máximo puntaje, Fatiga 5 resta).
  - **Nivel de Estrés (10%)**: Escala inversa (Estrés 1 aporta máximo puntaje, Estrés 5 resta).
- **Salida**: Un entero entre 0 y 100, junto con las etiquetas de estado y recomendaciones para cada factor.

### 3.3 `updateBiometrics(data)`
- **Propósito**: Recibir actualizaciones manuales desde el modal del frontend.
- **Flujo**:
  1. Recibe los nuevos valores de `hrv`, `rhr`, `sleep_hours`, `weight`, `fatigue_rating` y `stress_level`.
  2. Recalcula inmediatamente el `readiness_score` utilizando `calculateReadiness`.
  3. Realiza un `upsert` en `user_biometrics` para la fecha actual.
  4. Ejecuta `revalidatePath('/dashboard')` para actualizar la interfaz instantáneamente.

---

## 4. Componentes de Frontend

### 4.1 `BiometricsCard` (`components/dashboard/biometrics-card.tsx`)
- **Ubicación**: Dashboard principal (`/dashboard`), en la parte superior junto al resumen de sesiones.
- **Diseño Visual (Estilo Whoop/Oura Premium)**:
  - Contenedor con fondo oscuro `zinc-900/950`, bordes sutiles y estética "Minimal Luxury".
  - **Cabecera**: Título "Biometría y Preparación" y botón "Ajustar Valores ⚙️".
  - **Sección Principal**: Anillo circular de progreso con el `Readiness Score` (ej. 88/100) en color verde/amarillo/rojo según el estado, acompañado de un texto descriptivo del estado físico.
  - **Grid de Desglose**: Tarjetas internas mostrando los factores individuales combinados (Sueño, HRV, RHR y un indicador de Carga/Fatiga).

### 4.2 `BiometricsModal` (`components/dashboard/biometrics-modal.tsx`) con Asistencia UX
- **Propósito**: Interfaz elegante para la edición manual de métricas con ayuda contextual para el atleta.
- **Asistencia Visual y Explicativa (Ayuda al Atleta)**:
  - **Fatiga Muscular (1 a 5)**: Selector interactivo con descripción dinámica:
    - *Nivel 1*: Piernas frescas, ligeras y sin dolor.
    - *Nivel 2*: Ligera molestia normal post-entrenamiento.
    - *Nivel 3*: Fatiga moderada, pesadez notable.
    - *Nivel 4*: Dolor muscular agudo (DOMS), piernas muy pesadas.
    - *Nivel 5*: Agotamiento extremo, dolor limitante al caminar.
  - **Nivel de Estrés Mental (1 a 5)**: Selector interactivo con descripción dinámica:
    - *Nivel 1*: Calma total, mente despejada y relajada.
    - *Nivel 2*: Día normal, bajo control.
    - *Nivel 3*: Estrés moderado, día ajetreado en trabajo/familia.
    - *Nivel 4*: Sobrecarga mental alta, sensación de agobio.
    - *Nivel 5*: Estrés máximo, agotamiento psicológico severo.
  - **HRV y RHR**: Tooltips informativos explicando que una mayor HRV indica buena recuperación del sistema nervioso, y un menor RHR indica menor fatiga cardiovascular.
- **Comportamiento**: Al enviar, llama a la Server Action `updateBiometrics`, cierra el modal y muestra un estado de carga optimista.

---

## 5. Manejo de Errores y Casos Límite

1. **Usuario sin sesión autenticada**: Las Server Actions redirigirán automáticamente a `/login`.
2. **Fallos de conexión con Supabase**: Se capturará el error en el bloque `try/catch`, devolviendo un objeto `{ error: string }` y mostrando un toast/alerta de error en el frontend sin romper el dashboard.
3. **Valores de entrada inválidos**: El modal aplicará validación de cliente (ej. `sleep_hours` entre 0 y 24, `rhr` entre 30 y 200) y el backend validará los tipos antes de insertar.

---

## 6. Estrategia de Pruebas

1. **Prueba de Generación Inicial**: Verificar que un usuario nuevo al entrar al dashboard reciba automáticamente datos biométricos simulados sin errores.
2. **Prueba de Asistencia UX**: Abrir el modal, interactuar con los selectores de Fatiga y Estrés, y comprobar que las explicaciones dinámicas cambian correctamente.
3. **Prueba de Recálculo Holístico**: Cambiar el nivel de fatiga a 5 y estrés a 5, guardar y verificar que el Readiness Score baje de forma acorde en el anillo principal.
4. **Prueba de Persistencia**: Recargar la página y comprobar que los valores modificados manualmente se mantienen intactos en la base de datos.
