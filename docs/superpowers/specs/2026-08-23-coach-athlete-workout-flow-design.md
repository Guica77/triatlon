# Rediseño del flujo de entrenamiento entrenador–deportista

**Fecha:** 23 de agosto de 2026  
**Estado:** Diseño aprobado  
**Alcance inicial:** creación del entrenador y lectura, ejecución y feedback del deportista

## Objetivo

Unificar el entrenamiento que crea el entrenador y el que recibe el deportista en una experiencia clara, profesional y plenamente usable en móvil. El producto conservará su identidad carbon-blue y los colores por disciplina, con una presentación más sobria y directa inspirada en la claridad de productos financieros como Revolut, sin copiar su interfaz.

El sistema ofrecerá una experiencia guiada por defecto y revelará capacidades avanzadas cuando sean necesarias. Debe servir tanto a entrenadores nuevos como a entrenadores expertos sin convertir la pantalla inicial en un panel denso.

## Principios

1. Una única estructura de datos debe alimentar la edición, la vista previa y la lectura del deportista.
2. La información necesaria para ejecutar la sesión aparece antes que las explicaciones secundarias.
3. Cada pantalla tiene una sola acción principal.
4. La complejidad avanzada se presenta de forma progresiva.
5. El deportista usa principalmente móvil; el entrenador debe trabajar bien en escritorio, tableta y móvil.
6. Los entrenamientos existentes continúan siendo legibles durante la transición.

## Flujo del entrenador

### Paso 1: datos esenciales

El entrenador selecciona deportista, fecha y deporte, y define título, objetivo, duración estimada, material y notas generales. Los campos indispensables son título, fecha, deporte y objetivo. La duración puede partir de una estimación manual, pero se recalcula al construir los bloques.

La interfaz guarda automáticamente un borrador. El encabezado muestra los estados `Guardando`, `Borrador guardado` o `Sin conexión`, sin bloquear la edición.

### Paso 2: construcción por bloques

El entrenamiento se compone de bloques ordenables:

- calentamiento;
- trabajo principal;
- recuperación;
- series;
- vuelta a la calma.

Cada bloque muestra inicialmente nombre, duración o distancia e intensidad. La acción `Más opciones` revela potencia, ritmo, frecuencia cardiaca, zona, cadencia, RPE, notas técnicas y alertas. Las series agrupan trabajo y recuperación, con número de repeticiones, sin expandir visualmente todas las copias.

La biblioteca de bloques, la duplicación y las plantillas son acciones secundarias. En escritorio pueden abrir un panel lateral; en móvil aparecen en una hoja inferior. Arrastrar no será el único método de ordenación: cada bloque tendrá acciones accesibles para subir y bajar.

La cabecera mantiene visibles la duración total y la carga estimada. Si la duración declarada no coincide con los bloques, se muestra una advertencia y una acción para adoptar el valor calculado.

### Paso 3: revisión y publicación

La revisión presenta exactamente el componente de lectura que verá el deportista. El entrenador puede volver al bloque correspondiente desde cualquier advertencia. La única acción principal es `Publicar entrenamiento`; guardar como plantilla y duplicar son secundarias.

No se permite publicar si falta un campo obligatorio, no existe ningún bloque válido o un objetivo contiene rangos imposibles. El error aparece junto al campo o bloque y el foco se mueve al primer problema.

## Experiencia del deportista

### Lectura previa

La pantalla empieza con deporte, título, duración total, objetivo principal y material necesario. Un perfil visual compacto representa la intensidad a lo largo de la sesión. Si el entrenador modificó una sesión ya publicada, aparece el estado `Actualizado por tu entrenador` y se destacan los cambios relevantes.

Los bloques se presentan numerados y en orden. Cada bloque responde primero a tres preguntas: qué hacer, durante cuánto tiempo o distancia, y a qué intensidad. Las notas técnicas se despliegan bajo demanda.

### Ejecución

En móvil, una barra inferior fija ofrece la acción correspondiente al estado: `Empezar`, `Continuar`, `Completar` o `Enviar sensaciones`. La barra respeta las áreas seguras del dispositivo y no cubre contenido.

El diseño no presupone que la aplicación funcione como cronómetro en esta fase. Su objetivo inicial es permitir lectura clara durante la sesión y registrar el estado. Una futura ejecución paso a paso podrá reutilizar los mismos bloques sin cambiar el modelo.

### Finalización y feedback

Al completar, el deportista responde un formulario breve con esfuerzo percibido, sensaciones, cumplimiento de intensidad, dolor localizado y comentario opcional. Los controles complejos se revelan solo cuando corresponden; por ejemplo, la localización del dolor aparece al indicar dolor.

El éxito confirma que la sesión y el feedback se guardaron. Un error mantiene las respuestas y ofrece reintentar.

## Modelo de información

La cabecera del entrenamiento contiene:

- identificador, deportista, entrenador, fecha y estado;
- deporte, título, objetivo, duración estimada y carga estimada;
- material, notas generales, versión y fecha de actualización.

