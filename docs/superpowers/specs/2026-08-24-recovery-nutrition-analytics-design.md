# Sistema integrado de recuperación, nutrición y analítica

**Fecha:** 24 de agosto de 2026  
**Estado:** Diseño aprobado  
**Ámbito:** recuperación diaria, objetivos nutricionales y analítica histórica

## Objetivo

Convertir datos biométricos, nutricionales y de carga en decisiones comprensibles. La experiencia distingue siempre datos registrados, datos sincronizados y estimaciones. Ninguna estimación se presenta como conducta real del deportista.

## Regla de integridad nutricional

La aplicación no dispone todavía de un registro completo de ingestas. Por tanto, elimina el porcentaje de calorías supuestamente consumidas calculado como una fracción fija del objetivo. Hasta que exista un diario real, mostrará únicamente necesidades y objetivos diarios.

Toda cifra nutricional incluirá su naturaleza: objetivo estimado, gasto sincronizado o dato registrado. La interfaz indicará: `Objetivos estimados; todavía no registras ingestas`.

## Estructura

### Hoy

La pantalla de recuperación comienza con una recomendación basada en readiness, HRV, sueño, fatiga y carga. Después presenta biometría de hoy, objetivo energético, macros y sugerencias de comida pre y postentrenamiento.

La recomendación distingue recuperación óptima, moderada, baja y sin datos. Cada estado explica qué hacer y por qué. Si faltan datos, ofrece check-in manual o sincronización del dispositivo.

### Tendencia

Una sección de siete días resume readiness, HRV, sueño, fatiga y carga sin repetir la lectura diaria. Destaca la variable que más mejora y la que requiere atención. Los gráficos incluyen unidades, leyenda y explicación textual.

### Rendimiento

Analítica comienza con un resumen accionable de forma, fatiga, carga semanal y recomendación. Para principiantes, los términos principales son constancia, volumen y equilibrio entre disciplinas. Para perfiles avanzados se conservan CTL, ATL y TSB con explicación accesible.

Los gráficos detallados permanecen debajo del resumen. Los estados sin datos muestran qué actividad o sincronización se necesita para generar cada métrica.

## Nutrición

La tarjeta principal muestra:

- objetivo energético total;
- metabolismo basal y gasto activo como componentes del objetivo;
- gramos y proporción recomendada de carbohidratos, proteína y grasa;
- hidratación objetivo cuando el dato esté disponible;
- comida sugerida antes y después de la sesión.

No muestra calorías consumidas, cumplimiento ni progreso de ingesta hasta disponer de registros reales. Las sugerencias de IA se identifican como propuestas y no como prescripción médica.

## Jerarquía visual

La recomendación ocupa el primer nivel. Los números principales utilizan cifras tabulares y etiquetas de al menos 12 px. Los controles miden al menos 44 px. Los colores semánticos siempre se acompañan de texto e icono. Se eliminan emojis funcionales y textos de 8–10 px en las áreas modificadas.

## Estados y errores

- biometría registrada, sincronizada, incompleta o ausente;
- objetivo nutricional calculado o no disponible;
- carga histórica suficiente o insuficiente;
- sincronización en curso, completada o fallida;
- respuesta de IA pendiente, disponible o fallida.

Los errores conservan las entradas y ofrecen reintentar. La ausencia de datos nunca se reemplaza por valores predeterminados presentados como reales.

## Accesibilidad

Los gráficos incluyen resumen textual. Los tabs usan semántica y estado seleccionable. Las acciones tienen foco visible y nombre accesible. El contenido funciona con teclado, ampliación de texto y movimiento reducido.

## Verificación

- No existe ningún consumo nutricional inventado.
- Objetivos, sincronizaciones y registros se etiquetan correctamente.
- Las recomendaciones responden a los distintos rangos de recuperación.
- Principiantes no necesitan conocer CTL, ATL o TSB para comprender su progreso.
- Tipado, lint, pruebas y build de producción pasan.
- Revisión responsive a 375, 430, 768, 1024 y 1440 px.

## Criterio de finalización

El deportista comprende su estado, sus necesidades diarias y su tendencia sin confundir estimaciones con datos reales, y puede profundizar en analítica sin perder una recomendación accionable.
