# Menú More, feedback y Face ID nativos

## Objetivo

Reemplazar el destino inferior actual de Perfil por un acceso `More` compacto de estética iOS. Al abrirlo, el usuario llega a cuatro áreas claras: Perfil, Settings, Privacidad y seguridad, y Feedback. El objetivo es conservar una navegación principal limpia sin esconder funciones importantes en una lista interminable.

## Navegación

El quinto destino del tab bar deja de mostrar `Perfil` y pasa a llamarse `More`, con un icono de puntos/controles. Al tocarlo presenta una hoja nativa desde abajo. La hoja usa fondo material, esquinas continuas y tarjetas grandes, no una copia de una barra de navegación global.

La hoja contiene solo cuatro entradas principales:

1. **Perfil**: identidad deportiva, objetivo, fisiología, lesiones y preparación.
2. **Settings**: Face ID, dispositivos, conexiones, clima y notificaciones.
3. **Privacidad y seguridad**: permisos, datos, suscripción, restaurar compras, cancelar, reembolso, soporte y eliminación de cuenta.
4. **Feedback**: ideas, problemas y mejoras solicitadas por el cliente.

Cada área agrupa las funciones existentes; no se crean accesos duplicados a las mismas pantallas.

## Face ID

Face ID es un bloqueo local opcional de la aplicación, no un mecanismo de alta de cuenta ni una alternativa a Sign in with Apple.

- El interruptor vive en `More > Settings > Seguridad` y está desactivado inicialmente.
- Al activarlo, la app solicita autenticación biométrica con `LocalAuthentication`.
- Al abrir la app o volver desde segundo plano, cuando el bloqueo está activo, la interfaz protegida queda oculta hasta que el usuario se autentica.
- Si Face ID no está disponible, falla o el usuario lo prefiere, el sistema ofrece el código del dispositivo mediante la política de autenticación del propietario.
- Se declara `NSFaceIDUsageDescription` en el `Info.plist` con un texto que explica que solo se usa para proteger el acceso local a TriWaveX.
- La preferencia local no almacena biometría; iOS nunca expone esos datos a TriWaveX.

## Feedback

Feedback abre una pantalla propia, con tres categorías: `Idea`, `Problema` y `Mejorar una función`. El usuario redacta un mensaje y puede incluir opcionalmente la pantalla desde la que lo envía. La aplicación confirma la recepción y permite cancelar antes de enviar.

No se adjuntan automáticamente datos de salud, sesiones, ubicación ni conversaciones. Si en el futuro se pide información diagnóstica, se mostrará una opción explícita y separada.

## Onboarding

El onboarding se mantiene en tres pasos y muestra producto, no una lista de preferencias:

- **Atleta:** `Tu día` → `Tu plan y apoyo` → `More: tu espacio`.
- **Entrenador:** `Tu equipo` → `Invitaciones y solicitudes` → `Planes, chat y More`.

El último paso explica que desde More se gestionan privacidad, dispositivos, seguridad y ayuda. No fuerza Face ID ni permisos de salud durante el tour.

## Errores y accesibilidad

- La hoja More se cierra de forma estándar y todas las tarjetas tienen etiqueta y pista de VoiceOver.
- Si la autenticación local se cancela, la app mantiene la pantalla de bloqueo sin cerrar sesión ni perder datos.
- El formulario de feedback valida mensaje no vacío, muestra el error junto al campo y evita reenvíos mientras está enviando.
- Reducir movimiento elimina rebotes decorativos de la hoja y las tarjetas.

## Verificación

1. Probar More con VoiceOver y Reducir movimiento.
2. Activar Face ID en un iPhone real; bloquear al volver desde segundo plano y usar el código del dispositivo como respaldo.
3. Desactivar Face ID y verificar que no aparece ninguna petición biométrica.
4. Enviar feedback de cada tipo, cancelar un envío y comprobar que no se adjuntan datos privados.
5. Completar el onboarding de atleta y entrenador con cuentas separadas y confirmar que cada paso abre el destino anunciado.
