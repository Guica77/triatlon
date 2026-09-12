# Navegación nativa y planes de entrenamiento

## Objetivo

Separar la experiencia diaria de la planificación para que la app responda a tres preguntas distintas: qué hacer hoy, qué viene en el plan y cómo progresa el atleta.

## Navegación de atleta

La barra inferior, tanto en SwiftUI como en web, tendrá cinco destinos:

1. **Hoy** (`/dashboard`): entrenamiento de hoy, estado y próxima sesión.
2. **Plan** (`/plan`): calendario, semanas y sesiones programadas.
3. **Progreso** (`/resumen`): carga, constancia y tendencias.
4. **Mensajes** (`/chat`): conversación con el entrenador.
5. **Perfil** (`/settings`): datos, conexiones y cuenta.

La pestaña Plan sustituye el calendario extenso que hoy carga la portada. El perfil queda excluido de esta migración visual.

## Decisión de plan

- Un atleta tiene un único plan activo.
- Con entrenador: el plan lo asigna y gestiona el entrenador; el atleta puede consultarlo, no sustituirlo.
- Sin entrenador: la app presenta un **Plan recomendado** basado en objetivo, nivel, disponibilidad y fechas. No se muestra “IA” en la interfaz.
- Las alternativas se conservan como objetivos futuros, plantillas disponibles o planes archivados; no compiten con el plan activo.

## Diseño de Plan

- Encabezado simple con el nombre del plan y la semana actual.
- Calendario semanal como contenido principal y vista mensual secundaria.
- Acciones de planificación agrupadas fuera de la pantalla Hoy.
- Fondo agrupado, listas y separadores de sistema; no paneles de métricas ni chips decorativos.

## Implementación y verificación

- Añadir `/plan` con la planificación existente reorganizada.
- Actualizar navegación SwiftUI, barra móvil y barra lateral de escritorio.
- Mantener rutas, permisos y navegación de entrenador existentes.
- Verificar rutas, tipos, pruebas y lint; inspección visual en iPhone y web.
