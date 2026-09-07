# Triatlón Pro · Preparación de App Store

Revisión: 7 de septiembre de 2026. Código base de la app: `2acfe67`.

**Dictamen actualizado: todavía no enviar a App Review.** Se han corregido problemas de seguridad y funciones simuladas en local. La aplicación supera 167 pruebas. Falta aplicar las migraciones y desplegar las correcciones, completar datos del titular y preparar el cliente iOS. Consulta [Correcciones y puesta en marcha](14-correcciones-y-puesta-en-marcha.md).

Este paquete reúne los documentos que se pueden preparar con el código disponible. Los campos `PENDIENTE` necesitan información del titular o validación del producto final. Los borradores legales no deben publicarse hasta completar esos campos y ajustar el funcionamiento real. Apple decide la aceptación; estos documentos no la garantizan.

## Documentos

| Archivo | Uso | Estado |
| --- | --- | --- |
| [01 · Auditoría](01-auditoria.md) | Problemas, pruebas y prioridades | Revisión local realizada |
| [02 · Lista de publicación](02-checklist-publicacion.md) | Preparación técnica y envío | Pendiente de ejecución iOS |
| [03 · Ficha en español](03-ficha-app-store-es.md) | Nombre, descripción, palabras clave y campos de Apple | Borrador ajustado al producto |
| [04 · Notas para Apple](04-notas-app-review.md) | Acceso e instrucciones para revisión | Faltan build y cuentas de prueba |
| [05 · Política de privacidad](05-politica-privacidad.md) | Texto para web y aplicación | Borrador con datos pendientes |
| [06 · Declaración de datos](06-app-privacy.md) | Responder App Privacy en App Store Connect | Inventario provisional |
| [07 · Términos y licencia](07-terminos-servicio.md) | Condiciones de uso y decisión EULA | Borrador con modelo comercial pendiente |
| [08 · Soporte y eliminación](08-soporte-eliminacion.md) | Texto público y procedimiento interno | Canal de soporte por confirmar |
| [09 · Capturas y recursos](09-capturas-recursos.md) | Guion y requisitos de imágenes | Capturas iOS pendientes |
| [10 · TestFlight y pruebas](10-testflight-pruebas.md) | Plan de aceptación y texto para testers | Dispositivos/cuentas pendientes |
| [11 · Datos del titular](11-datos-titular.md) | Información que solo puede aportar el propietario | Pendiente |
| [12 · Privacidad técnica y cumplimiento](12-ios-cumplimiento.md) | SDK, manifiestos, cifrado, edad y pagos | Evaluación del binario pendiente |
| [13 · Fuentes oficiales](13-fuentes.md) | Documentación consultada | Consultada el 07/09/2026 |
| [Evidencias](evidencias/) | Resultados de las comprobaciones locales | Sin credenciales |

## Orden recomendado

1. Ensayar y desplegar las correcciones siguiendo el documento 14.
2. Decidir alcance gratuito o de pago y qué integraciones se entregarán realmente.
3. Preparar cliente iOS, privacidad efectiva, soporte real y beta de TestFlight.
4. Completar datos legales, probar el producto en dispositivos, capturar pantallas y rellenar App Store Connect.
5. Enviar únicamente cuando todos los bloqueos estén cerrados con evidencia.

Se han creado documentos y corregido código local. No se han aplicado migraciones remotas, desplegado los cambios ni enviado una versión a Apple. El informe de 4 de septiembre contiene estados históricos y contradicciones sobre eliminación de cuentas: esta revisión confirma que **sí existe** el botón de borrado, aunque falta robustecer y validar el proceso completo.
