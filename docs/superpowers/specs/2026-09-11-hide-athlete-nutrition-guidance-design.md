# Ocultar recomendaciones nutricionales para atletas

## Objetivo

Simplificar la experiencia del atleta retirando temporalmente la prescripción de comidas, recetas y conversación nutricional. La app conserva las métricas necesarias para relacionar el entrenamiento con el gasto energético.

## Alcance aprobado

Se oculta para los atletas:

- Platos y recetas sugeridas antes o después de entrenar.
- Pestañas, tarjetas y mensajes que recomiendan qué comer.
- Acciones conversacionales o automatizadas de nutrición.
- La pestaña de nutrición dentro del detalle de entrenamiento.

Se mantiene para los atletas:

- Gasto calórico y calorías activas como métrica de actividad.
- Macros y consumo energético cuando formen parte de las métricas de recuperación.
- Datos y preferencias ya guardados.

Se mantiene para entrenadores:

- La información nutricional existente de sus atletas, sin cambios funcionales.

## Diseño

Las pantallas de atleta no deben mostrar un espacio vacío donde estaba nutrición. La información calórica restante se presenta como dato secundario dentro de biometría o actividad, sin recetas, ilustraciones, chat ni símbolos decorativos.

## Reversibilidad

No se eliminan tablas, acciones de servidor ni datos de preferencias. El cambio es de visibilidad de producto y puede revertirse restaurando los componentes de atleta.

## Verificación

- La portada, recuperación y detalle de entrenamiento no muestran recomendaciones de comida.
- Las calorías activas siguen visibles donde correspondan.
- Las vistas de entrenador conservan su información actual.
- Se ejecutan tipos, pruebas y lint.
