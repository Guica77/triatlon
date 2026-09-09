# Experiencia de atleta e historial de Strava

## Objetivo

Convertir la experiencia de atleta en una navegación corta y consistente, con un historial propio de actividades de Strava. La aplicación guardará los últimos doce meses en Supabase y usará esos datos para completar referencias deportivas reales.

## Navegación

La aplicación nativa mostrará únicamente cuatro destinos: Entreno, Progreso, Chat y Perfil. La web embebida no mostrará una segunda barra de navegación cuando se abra desde la aplicación iOS.

- **Entreno** concentra la sesión de hoy, la siguiente sesión y el acceso al historial.
- **Progreso** presenta carga, tendencias y referencias por disciplina.
- **Chat** queda reservado para la conversación con el entrenador.
- **Perfil** reúne identidad deportiva, objetivos, referencias calculadas y conexiones.

## Importación de Strava

Después de autorizar Strava, el servidor iniciará una importación de los últimos doce meses paginando la API de actividades hasta agotar ese periodo. Cada actividad se almacenará en `universal_telemetry` con `source_provider = 'strava'` y su identificador externo; la restricción única existente evita duplicados si se repite la sincronización.

La importación será idempotente y no modificará entrenamientos planificados históricos. Las actividades que coincidan con una sesión pendiente del día seguirán usando el flujo actual de webhook para asociarse al plan. Las actividades históricas se conservarán como actividades externas sin sesión vinculada.

## Referencias deportivas

Al terminar la importación, el servidor calculará valores representativos por disciplina a partir de actividades válidas:

- Natación: ritmo medio ponderado por distancia.
- Carrera: ritmo medio ponderado por distancia.
- Ciclismo: potencia media cuando esté disponible; de lo contrario velocidad media.
- Todas: volumen, duración y carga agregados para las visualizaciones de Progreso.

Los valores se guardarán como propuestas en el perfil solo si hay una muestra suficiente. Nunca reemplazarán una referencia configurada manualmente sin que el atleta la confirme.

## Experiencia de carga y errores

La importación mostrará fases explícitas: preparando, importando actividades, calculando referencias y completado. La interfaz siempre conservará navegación visible y contenido de reserva, sin pantallas negras. Si Strava rechaza permisos o falla una página, se conservarán las actividades ya guardadas, se mostrará una acción de reintento y no se duplicarán registros.

## Verificación

- Pruebas de paginación, límite de doce meses, deduplicación y cálculo de referencias.
- Prueba de ruta autenticada para importación manual.
- Validación de que la versión nativa no renderiza simultáneamente navegación web y SwiftUI.
- Prueba manual en iPhone: carga, importación, historial, filtros y sincronización posterior.
