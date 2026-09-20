# Vista previa del plan y pago de atleta nativo

## Objetivo

Corregir la creación del plan inicial de atleta y hacer visible el valor antes del pago. El flujo debe explicar el papel opcional de un entrenador, presentar los días de entrenamiento propuestos y mostrar únicamente el precio del plan de atleta.

## Datos del plan inicial

El primer paso sustituye la selección poco visible por un botón de deporte claramente interactivo. Las opciones son Triatlón, Carrera, Duatlón y Acuatlón; Acuabike se elimina. El flujo recoge también una distancia compatible para que el servidor pueda seleccionar un plan. No se envía la solicitud hasta incluir deporte, distancia, nivel y horas semanales.

## Apoyo de entrenador

El interruptor `Quiero encontrar o conectar con un entrenador` muestra una explicación debajo al activarse: TriWaveX puede ayudarte a encontrar o conectar con un entrenador después, sin alterar el plan inicial ni el precio de la suscripción de atleta. Es una preferencia, no una compra de entrenador.

## Vista previa antes del pago

Al pulsar `Ver mi plan`, se guarda el perfil y se muestra una vista previa del plan compatible:

- Nombre del plan y objetivo.
- Iconos de los deportes incluidos.
- Días propuestos de entrenamiento durante la semana, con una carga acorde a las horas elegidas.
- Un resumen breve de cómo podrá adaptar o reordenar las sesiones después.

La vista previa no desbloquea el contenido completo hasta que se confirme la suscripción.

## Pago de atleta

La pantalla posterior muestra solo la suscripción `Atleta con IA`: precio vigente de App Store, prueba gratuita si procede, renovación mensual, cómo cancelar desde Apple y qué desbloquea al confirmar. Cuando Apple confirme que la persona cumple los requisitos de la oferta, se destaca `7 días gratis, sin cobro hoy` y se indica que después se renovará al precio mensual vigente. No compara ni muestra el precio de entrenador en este recorrido. Apple mantiene la confirmación final del cobro.

## Errores y verificación

La solicitud nativa incluye la distancia objetivo requerida por el servidor. Si no existe un plan compatible, se muestra ese motivo en lugar de un error genérico. Se comprueba:

- Selección de deporte sin Acuabike.
- Payload válido que crea la vista previa.
- Explicación condicional del entrenador.
- Precio de atleta como único precio en el pago de atleta.
- Parseo de Swift y pruebas de endpoints nativos existentes.