Cada bloque contiene:

- identificador, tipo y orden;
- condición de finalización: tiempo, distancia o acción manual;
- valor de finalización y unidad;
- objetivo de intensidad: libre, zona, potencia, ritmo, frecuencia cardiaca, cadencia o RPE;
- rango mínimo y máximo cuando corresponda;
- notas y alertas;
- estructura anidada de trabajo y recuperación para series.

Los campos textuales heredados se mantienen como compatibilidad. La interfaz nueva prioriza los bloques estructurados; cuando solo exista texto antiguo, muestra una representación heredada clara sin inventar valores. No se migran automáticamente instrucciones ambiguas.

## Componentes y límites

- `WorkoutComposer`: controla los tres pasos y el estado del borrador.
- `WorkoutBasicsForm`: edita únicamente la cabecera.
- `WorkoutBlockEditor`: crea y valida un bloque individual.
- `WorkoutBlockList`: ordena bloques y calcula los totales.
- `WorkoutPreview`: compone la vista real del deportista.
- `AthleteWorkoutView`: añade estados y acciones del deportista alrededor de `WorkoutPreview`.
- `WorkoutFeedback`: registra la valoración posterior.
- Utilidades puras transforman bloques, calculan duración/carga y adaptan sesiones heredadas.

Cada unidad recibe datos explícitos y emite cambios mediante interfaces tipadas. Ningún componente de presentación accede directamente a la base de datos.

## Sistema visual

Se mantiene la paleta carbon-blue actual. Los colores de disciplina identifican el tipo de actividad, no acciones. El naranja de marca se reserva para la acción principal y el foco.

- texto de apoyo: mínimo 14 px;
- texto de controles y lectura: mínimo 16 px en móvil;
- objetivos numéricos: cifras tabulares;
- controles táctiles: mínimo 44 × 44 px y separación de al menos 8 px;
- bordes finos, sombras discretas y radios consistentes;
- iconos Lucide, sin emojis funcionales;
- contraste mínimo AA y foco visible;
- animaciones entre 150 y 300 ms, con soporte para movimiento reducido.

## Comportamiento responsive

En escritorio, el entrenador dispone de composición en dos columnas: edición y vista previa. Las opciones avanzadas pueden ocupar un panel lateral sin desplazar la acción principal.

En tableta, la vista previa puede alternarse con la edición manteniendo el progreso. En móvil, los pasos se apilan, el resumen se compacta y las opciones avanzadas aparecen en hojas inferiores con cierre visible. La acción principal se fija abajo y reserva espacio en el contenido.

La pantalla del deportista utiliza una sola columna en todos los tamaños y amplía el ancho de lectura sin convertirlo en un panel denso.

## Estados y recuperación de errores

Se diseñan explícitamente:

- vacío con ejemplo y acción inicial;
- cargando con reserva de espacio;
- guardando y guardado;
- sin conexión con borrador local conservado;
- validación en campo o bloque;
- error de publicación con reintento;
- publicado y actualizado;
- pendiente, en curso, completado y omitido;
- feedback pendiente, enviándose, enviado o fallido.

Cerrar con cambios todavía no persistidos solicita confirmación. Las acciones asíncronas se deshabilitan mientras se procesan y conservan el contenido ante fallo.

## Accesibilidad

La navegación completa funciona con teclado. Los títulos siguen una jerarquía semántica, los formularios tienen etiquetas visibles y los errores se anuncian mediante regiones vivas. El orden de foco coincide con el visual. Las acciones de icono incluyen nombre accesible y el ordenamiento por arrastre ofrece botones equivalentes.

El color nunca es el único indicador de disciplina, intensidad o error. El contenido admite ampliación de texto y no depende de hover.

## Verificación

### Pruebas de lógica

- cálculo de duración para tiempo, distancia y series;
- validación de rangos, zonas y condiciones;
- ordenación sin pérdida de datos;
- adaptación segura de entrenamientos heredados;
- persistencia y recuperación del borrador.

### Pruebas de flujo

- crear, previsualizar, publicar y volver a editar;
- leer una sesión publicada como deportista;
- completar y enviar feedback;
- recuperar errores de red sin perder información;
- abrir entrenamientos antiguos con y sin bloques estructurados.

### Revisión visual y accesible

Se comprueban 375, 430, 768, 1024 y 1440 px, orientación horizontal móvil y áreas seguras. También se verifica teclado, lector de pantalla, contraste, aumento de texto, movimiento reducido y ausencia de desplazamiento horizontal.

## Implantación por fases

1. Consolidar tipos, transformaciones y cálculos.
2. Construir el componente compartido de lectura del deportista.
3. Reemplazar el modal actual por el flujo guiado del entrenador.
4. Integrar publicación, actualización y borrador recuperable.
5. Rediseñar finalización y feedback.
6. Verificar compatibilidad, responsive y accesibilidad.

Esta fase termina cuando el mismo entrenamiento puede crearse, revisarse, publicarse, leerse y completarse sin discrepancias entre entrenador y deportista.
