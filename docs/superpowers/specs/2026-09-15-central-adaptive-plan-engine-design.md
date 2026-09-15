# Motor central de planificación adaptativa

Fecha: 15 de septiembre de 2026

## Objetivo

Permitir que un atleta reorganice su plan con una experiencia rápida y predecible, sin que web y SwiftUI apliquen reglas diferentes. Cada cambio se simula primero, muestra sus consecuencias y solo se guarda después de la confirmación correspondiente.

El trabajo se divide en dos proyectos. Este documento cubre el primero: el motor del Plan y sus interfaces. La unificación visual Apple del resto de la aplicación será un proyecto posterior, una vez verificada la fiabilidad del Plan.

## Principios aprobados

- Existe un único motor de reglas en el servidor. SwiftUI y web son clientes del mismo contrato.
- Simular un cambio nunca modifica datos.
- Un cambio seguro puede confirmarse directamente.
- Un conflicto corregible devuelve una fecha recomendada y requiere confirmación.
- Un riesgo claro bloquea el cambio y explica el motivo.
- Un aumento de carga siempre requiere confirmación explícita.
- La personalización aprende de resultados anteriores, pero no modifica autónomamente las reglas de seguridad.
- Todo cambio confirmado conserva historial y puede deshacerse cuando no haya cambios posteriores incompatibles.
- Un error de conexión o concurrencia no puede dejar el plan parcialmente actualizado.

## Autoridad del plan

### Atleta sin entrenador

El motor adaptativo está activo. El atleta puede solicitar cambios, recibir alternativas y confirmar ajustes. La app puede proponer más volumen cuando la evidencia indique que la semana es demasiado ligera, pero nunca aplicarlo silenciosamente.

### Atleta con entrenador

La IA adaptativa está completamente desactivada. El atleta puede enviar una solicitud con una fecha o motivo, pero el calendario no cambia. El entrenador tiene control total para aprobar, modificar o rechazar la solicitud. Solo una acción del entrenador puede cambiar carga, duración, intensidad o fecha.

Este permiso se decide en el servidor a partir de la relación activa con el entrenador; nunca se confía en un indicador enviado por el cliente.

## Flujo de una modificación

1. El usuario elige una sesión y una fecha o ajuste deseado.
2. El cliente envía una solicitud de simulación con un identificador idempotente y la versión del plan que está mostrando.
3. El servidor carga en paralelo el calendario relevante, sesiones, telemetría reciente, biometría, feedback y autoridad del plan.
4. El motor devuelve uno de cuatro resultados: `safe`, `recommendation`, `blocked` o `coach_review`.
5. La interfaz muestra una hoja de confirmación con “qué cambia”, “por qué”, “mejora esperada”, “a vigilar” y las acciones disponibles.
6. Confirmar ejecuta una única operación transaccional. Si cambió la versión del plan, el servidor rechaza la confirmación y obliga a recalcular la vista previa.
7. Tras guardar, web y SwiftUI actualizan el calendario y el resumen semanal con la respuesta canónica del servidor.

## Señales y suficiencia de datos

El motor utiliza únicamente datos disponibles y válidos:

- fecha, franja, deporte, duración y estado de las sesiones;
- TSS previsto cuando exista y una estimación conservadora cuando no exista;
- TSS, duración y disciplina reales de la telemetría;
- RPE, sensaciones, adherencia a la intensidad y dolor declarado;
- sueño, HRV, pulso en reposo, estrés, fatiga y readiness;
- adherencia y evolución de carga de las cuatro semanas anteriores.

La ausencia de datos nunca se interpreta como una señal positiva. Si faltan señales esenciales, el motor puede reorganizar fechas usando reglas de calendario, pero no propone aumentos de carga.

## Reglas de seguridad

Las reglas se implementan como funciones puras, versionadas y comprobables de forma aislada. La primera versión será conservadora:

- No se mueve una sesión completada.
- No se aumenta carga cuando existe dolor, lesión, fatiga alta o recuperación insuficiente.
- No se propone una segunda sesión diaria sin cumplir la puerta conservadora ya existente: continuidad suficiente, adherencia mínima del 85 %, readiness medio de al menos 70, fatiga media de 3 o menos y crecimiento semanal no superior al 10 %.
- No se permite ocupar dos sesiones en la misma franja del mismo día.
- Los días consecutivos exigentes generan una recomendación alternativa. Cuando la intensidad no pueda determinarse con confianza, la interfaz lo declara y evita presentar una conclusión falsa.
- Un cambio que supere el límite conservador de crecimiento semanal queda bloqueado y devuelve como alternativa una progresión repartida en semanas posteriores.
- Los planes con entrenador nunca pasan por las reglas de IA.
- Solo se reprograman sesiones pendientes entre hoy y 56 días en el futuro. Las demás fechas se rechazan antes de consultar el motor.

Las excepciones deportivas deliberadas, como una sesión brick definida por el plan o el entrenador, se modelan de forma explícita y no se deducen solo porque existan dos deportes el mismo día.

## Aprendizaje controlado

La personalización no es autoentrenamiento irrestricto. El sistema mantiene un perfil derivado y auditable con tendencias como carga tolerada, adherencia, desviación entre TSS previsto y real y respuesta de recuperación. Cada recomendación registra las señales y la versión de reglas que la produjeron.

