# Panel de atención y calendario operativo

**Fecha:** 23 de agosto de 2026  
**Estado:** Diseño aprobado  
**Ámbito:** panel principal del entrenador y calendario de planificación

## Objetivo

Transformar el panel del entrenador en un centro operativo que responda primero a “¿quién necesita mi atención?” y después a “¿qué debo planificar?”. Las métricas agregadas pasan a un nivel secundario y ampliable.

## Jerarquía

1. Atletas con incidencias accionables.
2. Sesiones de hoy y cumplimiento pendiente.
3. Calendario semanal y creación de entrenamientos.
4. Métricas generales del grupo.
5. Gestión secundaria de grupos, invitaciones y clasificaciones.

## Centro de atención

Una incidencia aparece cuando existe dolor reportado, fatiga alta, HRV baja, carga elevada, sesión omitida o feedback pendiente. Cada elemento muestra atleta, causa, gravedad, momento y una acción principal. La gravedad se comunica con texto e icono además del color.

Los atletas sin incidencias no ocupan espacio en esta sección. Cuando no existen alertas se muestra un estado positivo compacto, sin crear una tarjeta vacía de gran tamaño.

## Resumen operativo

Las cinco tarjetas métricas actuales se condensan en una sola franja con atletas activos, cumplimiento de hoy, carga semanal y readiness medio. Las cifras utilizan números tabulares y etiquetas de al menos 12 px. Las explicaciones detalladas se muestran al ampliar.

## Calendario

El calendario mantiene creación, edición, biblioteca y movimiento de sesiones. Las tarjetas aumentan a un mínimo de 14 px para información secundaria y 16 px para el título cuando el espacio lo permite. Duración, disciplina y estado forman la primera lectura; telemetría y zonas quedan en segundo nivel.

El arrastre no es el único método para mover sesiones. El menú contextual ofrece `Mover a…`, `Editar` y las acciones disponibles. En móvil se muestra una agenda por días; en escritorio, una semana en columnas. La selección de fecha y las acciones táctiles miden al menos 44 px.

## Responsive

En móvil: atención, hoy, agenda semanal, métricas y gestión secundaria. En escritorio: atención y calendario ocupan la zona principal; las métricas forman una franja superior compacta o lateral según el ancho. No habrá desplazamiento horizontal obligatorio para acceder a acciones críticas.

## Estados

Se contemplan carga, sin alertas, sin atletas, sin sesiones, error de movimiento, movimiento en curso, sesión completada, omitida y pendiente. Los errores mantienen el estado anterior y ofrecen reintento. Las acciones destructivas requieren confirmación.

## Accesibilidad

El orden DOM sigue la prioridad visual. Todas las tarjetas interactivas funcionan con teclado y muestran foco. Los botones de icono tienen nombre accesible. Los cambios de fecha y estado se anuncian mediante regiones vivas. El color no es el único indicador de gravedad o cumplimiento.

## Verificación

- Priorización correcta de dolor, fatiga, HRV, carga, omitidas y feedback pendiente.
- Funcionamiento de filtros y búsqueda.
- Creación, edición y movimiento de sesiones con ratón, teclado y controles visibles.
- Revisión a 375, 430, 768, 1024 y 1440 px.
- Tipado, lint, pruebas y build de producción.

## Criterio de finalización

El entrenador puede identificar una incidencia, abrir al atleta y modificar su planificación desde móvil o escritorio sin revisar primero métricas agregadas ni depender del arrastre.
