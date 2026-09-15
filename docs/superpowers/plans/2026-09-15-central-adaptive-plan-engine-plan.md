# Plan de implementación: motor central de planificación adaptativa

## Resultado esperado

Un atleta sin entrenador puede simular, revisar, confirmar y deshacer una reorganización segura del calendario desde SwiftUI o web. Ambas plataformas reciben exactamente la misma decisión del servidor. Si el atleta tiene entrenador, la IA no participa y cualquier propuesta queda pendiente de la decisión del entrenador.

## Fase 0 — Consolidar el prototipo actual

1. Revisar los cambios locales existentes del Plan nativo y web y conservar únicamente las piezas compatibles con la especificación aprobada.
2. Extraer tipos de plan compartidos para evitar que las rutas y las acciones mantengan contratos diferentes.
3. Sustituir la actualización directa actual por el ciclo `preview → confirm`.
4. Mantener la respuesta visual inmediata solo para selección y simulación; no presentar una sesión como guardada antes de la confirmación canónica.

## Fase 1 — Dominio y reglas puras

1. Crear un módulo de dominio para sesiones, señales, autoridad, propuestas, razones, severidad y versión de reglas.
2. Normalizar deporte, intensidad, duración, TSS, franja y estados heredados.
3. Implementar las reglas deterministas:
   - sesión completada no editable;
   - horizonte desde hoy hasta 56 días;
   - franja diaria única;
   - separación de sesiones exigentes;
   - crecimiento semanal máximo del 10 %;
   - bloqueo por dolor, lesión, fatiga alta o recuperación insuficiente;
   - puerta conservadora para una segunda sesión;
   - excepción explícita para bricks.
4. Crear el buscador de fechas alternativas que puntúa los días válidos y devuelve la mejor opción con razones estructuradas.
5. Crear el evaluador de semana demasiado ligera. Solo propone un incremento cuando hay cuatro semanas suficientes y todas las barreras conservadoras se cumplen.
6. Añadir pruebas unitarias exhaustivas, incluidas zonas horarias y cambios de semana.

## Fase 2 — Persistencia segura

1. Añadir una migración para `plan_adjustment_proposals` y `plan_adjustment_events`, índices, estados y relaciones.
2. Añadir políticas RLS separadas para atleta, entrenador relacionado y servicio.
3. Crear una función transaccional para confirmar propuestas con versión esperada, caducidad e idempotencia.
4. Crear una función transaccional para deshacer cuando ninguna sesión afectada haya cambiado o sido completada.
5. Añadir pruebas SQL o de integración para propiedad, concurrencia, doble confirmación y rollback.

## Fase 3 — Servicio central y contratos

1. Crear un servicio que lea en paralelo plan, sesiones próximas, cuatro semanas de historial, biometría, feedback, telemetría y relación con entrenador.
2. Exponer contratos tipados para obtener plan, simular, confirmar, descartar, deshacer y consultar avisos.
3. Hacer que la clasificación de seguridad sea independiente de cualquier llamada generativa.
4. Generar siempre una explicación determinista; enriquecerla con IA de forma opcional y no bloqueante.
5. Incorporar límites de entrada, autenticación, origen, contenido JSON, propiedad e idempotencia.
6. Añadir pruebas de contrato que reutilicen los mismos casos para web y cliente nativo.

## Fase 4 — Atletas con entrenador

1. Derivar la autoridad exclusivamente en el servidor.
2. Convertir la acción del atleta en una solicitud pendiente sin modificar sesiones.
3. Añadir al entrenador una bandeja de solicitudes con plan actual, cambio pedido y motivo del atleta.
4. Permitir al entrenador aprobar, editar o rechazar; toda aprobación se registra como acción del entrenador.
5. Verificar que ninguna ruta adaptativa o explicación de IA se ejecute para atletas con entrenador.

## Fase 5 — Plan SwiftUI

1. Adaptar `NativePlanModel` al contrato versionado y a los estados de propuesta.
2. Implementar el calendario semanal Apple aprobado, resumen real de carga y tarjetas con intensidad y estado.
3. Presentar edición y recomendaciones mediante hojas nativas con detents, acción principal clara y haptics solo al confirmar o fallar.
4. Añadir estados de simulación, conflicto de versión, offline, revisión del entrenador y deshacer.
5. Mantener Dynamic Type, VoiceOver, contraste, modo oscuro, reducción de movimiento y objetivos táctiles de 44 puntos.
6. Compilar y probar navegación, actualización y restauración en simulador y dispositivo.

## Fase 6 — Plan web

1. Sustituir el formulario provisional por el calendario y hoja contextual equivalentes.
2. Usar controles semánticos y accesibles con teclado, foco visible y lectores de pantalla.
3. Compartir el contrato y los textos estructurados con la ruta nativa.
4. Añadir respuesta al presionar, transiciones breves e interrumpibles y alternativas para movimiento o transparencia reducidos.
5. Probar móvil, tableta y escritorio sin duplicar lógica de reglas en React.

## Fase 7 — Avisos y notificaciones

1. Crear un centro de avisos del Plan y un distintivo de pestaña para hallazgos pendientes.
2. Enviar push solo para riesgo, recuperación baja, propuesta importante o solicitud de entrenador.
3. Hacer que cada notificación abra la propuesta exacta y nunca aplique el cambio por sí misma.
4. Añadir entrega idempotente, preferencias, caducidad y fallback dentro de la app.
5. Probar permisos denegados, tokens caducados y duplicados.

## Fase 8 — Aprendizaje controlado y observabilidad

1. Calcular un perfil auditable de respuesta a la carga a partir de adherencia, TSS previsto/real y recuperación posterior.
2. Ajustar únicamente la puntuación de alternativas dentro de límites fijos; nunca modificar barreras de seguridad.
3. Registrar aceptación, rechazo, modificación, resultado y motivo sin almacenar payloads de salud innecesarios.
4. Añadir métricas de latencia, fallos, conflictos, deshacer y efectividad de recomendaciones.
5. Crear una forma segura de desactivar el motor adaptativo sin romper la edición manual.

## Fase 9 — Verificación y entrega

1. Ejecutar TypeScript, ESLint, Vitest, pruebas de integración y comprobaciones de migración.
2. Compilar el proyecto iOS sin firma y verificar los flujos críticos en simulador.
3. Revisar visualmente modos claro/oscuro, tamaños de texto, VoiceOver, teclado y estados sin datos.
4. Confirmar que los planes con entrenador nunca llaman al motor de IA.
5. Confirmar que una simulación no escribe y que una confirmación nunca deja cambios parciales.
6. Documentar la migración, variables necesarias y proceso de rollback antes del despliegue.

## Proyecto posterior — conectores de dispositivos

Las APIs de Garmin, COROS, Amazfit/Zepp, Polar, Suunto, Fitbit, Wahoo, Strava, Apple Health y Health Connect se implementarán después mediante adaptadores independientes hacia el modelo de telemetría universal. Cada proveedor tendrá OAuth o autorización nativa, sincronización idempotente, webhooks/polling según disponibilidad, normalización, estado visible y revocación. El motor adaptativo consumirá datos normalizados y nunca dependerá directamente de una marca.

## Criterio de finalización

El mismo cambio produce la misma clasificación y propuesta en web y SwiftUI; los aumentos requieren confirmación; los riesgos se bloquean; los atletas con entrenador quedan fuera de la IA; las operaciones son atómicas, auditables y reversibles; y todas las comprobaciones automáticas y visuales pasan antes del despliegue.
