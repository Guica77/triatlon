# Vista previa de plan con objetivo, disponibilidad y Gym

## Objetivo

Convertir la vista previa del plan nativo en una propuesta clara y personal: un atleta puede preparar una competición concreta con fecha o entrenar una distancia sin fecha definida. Las sesiones se calculan a partir del tiempo disponible y de sus horas y días reales de entrenamiento, incluyendo Fuerza / Gym.

## Datos de onboarding

Tras elegir deporte y distancia, el atleta elige una de estas opciones:

1. **Tengo una competición**: indica nombre y fecha. La fecha es obligatoria y debe ser futura.
2. **Aún no tengo fecha**: recibe un plan flexible para la distancia elegida.

En la disponibilidad semanal indica sus horas disponibles y selecciona los días en que puede entrenar. Gym / Fuerza es una disciplina seleccionable como el resto, no una nota aparte.

## Propuesta del plan

Para una carrera con fecha, la duración se deriva de las semanas restantes y la carga semanal se recomienda dentro de las horas disponibles. Si la carrera está demasiado próxima para una progresión segura, se mantiene la disponibilidad como límite y se comunica una recomendación conservadora; nunca se inventan más horas.

Para un objetivo sin fecha se crea un bloque flexible de preparación y se muestra que su duración se recalculará al añadir una carrera.

La propuesta reparte sesiones entre los días marcados y puede incluir Natación, Ciclismo, Carrera, Transición y Fuerza / Gym según el deporte. Ninguna sesión se asigna a un día no disponible.

## Vista previa y edición posterior

La pantalla de vista previa mostrará en ancho completo:

- objetivo, distancia y fecha o el estado «Sin fecha todavía»;
- semanas hasta la prueba, cuando exista fecha;
- horas recomendadas frente a las horas disponibles;
- sesiones propuestas como filas legibles, con icono, día y disciplina sin cortes de línea;
- una explicación inequívoca: tras activar el acceso se pueden mover, editar o eliminar entrenamientos, y ajustar días y carga.

La sesión de Fuerza / Gym abrirá ejercicios concretos de la biblioteca de fuerza, con series, repeticiones y registro de peso cuando corresponda.

## Accesibilidad y fiabilidad

Las opciones tendrán etiquetas completas para VoiceOver. La fecha se valida antes de crear la vista previa y se muestra un mensaje accionable en lugar de un error genérico. El estado de App Store permanece separado: si no puede cargar una suscripción, el usuario podrá reintentar o restaurar compras sin perder su propuesta de plan.

## Verificación

- Validar combinaciones de carrera con fecha, objetivo sin fecha y disponibilidad semanal.
- Verificar que las sesiones propuestas respetan los días elegidos e incluyen Fuerza cuando corresponda.
- Comprobar en pantalla estrecha que día y disciplina permanecen en una sola línea.
- Ejecutar las pruebas de onboarding, autenticación y el parseo de Swift modificado.
