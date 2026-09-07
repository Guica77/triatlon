# Preparación técnica iOS y decisiones de cumplimiento

## Cliente y arquitectura

La base actual es Next.js con rutas de servidor, Server Actions y Supabase. No puede convertirse en un paquete estático iOS conservando automáticamente todas esas funciones. Mantener el servidor y construir un cliente iOS requiere decidir autenticación, API, sesión, enlaces de retorno, descargas y notificaciones.

No se ha elegido automáticamente Capacitor, Expo o Swift ni añadido un proyecto incompleto. El cliente debe conservar valor real de uso móvil y verificarse frente a los requisitos de Apple. Un simple acceso a una web no garantiza admisión.

## SDK y archivo

Desde el 28 de abril de 2026 se exige SDK iOS/iPadOS 26 o posterior para envíos iOS/iPadOS. Usar Xcode compatible, firma del equipo correcto, versión/build y Bundle ID definitivos. Este requisito no fija por sí mismo la versión mínima de iOS que soportará la app.

## Manifiesto de privacidad y permisos

No se ha creado `PrivacyInfo.xcprivacy` vacío: faltan cliente y SDK nativos sobre los que declarar usos reales. Al construir el cliente:

1. Inventariar frameworks y SDK incluidos, sus versiones, firmas y manifiestos exigidos.
2. Revisar APIs con motivos obligatorios y seleccionar solo motivos que describan el uso real.
3. Generar y revisar el informe agregado de privacidad del archivo Xcode.
4. Mantener el manifiesto, la ficha de datos de Apple y la política coherentes. Son piezas distintas.
5. Configurar solo permisos necesarios. No añadir permisos de salud, cámara, micrófono o ubicación por si acaso.

El código web no demuestra una integración HealthKit. Si se añade, revisar permisos de lectura/escritura, textos de finalidad y usos permitidos. Los textos de permisos deben mencionar funciones implementadas, no objetivos futuros.

## Cifrado y exportación

La app usa servicios HTTPS, pero no existe un binario nativo que permita cerrar la evaluación de cifrado. El cifrado del sistema para conexiones HTTPS suele poder quedar exento de aportar documentación, según la guía de Apple; deben revisarse todos los SDK y cualquier criptografía adicional.

PENDIENTE: responder cuestionario con el archivo real, establecer `ITSAppUsesNonExemptEncryption` conforme al resultado y aportar documentos si Apple los requiere. No se ha asignado `false` automáticamente ni redactado una certificación de exportación ficticia.

## Acceso y borrado Apple

Existe código de entrada Apple y un flujo de eliminación. Probar configuración del proveedor, identificadores coherentes, retorno al cliente, correo privado y renovaciones. La revocación depende hoy de tokens de sesión que pueden no estar disponibles después; cerrar A09 antes del envío.

## Compras

No existe implementación verificada de StoreKit/recibos en este proyecto. La activación actual es simulada.

Decisión pendiente: distribución gratuita, suscripción digital o servicio personal con un entrenador. No asumir que todos los modelos tienen la misma excepción. Si se venden funciones digitales, resolver las reglas de compra aplicables al servicio y los territorios. Separar claramente servicios personales en tiempo real, contenido digital y licencias de equipo si se ofrecen.

Para suscripciones, prever restauración, derechos en servidor, notificaciones de cambios, cancelación, reembolsos y textos de precio/periodo. No almacenar datos de tarjetas en una pasarela ficticia.

## Edad, contenidos y derechos

Responder el cuestionario de edad sobre chat, contenido generado por usuarios, IA y contenido de bienestar reales. No prometer una clasificación 4+ ni usar «para todos» sin evaluarlo. Comprobar la audiencia contractual y los datos de menores por separado.

Inventariar licencias de imágenes, ejercicios, fuentes y bibliotecas. Verificar términos y autorización de proveedores deportivos, especialmente del acceso no oficial a Garmin; no inferir permiso de distribución por la existencia de una biblioteca técnica.

## Datos comerciales UE

Declarar la condición de comerciante según la actividad real. Apple requiere datos de contacto públicos y su verificación cuando corresponda. Completar acuerdos, fiscalidad y banco si el modelo lo necesita; estos documentos los aporta el titular en Apple, no se sustituyen por un archivo generado.

Referencias: [SDK](https://developer.apple.com/news/?id=ueeok6yw), [privacidad de SDK](https://developer.apple.com/support/third-party-SDK-requirements/), [exportación](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance), [DSA](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/).
