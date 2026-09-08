# Cliente iOS: primer incremento

8 de septiembre de 2026. El usuario aprobó SwiftUI con reutilización de Next.js y continuidad de la web.

## Implementado

- Proyecto Xcode real en `ios/TriWaveX.xcodeproj`, Swift 6, aislamiento MainActor, iPhone desde iOS 17.
- Acceso SwiftUI con correo/contraseña. POST HTTPS sin reenvío de credenciales por redirecciones; sin credenciales en URLs ni almacenamiento de contraseñas.
- Endpoint `/api/native/session`: autenticación Supabase, destino según perfil verificado, respuestas sin tokens ni datos personales, no-cache y rechazo de peticiones de otros orígenes.
- Cookies de sesión transferidas a WKWebView. Navegación nativa, secciones web existentes, vuelta atrás, recarga, errores recuperables y control del origen permitido. Navegación web independiente conservada.
- Privacidad y soporte accesibles antes del login.

## Evidencia

- Compilación Debug arm64 para iPhone con SDK iOS 26.5 y firma desactivada: correcta.
- Cinco pruebas del endpoint: correctas. TypeScript sin errores.
- Simulador bloqueado por incompatibilidad de CoreSimulator: instalado 1051.54.0; Xcode requiere 1051.55.0. No hay evidencia visual ni de login real en dispositivo.

## Siguiente trabajo, todavía abierto

1. Origen HTTPS de staging y producción verificados. Debug apunta a `staging.triwavex.com`; Release apunta a `app.triwavex.com`. A fecha de esta actualización los tres dominios previstos (`triwavex.com`, `app` y `staging`) no resuelven desde este equipo, por lo que no hay evidencia de HTTPS o despliegue.
2. Identidad Apple del titular: Bundle ID definitivo, equipo y capacidades. `dev.triwavex.preview` es solo un identificador de desarrollo, no una decisión de publicación.
3. Completar Apple/Google y Strava con AuthenticationServices, retorno validado y sesión sincronizada. El incremento actual soporta correo; no declarar OAuth nativo terminado.
4. Restauración nativa de sesión, expiración y cierre/borrado coordinados. WebKit conserva cookies, pero la pantalla SwiftUI aún solicita login al arrancar.
5. APNs: registro/revocación por dispositivo, entrega desde servidor y pruebas de denegación. No se ha pedido permiso ni simulado entrega.
6. Descargas/exportación, pestañas ante navegación SPA, teclado, accesibilidad, suspensión y pruebas en dispositivo.
7. Ajustes críticos e integraciones nativos, inventario de privacidad/manifiesto final, iconos, firma, archivo y TestFlight.

No es una versión lista para App Store. No se ha desplegado el endpoint ni tocado bases de datos remotas. Los cambios preexistentes de selección de planes se han conservado.
