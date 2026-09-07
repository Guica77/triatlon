# Lista de publicación

Estado inicial: bloqueada. Marcar únicamente tras aportar evidencia.

## Producto y seguridad

- [ ] Cerrar A01–A11 de la auditoría, verificar permisos reales y resolver avisos de dependencias.
- [ ] Definir funciones de la primera versión; retirar demos, botones sin efecto e integraciones no operativas.
- [ ] Confirmar si el acceso será gratuito o con pago y reflejarlo coherentemente en app, web, términos y Apple.
- [ ] Habilitar y probar acceso con Apple si se mantiene acceso Google y no aplica una excepción de 4.8.
- [ ] Probar eliminación completa de cuenta y revocación Apple, también con sesión antigua.
- [ ] Implementar consentimiento de IA y tratamiento de datos sensibles.
- [ ] Resolver soporte real y controles de chat necesarios.

## iOS

- [ ] Cuenta Apple Developer activa; equipo y certificados bajo control del titular.
- [ ] Bundle ID definitivo, versión comercial y número de build únicos.
- [ ] Cliente iOS y archivo de distribución válido, compilado con Xcode 26 o posterior / SDK iOS 26 o posterior según requisitos vigentes.
- [ ] Configurar firma, capabilities, enlaces de retorno OAuth y permisos mínimos.
- [ ] Inventario del binario/SDK y manifiestos de privacidad; no copiar declaraciones no verificadas.
- [ ] Resolver experiencia de notificaciones nativas si se ofrece; el web push actual no prueba ese soporte.
- [ ] Probar almacenamiento seguro de sesión, cancelación OAuth, redirecciones, descargas CSV/calendario y cierre de sesión.
- [ ] Validación de archivo y carga TestFlight sin errores de distribución.

## Documentos y App Store Connect

- [ ] Completar datos del titular, fiscalidad/acuerdos cuando proceda y estado comercial DSA.
- [ ] Publicar política y soporte en URLs HTTPS reales, sin inicio de sesión.
- [ ] Comprobar esas URLs desde un dispositivo ajeno y confirmar recepción de consulta de soporte.
- [ ] Rellenar nombre/subtítulo/descripción/keywords en español según documento 03.
- [ ] Declarar tipos de datos, finalidad, vinculación y tracking sobre prácticas reales.
- [ ] Completar cuestionario actualizado de edad; no asignar una edad arbitraria.
- [ ] Resolver cifrado/exportación y derechos de contenidos, marcas, imágenes y servicios externos.
- [ ] Adjuntar capturas reales del build y el icono final; incluir iPad si se distribuye para iPad.
- [ ] Crear cuentas sintéticas para revisor, incluir instrucciones y contacto operativo.
- [ ] Si hay compras: productos, precios, localizaciones, capturas de revisión, restauración y validación servidor.

## Envío

1. Subir el archivo validado y esperar a que Apple termine de procesarlo.
2. Completar TestFlight y superar el plan de pruebas del documento 10.
3. Seleccionar el build probado en la versión de App Store Connect.
4. Rellenar privacidad, edad, disponibilidad, precio y notas de revisión.
5. Revisar que no haya `PENDIENTE` ni funciones simuladas en el material enviado.
6. Elegir publicación manual como propuesta inicial, para controlar el momento de apertura.
7. Enviar a revisión cuando esté todo validado; responder con hechos a cualquier incidencia.

Fuentes: [envío a App Store](https://developer.apple.com/app-store/submitting/) y [requisitos SDK](https://developer.apple.com/news/?id=ueeok6yw).
