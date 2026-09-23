# Onboarding SwiftUI, consentimiento de IA y guía obligatoria

## Objetivo

Completar el primer recorrido nativo de TriWaveX conservando el cuestionario profesional existente. Explicar el producto antes del registro y del pago; obtener una decisión explícita antes de enviar datos a proveedores de IA; y enseñar la navegación esencial tras una compra verificada. Evitar que se muestre una pantalla, secuencia de marca u onboarding antiguo durante el arranque o una transición.

## Experiencia y orden

1. **Cuestionario previo a la cuenta (atleta nuevo).** Reutilizar `NativeAthleteOnboardingView`, sus preguntas, ritmo, jerarquía, colores, superficies, márgenes, tipografía y `TriWaveXPrimaryButtonStyle`. No crear un segundo cuestionario ni reemplazar la interfaz profesional aprobada. Integrar explicaciones breves en contexto: el plan se adapta al objetivo y disponibilidad; se puede buscar un entrenador; dónde se gestionan el plan, la cuenta y la suscripción. La propuesta anterior al registro es orientativa y nunca debe presentarse como plan generado/guardado.
2. **Cuenta e inicio de sesión.** Mantener Apple, Google y correo solo donde sus integraciones estén configuradas y verificadas. La cuenta permite asociar onboarding, consentimiento, historial y compra. Los usuarios que regresan deben llegar directamente a su ruta actual, sin ver preguntas de alta.
3. **Datos posteriores a autenticación y compra.** Continuar el onboarding autenticado actual, con datos sensibles de salud separados y consentimiento contextual. Mostrar precio, periodo, renovación, prueba si corresponde, restauración, condiciones y enlaces legales reales en el checkout existente de StoreKit. No duplicar precios ni simular compras.
4. **Guía obligatoria de navegación.** Después de una transacción StoreKit verificada y reconocida por servidor, presentar la guía nativa ya existente, adaptada a una interacción breve y práctica. La primera versión cubre `Hoy`, `Plan`, `Apoyo` (entrenador/Chat/IA) y `More` (cuenta, privacidad, suscripción, ayuda y feedback). No hay botón de omitir; cada paso ofrece una acción de reconocimiento/visita, guarda progreso y permite reanudar tras cerrar/background. No solicita una reseña para desbloquear la app. Una caída de red no debe impedir finalizar una guía cuyos destinos son locales o tienen un fallback explicativo.
5. **Consentimiento de IA antes del primer envío.** La pantalla aparece una vez que existe una cuenta y antes de cualquier petición que envíe datos a IA; si una fase de onboarding fuera a llamar a IA, se antepone a esa llamada. La acción positiva es un control deslizante nativo `Desliza para permitir IA`; la alternativa visible es `Continuar sin IA`. Deslizar es consentimiento afirmativo, no una firma manuscrita ni un gesto genérico para aceptar todos los términos. Rechazar no bloquea las funciones no-IA; el cliente no emite peticiones de IA para esa cuenta hasta permiso vigente.

## Diseño nativo

- SwiftUI end-to-end para las pantallas añadidas y transiciones; no se introduce una WebView para el consentimiento, cuestionario o guía.
- Mantener el lenguaje de `TriWaveXDesignSystem`: paleta semántica/acento actual, superficies del sistema, radios continuos, espaciado y tipos existentes; botones principales/secundarios compartidos, objetivos táctiles accesibles y `Dynamic Type`.
- El slider tiene estados accesibles equivalentes para VoiceOver y una alternativa operable con teclado/puntero; Reduce Motion evita desplazamientos decorativos. El estado de consentimiento cambia solo al confirmar el final del gesto.
- Movimiento corto y coherente con `TriWaveXMotion`; transiciones de entrada no deben revelar contenido anterior durante ni un frame.

## Consentimiento y tratamiento de IA

- Reutilizar el control servidor de `ai_consents` y la verificación de `authorizeAIRequest`; renovar consentimiento cuando cambie materialmente la divulgación/modelos. La persistencia registra usuario, decisión, versión del aviso y fecha; no almacenar una imagen de firma ni datos biométricos.
- La divulgación muestra proveedores/modelos realmente activos en esa versión, clases de datos enviadas (texto escrito, contexto de entrenamiento/recuperación u otros solo si se usan de verdad), finalidad, advertencia de errores, posibilidad de retirar consentimiento y enlace a política. Las regiones, conservación y reutilización por proveedores no se afirmarán hasta verificarlas con configuración y contratos reales; no se inventarán.
- Retirar consentimiento bloquea futuras peticiones y deja claro que no revierte datos ya recibidos por un proveedor. La opción de rechazo permanece disponible desde el primer aviso y Settings.
- La clasificación IA del tablón comunitario no queda cubierta por defecto si implica otro propósito o envío de texto libre; requiere divulgación y consentimiento aplicables antes de procesar ese contenido.

