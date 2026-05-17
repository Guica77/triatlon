# Especificación de Diseño: Exportación y Push Automático de Workouts a Relojes

## 1. Visión General y Experiencia de Usuario (OAuth & Cloud Push)
El objetivo de este subsistema es eliminar por completo la fricción en la ejecución del entrenamiento diario. En lugar de memorizar series o transferir archivos manualmente, la plataforma transmite la estructura planificada directamente al ecosistema del reloj (Garmin Connect, Strava, Apple Watch, Coros, Suunto, Wahoo).

### 🔄 ¿Cómo funciona la conexión automática?
1. **El Handshake Inicial (Una sola vez en la vida)**: Durante el onboarding o en la sección de ajustes, el atleta hace clic en el botón *"Conectar con Garmin / Strava"*. Se abre la ventana segura de OAuth 2.0 del fabricante donde el usuario inicia sesión y autoriza a nuestra plataforma a enviar entrenamientos.
2. **Sincronización Silenciosa y Perpetua**: A partir de ese segundo, el proceso es **100% automático y en segundo plano**. Cada vez que se genera un plan o nuestra IA recalibra una sesión por fatiga, los servidores envían el nuevo calendario a la nube de Garmin.
3. **Ejecución Mágica**: Cuando el atleta se levanta por la mañana y enciende su reloj (o abre la app de su dispositivo), el entrenamiento estructurado del día aparece de inmediato en la pantalla principal listo para ejecutar.

---

## 2. Arquitectura de Sincronización y Modelo de Datos

### 2.1 Almacenamiento de Credenciales (`user_connected_devices`)
Para mantener la conexión perpetua sin pedir login de nuevo, almacenamos los tokens de forma segura:

```sql
CREATE TABLE IF NOT EXISTS user_connected_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('garmin', 'strava', 'apple_health', 'coros', 'suunto', 'wahoo')),
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

ALTER TABLE user_connected_devices ENABLE ROW LEVEL SECURITY;
```

### 2.2 Registro y Cola de Sincronización (`workout_sync_logs`)
Para garantizar la resiliencia y trazabilidad de cada envío:

```sql
CREATE TABLE IF NOT EXISTS workout_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES user_workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_workout_id TEXT, -- ID devuelto por Garmin Connect al crearlo exitosamente
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  attempt_count INTEGER DEFAULT 1,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT external_workout_id
);

ALTER TABLE workout_sync_logs ENABLE ROW LEVEL SECURITY;
```

---

## 3. Estructura del Payload Estructurado (Workout Steps)

Para que el reloj guíe al atleta con pitidos y pantallas de objetivo, transformamos nuestras descripciones relacionales a un árbol de pasos estructurados (`WorkoutSteps`):

```json
{
  "workoutName": "Series de Umbral Z4 - Ciclismo",
  "sport": "CYCLED",
  "description": "5x 3 min en Z4 con 1.5 min recuperación",
  "workoutSegments": [
    {
      "segmentOrder": 1,
      "sport": "CYCLED",
      "workoutSteps": [
        {
          "type": "Warmup",
          "stepOrder": 1,
          "endCondition": "LAP_BUTTON",
          "targetType": "HEART_RATE",
          "targetValueOne": 110,
          "targetValueTwo": 130
        },
        {
          "type": "Repeat",
          "stepOrder": 2,
          "repeatCount": 5,
          "workoutSteps": [
            {
              "type": "Interval",
              "stepOrder": 1,
              "endCondition": "TIME",
              "endConditionValue": 180,
              "targetType": "POWER",
              "targetValueOne": 230,
              "targetValueTwo": 250
            },
            {
              "type": "Rest",
              "stepOrder": 2,
              "endCondition": "TIME",
              "endConditionValue": 90,
              "targetType": "POWER",
              "targetValueOne": 100,
              "targetValueTwo": 130
            }
          ]
        },
        {
          "type": "Cooldown",
          "stepOrder": 3,
          "endCondition": "TIME",
          "endConditionValue": 600,
          "targetType": "OPEN"
        }
      ]
    }
  ]
}
```

---

## 4. Estrategia de Resiliencia y Backoff Exponencial

Si los servidores de Garmin o Strava se encuentran bajo mantenimiento o devuelven un error de límite de peticiones (`HTTP 429` / `HTTP 503`), el sistema implementa una política de reintento automático:

1. **Intento 1 (Inmediato)**: Al crearse/modificarse el workout.
2. **Intento 2 (+1 minuto)**: Si falla el primero.
3. **Intento 3 (+5 minutos)**: Si persiste el fallo.
4. **Intento 4 (+15 minutos)**: Último intento automatizado.
5. **Notificación al Atleta**: Si falla el cuarto intento, se marca como `failed` y se muestra un aviso en el Dashboard con un botón de *"Reintentar Sincronización Manual"*.

---

## 5. Criterios de Aceptación y Seguridad
* **Seguridad RLS**: Los atletas solo pueden acceder a sus propias credenciales y logs de sincronización. Los entrenadores no tienen acceso directo a los tokens OAuth de sus py-atletas.
* **Refresco de Tokens**: El sistema verifica proactivamente `expires_at`. Si el token ha caducado, ejecuta una petición al endpoint `/oauth/token` con el `refresh_token` antes de intentar el envío del workout.
* **Desacoplamiento**: El fallo en la sincronización externa no bloquea la navegación ni el uso de la aplicación web local.
