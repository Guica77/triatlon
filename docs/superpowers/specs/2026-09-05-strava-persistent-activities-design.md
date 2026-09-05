# Actividades persistentes de Strava

## Objetivo

Cuando un atleta publique una actividad en Strava, Triatlon Pro debe recibirla automáticamente, conservarla en Supabase y mostrarla con datos reales en el Dashboard, el entrenamiento diario, Análisis y Resumen. La actividad debe seguir disponible entre sesiones y no depender de consultar Strava cada vez que se abre una pantalla.

## Flujo de datos

1. Strava envía un evento `activity/create` a `/api/webhooks/telemetry`.
2. El receptor valida el evento, registra un trabajo pendiente y responde dentro del límite de Strava.
3. El procesador obtiene el detalle mediante el token OAuth renovable del atleta.
4. Normaliza el deporte, calcula métricas derivadas y busca una sesión planificada compatible para ese día.
5. Guarda o actualiza la actividad en `universal_telemetry` usando el identificador externo como clave idempotente.
6. Si coincide con el plan, enlaza la telemetría y completa la sesión total o parcialmente. Si sustituye una única sesión incompatible, conserva la actividad y marca la sesión según las reglas actuales. Si es adicional, la guarda como actividad extra sin `workout_id`.
7. Las pantallas leen el historial persistido desde Supabase. Una actualización explícita puede reconciliar las actividades recientes desde Strava sin inventar datos.

## Datos guardados

Además de los campos existentes, cada actividad conservará los datos disponibles y necesarios para presentarla sin una consulta posterior:

- identificador y proveedor;
- nombre, modalidad y fecha de inicio;
- duración en movimiento y duración total;
- distancia, ritmo o velocidad, potencia, frecuencia cardiaca, desnivel y TSS cuando estén disponibles;
- relación real con `user_workouts`, resultado de la clasificación y comentario de IA;
- polilínea resumida del recorrido cuando Strava la entregue;
- URL oficial `https://www.strava.com/activities/{id}`;
- estado y hora real de sincronización;
- carga original limitada a los datos necesarios para reprocesamiento y auditoría.

Las actividades sin GPS, como piscina o rodillo, se muestran correctamente sin mapa.

## Presentación

`Actividades recientes` dejará de construir relaciones simuladas. Cada tarjeta mostrará el nombre real, fecha, modalidad, duración, distancia, ritmo o potencia y uno de estos estados basados en la base de datos: sesión planificada vinculada, actividad parcial, sustitución o actividad extra.

Cuando exista una polilínea, la tarjeta o el detalle mostrará la vista previa del recorrido con el componente de mapa existente. El botón externo abrirá siempre la URL oficial de Strava en una pestaña o vista externa.

El entrenamiento diario usará la telemetría enlazada para mostrar sus valores reales. Análisis y Resumen seguirán calculando carga, fatiga, progreso y recuperación con las actividades persistidas.

## Fiabilidad y seguridad

El webhook responderá rápidamente y separará la recepción del procesamiento. Los trabajos fallidos conservarán estado, número de intentos y último error para poder reintentarlos. La clave única `(source_provider, external_activity_id)` impedirá duplicados si Strava reenvía un evento.

Los tokens continuarán almacenados en campos protegidos del servidor y nunca se enviarán al navegador. Las políticas de Supabase limitarán cada actividad a su atleta y a su entrenador autorizado. La desconexión de Strava detendrá nuevas importaciones sin borrar el historial existente.

## Configuración de producción

La dirección pública del webhook será `https://<dominio-produccion>/api/webhooks/telemetry`. Producción deberá contener `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_WEBHOOK_VERIFY_TOKEN`, la URL pública y las credenciales de Supabase. El registro se hará una sola vez mediante la API oficial de suscripciones de Strava y se comprobará que apunta al dominio de producción.

## Migración

La migración ampliará `universal_telemetry` sin borrar filas actuales. El Dashboard pasará a Supabase como fuente principal. Se retirarán los ejemplos visuales devueltos cuando Strava responde `Inactive` y se sustituirán por un estado de error claro. La integración de Garmin y su configuración permanecerán intactas.

## Verificación

La implementación incluirá pruebas para normalización, idempotencia, vinculación y actividad extra; validación de tipos, lint y compilación; comprobación del endpoint de verificación; inspección de la suscripción de producción; y una prueba final con una nueva actividad real. Se comprobará que la tarjeta, el mapa, la sesión completada, Análisis, Resumen, la felicitación y el enlace externo contienen la misma actividad.