Los resultados de las recomendaciones aceptadas permiten ajustar futuras puntuaciones dentro de límites predefinidos. Las barreras de dolor, lesión, permisos y crecimiento máximo nunca son alteradas por ese aprendizaje.

La explicación puede enriquecerse con IA, pero la clasificación de seguridad y el cambio permitido son deterministas. Si el servicio de explicación no está disponible, se usa texto estructurado generado por las reglas y la operación sigue siendo funcional.

## Persistencia y concurrencia

Se añaden dos conceptos persistentes:

- `plan_adjustment_proposals`: solicitud, resultado, señales resumidas, versión de reglas, estado, caducidad y responsables.
- `plan_adjustment_events`: cambios anteriores y posteriores necesarios para auditoría y deshacer.

La confirmación se realiza mediante una función transaccional de base de datos que valida usuario, autoridad, versión esperada, caducidad e idempotencia. Actualiza todas las sesiones afectadas y registra el evento en la misma transacción.

El deshacer crea un nuevo evento inverso. Solo se ofrece si las sesiones afectadas no han sido completadas ni modificadas posteriormente.

## Contrato de servicio

El servicio expone operaciones equivalentes para ambas plataformas:

- obtener el plan y su versión;
- simular una modificación;
- confirmar una propuesta;
- descartar una propuesta;
- deshacer el último cambio compatible;
- crear y resolver solicitudes de atleta a entrenador;
- consultar avisos pendientes.

Las respuestas incluyen datos estructurados para que ningún cliente tenga que interpretar texto para decidir el comportamiento. Todos los cambios se limitan al usuario autenticado y están protegidos por RLS y comprobaciones de servidor.

## Experiencia SwiftUI y web

La dirección visual aprobada usa un calendario semanal, resumen de carga y tarjetas de sesión con jerarquía inspirada en iOS. Al editar, la interfaz presenta una hoja contextual con una única decisión principal.

- La selección local responde inmediatamente.
- La simulación muestra un estado discreto sin bloquear la navegación completa.
- La hoja diferencia claramente recomendación, bloqueo y revisión del entrenador.
- La confirmación no desaparece hasta recibir el resultado canónico.
- Un conflicto de versión conserva la intención del usuario y ofrece recalcular.
- Los controles respetan Dynamic Type, contraste, VoiceOver, teclado y reducción de movimiento/transparencia.
- La web reproduce la jerarquía y el comportamiento, sin fingir controles nativos que no funcionen correctamente con teclado o lector de pantalla.

## Notificaciones

- Todo hallazgo aparece dentro del Plan y puede marcar la pestaña con un distintivo.
- El push se reserva para riesgo, recuperación baja, una decisión importante lista para confirmar o una solicitud del entrenador.
- Los ajustes leves permanecen en el centro de avisos del Plan para evitar fatiga de notificaciones.
- Las notificaciones no aplican cambios; abren directamente la propuesta correspondiente.
- Atletas con entrenador reciben el resultado de su solicitud, mientras el entrenador recibe la solicitud que requiere acción.

## Rendimiento

El camino de simulación no espera a una explicación generativa. Las reglas deterministas y los textos de respaldo responden primero; cualquier enriquecimiento posterior es opcional. Las lecturas independientes se ejecutan en paralelo y el plan incluye una versión compacta para evitar recargas completas.

Los clientes pueden actualizar de forma optimista la selección y la vista previa, pero nunca presentan como persistido un cambio que el servidor no haya confirmado.

## Manejo de errores

- Sin conexión: se conserva la intención local y se permite reintentar, sin modificar el calendario persistido.
- Sesión caducada: se solicita autenticación y no se repite automáticamente una confirmación.
- Plan desactualizado: se recalcula la propuesta sobre la versión nueva.
- Propuesta caducada: se crea una nueva simulación.
- Fallo parcial: la transacción revierte todo.
- Push no disponible: el aviso permanece accesible dentro del Plan.
- Explicación de IA no disponible: se utiliza la explicación determinista.

## Verificación

Las pruebas unitarias cubren puntuación de carga, separación de sesiones exigentes, slots, suficiencia de datos, dolor, recuperación, sesiones dobles y permisos. Las pruebas de integración cubren simulación sin escritura, confirmación atómica, idempotencia, concurrencia, RLS, revisión del entrenador, deshacer y notificaciones.

Las pruebas de contrato ejecutan los mismos casos contra las respuestas usadas por SwiftUI y web. La verificación visual y de interacción incluye tamaños de texto, VoiceOver, teclado, modo oscuro, contraste, reducción de movimiento, respuesta al toque y estados offline.

## Entregas

1. Modelo, migraciones, motor puro y pruebas unitarias.
2. API de simulación, confirmación, historial y revisión del entrenador.
3. Plan SwiftUI con la dirección Apple aprobada.
4. Plan web equivalente y accesible.
5. Notificaciones, métricas de resultados y verificación integral.
6. Proyecto separado para unificar la apariencia Apple de Hoy, Progreso, Chat, Perfil, acceso y onboarding.

## Fuera de alcance

- La IA no prescribe ni diagnostica lesiones.
- La IA no modifica planes gestionados por entrenador.
- No se activa un aumento de carga sin confirmación.
- No se rediseñan todas las demás pantallas dentro de esta primera entrega.
