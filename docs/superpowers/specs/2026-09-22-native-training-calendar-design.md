# Calendario de entrenamientos nativo: semana y mes

## Objetivo

Convertir la vista nativa de Plan en un calendario SwiftUI claro y editorial: una semana con sesiones legibles por deporte y un mes que resume carga, recuperación y carrera objetivo. Mantiene sin cambios las reglas existentes para mover sesiones y solicitar cambios al entrenador.

## Semana

La vista abre en Semana. Una cabecera permite retroceder, avanzar y volver a la semana actual. Los siete días muestran abreviatura, fecha y pequeñas barras de color por deporte. Al tocar un día, las sesiones aparecen debajo como tarjetas nativas con hora, deporte, nombre y duración.

El día seleccionado tiene contraste fuerte. Los colores son un apoyo visual, nunca el único indicador: cada tarjeta mantiene icono y texto de deporte. Una sesión abre el editor existente; si el plan está controlado por entrenador, la edición continúa convirtiéndose en propuesta, no en un cambio directo.

## Mes

Un selector segmentado `Semana / Mes` cambia la presentación sin recargar el plan. Mes muestra una cuadrícula de días: intensidad/carga de entrenamiento, descansos y la carrera objetivo. Tocar un día selecciona esa fecha y abre el detalle de sus sesiones. No se intenta dibujar todas las sesiones dentro de cada celda.

## Accesibilidad y movimiento

- Cada día expone fecha completa, número de sesiones y resumen de deportes para VoiceOver.
- El selector puede usarse sin gesto horizontal.
- Reducir movimiento elimina la animación de cambio de semana/mes; el contenido cambia inmediatamente.
- Los estados vacíos continúan explicando que es recuperación, no un fallo.

## Verificación

1. Una semana con cero, una y varias sesiones por día conserva la selección y abre el detalle correcto.
2. El mes agrupa correctamente sesiones por fecha y no altera el plan al navegar.
3. Mover una sesión desde ambas vistas utiliza el mismo preview y la misma autorización de entrenador.
4. VoiceOver anuncia días, carga y sesiones; Reducir movimiento no elimina información.