## Documentos de Apple y del usuario

- Dentro de la app: enlaces visibles a Política de privacidad, Términos/condiciones, información de IA y gestión de consentimiento; enlaces de facturación/cancelación desde la pantalla de compra y desde `More` según el flujo real.
- En App Store Connect/desarrollo: revisar App Privacy, Privacy Manifest y reporte agregado de SDK, privacidad de terceros, clasificación por edad, export compliance y metadatos de suscripción. Estos elementos no se sustituyen por una pantalla de aceptación del usuario.
- Las afirmaciones legales deben coincidir con el responsable y domicilio reales, proveedores, regiones, usos y retención efectivos. Si faltan esos datos, la pantalla debe señalarlos como pendiente de completar antes del lanzamiento, no aparentar una conformidad certificada.

## Arranque y animaciones heredadas

- Diagnosticar el destello con el estado de `RootView`, restauración de sesión, preferencias persistidas, identificador/versión de onboarding y rutas de retorno OAuth/StoreKit antes de modificar animaciones.
- Elegir una única pantalla estable después de resolver restauración y destino. No renderizar temporalmente login, bienvenida antigua, onboarding web heredado ni una ruta anterior mientras llega el destino nuevo.
- Conservar solo animaciones de marca que sean deliberadas y actuales; inicializar su estado antes del primer frame para usuarios nuevos y recurrentes. Respetar Reduce Motion.

## Feedback comunitario (fase separada)

El tablón público es una superficie y modelo de datos independiente del feedback privado existente. Las aportaciones históricas privadas no se hacen públicas. Las nuevas publicaciones requieren opt-in de publicación claro, se muestran sin identidad personal por defecto y pasan comprobación de datos personales/salud, filtros de seguridad y revisión antes de ser visibles. La IA propone una categoría de producto (p. ej. Hoy, Plan, Entrenadores, Cuenta, Pago, Integraciones, UX) pero no publica ni decide sanciones automáticamente. El usuario puede editar/cancelar, denunciar contenido y solicitar eliminación. Esta fase requiere su propio diseño de RLS, retención, moderación, APIs y pruebas.

## Fallos y recuperación

- Error de autenticación: conservar únicamente preferencias locales no sensibles; nunca persistir contraseñas ni respuestas de salud preautenticación.
- Error de guardado del consentimiento: no enviar a IA y ofrecer reintento o seguir sin IA.
- Error/compra pendiente/no verificada: no mostrar guía de post-compra ni simular acceso; conservar el estado de StoreKit y permitir reintentar/restaurar según implementación existente.
- Interrupción de guía: reanudar en un límite de paso, sin repetir una pantalla antigua ni accionar en nombre del usuario.
- Retorno OAuth o de StoreKit: resolver la sesión y destino confirmado antes de dibujar la pantalla de contenido, sin destello transitorio.

## Verificación y criterios de aceptación

- Pruebas de modelo: orden de pre-onboarding → registro → onboarding autenticado → checkout, guía obligatoria/versionada y progreso, consentir/denegar/revocar, y bloqueo servidor sin consentimiento o con versión caducada.
- UI/simulador: Dynamic Type, VoiceOver, Reduce Motion, modo claro/oscuro, cancelación de compra, restauración, offline, reanudación, usuarios nuevo y recurrente, Apple/Google/email y retorno de autenticación.
- Animación: capturar primera aparición desde instalación limpia, actualización desde la versión anterior, relanzamiento, sesión restaurada, callback OAuth/StoreKit y Reduce Motion; ninguna captura muestra el onboarding o estado de marca heredado en un frame.
- Validar el Privacy Manifest y App Privacy contra el reporte del archivo Xcode y los SDK reales; revisar enlaces legales y datos comerciales pendientes por separado.
- No declarar TestFlight/producción listo sin prueba en dispositivo, firma/archivo, configuración real de proveedores y compra, ni cierre de los pendientes legales y de privacidad.

## Fuera de alcance de la primera implementación

- Rediseñar el cuestionario profesional existente o cambiar el sitio web.
- Cambiar productos, precios, elegibilidad o mecánica de StoreKit.
- Exponer feedback privado histórico o desplegar la fase de tablón público antes de aprobar y verificar su diseño de privacidad/moderación.
- Añadir IA a generación de planes sin consentimiento vigente o alterar recomendaciones deportivas.
