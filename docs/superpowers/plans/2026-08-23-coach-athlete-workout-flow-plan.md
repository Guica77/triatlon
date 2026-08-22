# Plan de implementación: flujo de entrenamiento entrenador–deportista

## Resultado esperado

El entrenador crea, revisa y publica un entrenamiento mediante un flujo guiado responsive. El deportista recibe la misma estructura, puede leerla con claridad en móvil, completar la sesión y enviar feedback. Los entrenamientos heredados siguen funcionando.

## Fase 1 — Contrato compartido

1. Inventariar el modelo actual, acciones de servidor y transformaciones de exportación.
2. Crear tipos compartidos para cabecera, bloques, objetivos, series y estados.
3. Implementar utilidades puras para normalización, duración, resumen y validación.
4. Añadir pruebas unitarias de bloques normales, series y datos heredados.

## Fase 2 — Lectura compartida

1. Construir un resumen visual compacto del entrenamiento.
2. Construir una lista accesible de bloques con detalles progresivos.
3. Integrar ambos en un `WorkoutPreview` reutilizable.
4. Sustituir la representación duplicada de la vista del deportista manteniendo sus acciones y feedback.

## Fase 3 — Constructor guiado

1. Sustituir el modal comprimido por un compositor amplio con pasos Datos, Bloques y Revisar.
2. Crear formulario de datos esenciales y validación local.
3. Refactorizar el editor de bloques para densidad progresiva y controles táctiles.
4. Añadir vista previa compartida, resumen calculado y acción principal fija en móvil.
5. Conectar creación y edición con las acciones actuales sin cambiar permisos.

## Fase 4 — Estados y feedback

1. Mejorar estados de carga, éxito y error sin pérdida de entradas.
2. Marcar sesiones actualizadas y mantener estados pendiente, completado y omitido.
3. Simplificar el feedback posterior y mostrar campos dependientes solo cuando correspondan.

## Fase 5 — Calidad

1. Ejecutar pruebas, lint y build.
2. Corregir accesibilidad de etiquetas, foco, botones de icono y ordenación alternativa.
3. Verificar visualmente 375, 430, 768, 1024 y 1440 px.
4. Revisar compatibilidad con sesiones sin bloques estructurados.

## Criterio de finalización

La misma sesión puede crearse, previsualizarse, guardarse, publicarse, leerse y completarse sin discrepancias entre ambas vistas; funciona en móvil y escritorio, pasa las comprobaciones automáticas y mantiene compatibilidad heredada.
