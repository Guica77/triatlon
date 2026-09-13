# Alta adaptativa, propuestas meteorológicas y conocimiento privado

## Objetivo

TriWaveX debe crear una cuenta y un plan inicial sin convertir el acceso en un formulario largo. El atleta o entrenador entra con Apple o correo, responde preguntas breves según su rol y puede omitir los datos no imprescindibles. Las respuestas producen un perfil útil para el plan y para el entrenador, sin declarar que son un diagnóstico médico.

La aplicación debe proponer, nunca aplicar automáticamente, ajustes a entrenamientos exteriores cuando las condiciones previstas hagan que el plan original deje de ser razonable. Los entrenadores podrán aportar documentos y vídeos privados; las recomendaciones que usen ese material citarán su origen y, en un vídeo, el minuto relevante.

## Alta y onboarding

### Entrada

1. La pantalla de acceso muestra **Continuar con Apple**, correo y un selector de rol: Atleta o Entrenador.
2. Apple y correo crean o recuperan la cuenta. El rol se conserva como metadato protegido y determina el siguiente flujo.
3. Tras autenticarse, se abre un onboarding a pantalla completa. No se recopilan datos antes de una sesión válida.

### Patrón de preguntas

- Una pregunta por pantalla, encabezado de progreso de siete pasos y navegación Atrás.
- Las respuestas discretas usan burbujas de texto sin iconos decorativos.
- Para preguntas de opción binaria se muestran exactamente **Sí**, **No** y **Prefiero no responder**.
- Para disponibilidad, objetivo de tiempo o intensidad se usan controles deslizantes con valores accesibles y resumen textual.
- El último paso utiliza un control deslizante hacia la derecha, “Desliza para confirmar”, para confirmar y guardar. No se usará como patrón para acciones rutinarias.
- Los datos no esenciales podrán omitirse. Lesiones, alergias y salud se marcan como privados, editables y eliminables desde Perfil.

### Atleta

El flujo pregunta progresivamente por objetivo o carrera, fecha, experiencia, disponibilidad semanal, disciplinas, lesiones o molestias, preferencias de entrenamiento, disponibilidad de dispositivos y relación con entrenador. Una invitación de entrenador se resuelve sin duplicar la cuenta del atleta.

Si el atleta no está con entrenador, se crea una propuesta de plan inicial basada únicamente en las respuestas confirmadas. Si tiene entrenador, el onboarding prepara el perfil y deja que el entrenador publique el plan.

### Entrenador

El flujo recoge especialidad, experiencia, metodología, disponibilidad, disciplinas que entrena y cómo invita atletas. No recopila información clínica de sus atletas. Al terminar, abre el panel de entrenador con una lista vacía explicada y una acción para invitar o cargar conocimiento.

## Propuesta meteorológica

### Alcance

- Solo se evalúan sesiones exteriores de carrera y ciclismo cuya localización esté disponible mediante permiso “Al usar la app” o una ciudad elegida manualmente.
- WeatherKit obtiene temperatura, humedad, viento y condición actual o prevista para el horario de la sesión.
- Natación, sesiones interiores y entrenamientos sin localización no muestran una propuesta meteorológica.

### Decisión y experiencia

La propuesta se muestra dentro de la ficha de entrenamiento y contiene las condiciones, la modificación sugerida y una razón breve. Mantiene siempre el plan original visible.

Ejemplos de reglas conservadoras:

- Calor o humedad alta: reducir duración hasta un 10–20 %, bajar una zona de esfuerzo, recomendar agua y horario menos expuesto.
- Frío: ampliar el calentamiento y recordar una capa ligera; no reduce por defecto la sesión.
- Viento fuerte: recomendar recorrido resguardado y esfuerzo en lugar de ritmo; no modifica objetivos de seguridad crítica sin confirmación.

Solo hay dos acciones: **Aplicar ajuste** y **Mantener plan**. Aplicar crea una revisión atribuida a “Condiciones meteorológicas”, conserva el original y notifica al entrenador cuando exista. Un entrenador puede aceptar, sustituir o bloquear los ajustes automáticos para su atleta. La aplicación nunca cambia una sesión sin esa acción explícita.

## Conocimiento privado de entrenador

### Material aceptado

- Documentos de texto y PDF extraíble.
- Vídeo cargado o enlazado cuando exista una transcripción autorizada.
- Para vídeo, se almacenan título, transcripción, capítulos y marca temporal por fragmento; no se intenta inferir conocimiento de imágenes del vídeo en esta primera versión.

### Privacidad y RAG

- Todo material subido por un entrenador pertenece a ese entrenador.
- Solo el entrenador y sus atletas con relación activa pueden recuperarlo como contexto. Otros entrenadores, atletas y resultados públicos no pueden acceder a título, texto, transcripción ni metadatos.
- Los fragmentos se indexan tras validar tipo y tamaño. Se conservan documento, sección y segundo inicial/final del vídeo.
- Las respuestas con conocimiento privado muestran una fuente discreta, por ejemplo “Método de Ana · 12:40”, enlazable solo para personas autorizadas.
- El conocimiento del sistema sigue separado del conocimiento privado. El RAG no ejecuta instrucciones dentro de un documento y no expone documentos completos al modelo cuando bastan fragmentos relevantes.

## Arquitectura

- Ampliar los flujos actuales de registro y onboarding, en lugar de crear una segunda pantalla de acceso.
- Añadir un modelo de respuestas de onboarding por rol y guardarlo solo tras la confirmación final; el flujo puede reanudarse si se interrumpe.
- Crear una política de ajustes meteorológicos y un registro de revisión de entrenamiento que guarda condición, propuesta, decisión y autor.
- Reutilizar WeatherKit nativo para iOS y añadir una fuente de previsión de servidor para la web. La recomendación se calcula con la misma política compartida para evitar respuestas diferentes entre plataformas.
- Ampliar las tablas existentes de conocimiento con ámbito del propietario, relación de entrenador y metadatos de vídeo/transcripción; las políticas RLS aplican la relación activa antes de cualquier recuperación semántica.

## Estados y errores

- Si Apple no devuelve nombre o correo en accesos posteriores, se conserva el perfil existente y se pide solo el dato imprescindible que falte.
- Si el usuario omite una respuesta, la aplicación muestra una propuesta menos específica; no inventa historial, lesión ni disponibilidad.
- Si WeatherKit no da una previsión, no hay modificación sugerida y el entrenamiento sigue disponible.
- Si no se puede extraer la transcripción de un vídeo, el vídeo queda pendiente y no entra al RAG hasta que esté listo.
- Un entrenador puede retirar un material; sus fragmentos quedan inmediatamente excluidos de futuras recuperaciones.

## Verificación

- Pruebas de alta por Apple y correo para los dos roles, incluidos reintentos y email pendiente de confirmación.
- Pruebas de persistencia y edición de respuestas, opciones omitidas y privacidad de lesiones.
- Pruebas de reglas meteorológicas para calor, humedad, frío, viento, sesión interior y ausencia de ubicación.
- Pruebas de que aplicar un ajuste conserva el plan original y registra la decisión, y de que un entrenador puede bloquearlo.
- Pruebas RLS y de recuperación que impiden a terceros consultar materiales o transcripciones ajenas.
- Prueba manual de la interfaz SwiftUI en iPhone: tamaño táctil, lector de pantalla, reducción de movimiento y el gesto de confirmación.
