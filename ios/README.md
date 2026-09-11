# TriWaveX iOS

Cliente SwiftUI con vistas WKWebView para el producto Next.js existente. La web sigue funcionando por separado.

Abrir `TriWaveX.xcodeproj` con Xcode 26. Debug y Release usan `https://app.triwavex.com`, el despliegue publicado de la app. Seleccionar el equipo Apple y sustituir `dev.triwavex.preview` por el Bundle ID del titular antes de distribuir. No hay secretos dentro del proyecto.

El primer incremento incluye acceso con correo, navegación nativa, sesión de WebKit, recuperación de errores y enlaces externos en el navegador del sistema. El servidor valida al usuario y decide el destino según su perfil. Las credenciales viajan en un POST HTTPS y no se guardan; las cookies se instalan directamente en WebKit, sin pasarlas por JavaScript ni URLs.

Pendiente antes de TestFlight: Apple/Google con AuthenticationServices y retorno verificado, APNs real (el web push existente no equivale a APNs), persistencia adicional en Keychain si se introducen tokens nativos, exportaciones/descargas, manifisto de privacidad auditado, iconos y firma definitiva. Actualmente el acceso es con correo; esto no se presenta como el alcance final aprobado.

Pruebas de aceptación: correo correcto/incorrecto, atleta nuevo/entrenador, sesión caducada, cierre y reapertura, navegación y vuelta atrás, pérdida de red/reintento, dominio externo, privacidad/soporte sin sesión, borrado desde Ajustes, VoiceOver y tamaños de texto. Probar con cuentas sintéticas en staging. No se ha desplegado ni aplicado ninguna migración de producción.
