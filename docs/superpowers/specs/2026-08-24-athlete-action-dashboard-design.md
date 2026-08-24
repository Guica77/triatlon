# Panel diario orientado a la acción del deportista

**Fecha:** 24 de agosto de 2026  
**Estado:** Diseño aprobado  
**Ámbito:** panel principal del deportista

## Objetivo

Convertir el panel en una respuesta inmediata a tres preguntas: cómo estoy, qué entrenamiento tengo hoy y qué debo hacer ahora. El contenido informativo y de seguimiento seguirá disponible, pero no competirá visualmente con la acción diaria.

## Jerarquía

1. Estado de recuperación y recomendación concreta.
2. Entrenamiento de hoy y acción principal.
3. Progreso semanal y próximas sesiones.
4. Nutrición y actividad reciente.
5. Logros, dispositivos, feedback y configuración.

## Cabecera diaria

La cabecera combina saludo, fecha y estado de sincronización sin ocupar una tarjeta completa. La recuperación muestra readiness, tendencia y causa principal. Si faltan datos, explica qué dispositivo o registro debe completar el usuario.

La recomendación utilizará lenguaje directo: entrenar según lo previsto, reducir intensidad, priorizar recuperación o consultar una alerta. El color se acompañará siempre de icono y texto.

## Entrenamiento de hoy

La sesión de hoy utiliza el mismo lenguaje compartido del detalle de entrenamiento. Muestra disciplina, título, duración, estado y un resumen breve. La única acción principal abre o continúa la sesión. Si está completada, la acción cambia a consultar resultado; si no hay entrenamiento, aparece descanso con una recomendación adecuada.

## Semana

El progreso semanal resume minutos y sesiones por disciplina. Las próximas sesiones se presentan cronológicamente, priorizando fecha, deporte, duración y estado. La información analítica avanzada enlaza con Analítica y no se duplica en el panel.

## Contenido secundario

Nutrición, actividades, logros y otros módulos se agrupan bajo secciones desplegables con títulos claros y resumen de una línea. La aplicación conserva todas las funciones existentes, pero evita cargar visualmente la primera pantalla.

## Responsive y accesibilidad

Móvil usa una columna y mantiene la acción del entrenamiento accesible sin cubrir contenido. Escritorio utiliza una zona principal y una columna secundaria. Los controles táctiles miden al menos 44 px, el texto auxiliar no baja de 12 px y el texto de lectura se mantiene en 14–16 px. Se respetan áreas seguras, teclado, foco y movimiento reducido.

## Estados

Se contemplan recuperación óptima, moderada, baja y sin datos; entrenamiento pendiente, completado, omitido, descanso y sin sesión; nutrición completa, incompleta y sin datos; dispositivos conectados, desactualizados y desconectados.

## Verificación

- La acción diaria aparece sin desplazamiento inicial en 375, 430, 768, 1024 y 1440 px.
- La información crítica no depende de color ni de hover.
- No existen duplicidades entre resumen diario, detalle de entrenamiento y analítica.
- Los estados vacíos explican el siguiente paso.
- Tipado, lint, pruebas y build de producción pasan correctamente.

## Criterio de finalización

El deportista puede abrir el panel, comprender su estado y comenzar la acción correcta en pocos segundos desde móvil o escritorio, manteniendo acceso al resto de funciones sin que dominen la primera lectura.
