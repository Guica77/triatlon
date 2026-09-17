# Registro y onboarding nativos de TriWaveX

## Objetivo

Sustituir el registro y el onboarding web embebidos de la aplicación iOS por una experiencia enteramente SwiftUI. La aplicación conservará los mismos servicios de autenticación, perfiles, planes y pagos; solo cambia la presentación y la orquestación nativa.

El resultado debe sentirse como una configuración de Apple: una decisión por pantalla, lenguaje directo, controles grandes, un único siguiente paso visible y posibilidad de modificar las respuestas posteriormente.

## Alcance de la primera migración

1. **Acceso nativo.** Mantener correo, contraseña, Apple Sign In y selección Atleta/Entrenador en `RootView`.
2. **Registro nativo.** Crear una pantalla SwiftUI para nombre, apellidos, correo, contraseña y confirmación, con validación local y envío mediante la API de registro existente.
3. **Onboarding nativo.** Reemplazar la ruta web `/onboarding` por un flujo nativo para atletas. Captura objetivo, disponibilidad, experiencia y conexiones opcionales; conserva los datos ya utilizados por el motor de planificación.
4. **Vídeo final de orientación.** Mostrar una guía breve, reproducible u omitible, antes de elegir y comprar el plan.
5. **Pago nativo.** Presentar los planes de App Store mediante StoreKit, con siete días gratuitos, restauración de compras y validación de acceso. Stripe permanece exclusivamente para la web.
6. **Entrada al producto.** Tras una compra, restauración o un plan ya activo, entrar al dashboard nativo sin volver a iniciar el onboarding.

Las pestañas de producto restantes se migrarán en módulos posteriores. No se elimina ninguna ruta ni API web en esta fase.

## Diseño de interacción

### Registro

- Fondo `systemGroupedBackground`, grupos de campos en `secondarySystemGroupedBackground` y tipografía Dynamic Type.
- Nombre y apellidos en una fila adaptable: dos columnas en pantallas amplias y una columna apilada con tamaños de accesibilidad.
- Cada campo utiliza la semántica iOS correcta (`name`, `familyName`, `emailAddress`, `newPassword`).
- La contraseña tiene mostrar/ocultar, requisitos visibles solo cuando hacen falta y validación junto al campo.
- El botón primario dice `Continuar`; se bloquea solo mientras falten datos válidos o exista una operación en curso.
- El enlace de inicio de sesión es secundario y no compite con la acción principal.

### Preguntas

- Un `NavigationStack` controla el flujo; cada respuesta es un valor de estado explícito y recuperable.
- Cuatro pasos: objetivo, tiempo disponible, experiencia y conexiones/entrenador opcionales.
- Cada pantalla tiene indicador de progreso, pregunta corta, explicación de una línea y tarjetas seleccionables de al menos 52 pt.
- Los pasos opcionales incluyen `No estoy seguro todavía` o `Ahora no`; ninguna conexión externa bloquea el plan.
- Las respuestas se guardan con la API existente al avanzar de forma segura o en una única confirmación final, evitando estados a medias.
- Errores de red mantienen la respuesta visible, explican el problema en lenguaje simple y permiten reintentar.

### Vídeo de orientación

El vídeo aparece al completar las preguntas y antes del pago. No es obligatorio: el usuario puede omitirlo o verlo más tarde desde Ayuda.

Duración objetivo: **45–60 segundos**, vertical 9:16, exportado en H.264/HEVC a 1080×1920, sin información personal ni sesiones reales de atletas.

Guion:

1. **0–6 s — Bienvenida:** “TriWaveX convierte tus objetivos en un plan que se adapta a tu semana.”
2. **6–18 s — Hoy:** mostrar la sesión recomendada y cómo registrar una actividad.
3. **18–30 s — Progreso:** explicar carga, recuperación y ajustes semanales con visuales simples.
4. **30–42 s — Chat y entrenador:** mostrar preguntas al asistente y la comunicación con entrenador sin revelar conversaciones reales.
5. **42–55 s — Perfil y control:** conectar dispositivos, editar preferencias y gestionar la suscripción.
6. **55–60 s — Cierre:** “Empieza con tu primera sesión.”

Producción recomendada: grabación de simulador con datos ficticios, voz humana o de estudio aprobada, subtítulos incrustados y pista sin copyright. El reproductor nativo usa `AVKit`, respeta silencio/modo de reducción de movimiento y muestra `Omitir`, `Ver de nuevo` y `Empezar a entrenar`.

### Pago

- La pantalla final muestra el plan correspondiente al rol: Atleta (4,99 €/mes) o Entrenador (29,99 €/mes).
- Indica de forma visible `7 días gratis` y `No se cobra hoy`.
- La compra iOS se realiza con StoreKit; la hoja del sistema presenta el precio final localizado y el consentimiento de Apple.
- `Restaurar compras` permanece visible y funcional.
- Tras una compra verificada, `SubscriptionStore` actualiza el acceso local y sincroniza la titularidad con el servidor.
- El extra de capacidad de entrenador se define como producto separado fuera del grupo de suscripciones principales; no se implementa hasta concretar su regla de cobro (por atleta o por bloque).

## Arquitectura y datos

Nuevos límites nativos:

- `RegistrationView` y `RegistrationViewModel`: entrada, validación y llamada a la API de registro.
- `OnboardingFlowView` y `OnboardingDraft`: navegación y respuestas temporales como valores Swift.
- `NativeOnboardingAPI`: adapta las acciones/endpoints web existentes sin duplicar reglas de negocio.
- `OnboardingVideoView`: reproductor AVKit desacoplado; si el recurso no está disponible, no bloquea el avance.
- `NativePaywallView`: consulta productos de `SubscriptionStore`, compra, restaura y expone estados de carga/error.

Las mutaciones de interfaz se mantienen en el actor principal. Las llamadas de red se realizan con `async`/`await`; los datos de perfil y las respuestas se validan de nuevo en servidor. No se almacenan contraseñas, recibos ni claves en `UserDefaults`.

## Estados y errores

- **Sin red:** se explica qué no se pudo guardar y se ofrece reintentar, sin descartar las respuestas.
- **Correo existente:** se enlaza al inicio de sesión y al restablecimiento, sin revelar si otras cuentas usan ese correo más allá de lo imprescindible.
- **Compra pendiente/cancelada:** se mantiene el onboarding y el plan seleccionado; no se concede acceso hasta validar la transacción.
- **Compra restaurada:** se sincroniza la titularidad y se continúa al dashboard.
- **Vídeo no disponible:** se muestra una tarjeta de ayuda estática y el botón para continuar.

## Accesibilidad, privacidad y calidad

- Dynamic Type, VoiceOver, contraste de sistema, objetivos táctiles mínimos de 44 pt y reducción de movimiento.
- No hay emojis como único significado; todos los iconos tienen etiquetas accesibles.
- El vídeo incluye subtítulos y controles del sistema.
- Las analíticas de progreso son opcionales y no incluyen contenido de campos ni identificadores sensibles.
- Las pantallas se verifican en iPhone compacto, grande, modo oscuro y tamaños de texto de accesibilidad.

## Validación

- Pruebas de validación del registro y del borrador de onboarding con Swift Testing.
- Pruebas de estados StoreKit: producto no disponible, prueba, compra correcta, cancelación y restauración.
- Pruebas UI del flujo principal Atleta y Entrenador.
- Revisión manual de VoiceOver, Dynamic Type, estados sin red y el retorno desde la hoja de compra.
- Build de Release y comprobación de que ninguna ruta del onboarding abre una vista web dentro de iOS.
