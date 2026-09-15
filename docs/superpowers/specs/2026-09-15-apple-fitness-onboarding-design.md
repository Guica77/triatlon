# Apple Fitness onboarding

## Objetivo

Convertir el onboarding del atleta en una configuración breve, fiable y serena. La misma interfaz web se presenta dentro de la app iOS autenticada, por lo que habrá una única fuente de verdad visual y funcional.

## Dirección de diseño

El lenguaje será Apple Fitness y Ajustes: fondo del sistema, tipografía legible, superficies ligeras, esquinas de 20-24 px, una acción principal por pantalla y transiciones de 150-200 ms que respetan `prefers-reduced-motion`. Los botones tendrán una altura mínima de 44 px; la acción de confirmación, 48-52 px.

No habrá emojis, mensajes de marketing largos, botones de conexión simulados ni acciones escondidas únicamente en hover.

## Recorrido

1. **Objetivo y disponibilidad.** El atleta elige una carrera de catálogo, una prueba a medida o una temporada sin objetivo. A continuación selecciona nivel y horas semanales. La calibración avanzada se mantiene plegada y es completamente opcional.
2. **Revisión y creación.** Se muestran los seis datos que determinan el plan. El atleta puede conectar Polar, COROS o Strava con OAuth real, introducir un código de entrenador o crear el plan directamente.

La conexión a Garmin no será interactiva mientras el proveedor no la apruebe. Su estado se comunica claramente como pendiente.

## Reglas de producto

- El código de entrenador vincula el atleta al guardar. Cuando hay entrenador, ese entrenador controla la planificación y la IA no altera sus decisiones.
- Sin entrenador, las recomendaciones adaptativas se activan después de completar la configuración; nunca se prometen ajustes automáticos antes de que exista un plan.
- Las conexiones son opcionales. Guardar el plan no depende de tener reloj ni cuenta de terceros.
- Los estados de carga bloquean la acción repetida y muestran una indicación inmediata; los errores se muestran junto al campo o acción que falló.

## Accesibilidad y respuesta

- Cada campo tendrá una etiqueta accesible y cada control se podrá usar con teclado y lector de pantalla.
- El orden visual y de tabulación coincidirá.
- El contenido será móvil primero, sin desplazamiento horizontal ni zonas táctiles menores de 44 px.
- Las transiciones utilizarán solo opacidad y transformación, sin retrasar la interacción.

## Validación

- Comprobación de tipos y lint de los componentes del onboarding.
- Pruebas existentes de la aplicación.
- Revisión de los estados: paso 1, paso 2, conexión disponible, Garmin pendiente, entrenador y carga.
