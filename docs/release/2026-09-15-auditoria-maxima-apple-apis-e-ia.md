# Auditoría máxima de lanzamiento: Apple, APIs e IA

Fecha: 16 de septiembre de 2026. Alcance: revisión estática del repositorio, compilación Release sin firma y configuración visible localmente. No sustituye pruebas con cuentas reales, revisión de Apple ni una auditoría de seguridad independiente.

## Veredicto

**No subir hoy a App Store.** La Release de iPhone compila y los controles automáticos están limpios, pero aún faltan pagos reales, comprobación en dispositivos y configuración de distribución. Publicar antes de cerrar los bloqueos podría provocar rechazo, acceso incorrecto o declaraciones de privacidad inexactas.

## Evidencia de esta revisión

- `xcodebuild` de la configuración **Release** para iPhone: correcto (sin firma de distribución).
- Pruebas web: 48 archivos y 278 pruebas, correctas.
- Lint, comprobación de TypeScript y análisis sintáctico Swift: correctos.
- Se añadió `PrivacyInfo.xcprivacy` al objetivo iOS; declara los datos de cuenta, salud/forma física y contenido de chat usados por la app. Debe compararse una última vez con el binario final y los SDK de producción antes de enviar.
- Se corrigió un error de compilación de Perfil y la sesión nativa de Chat reutiliza las cookies de la sesión WebKit, evitando que la conversación nativa pierda la autenticación tras iniciar sesión.

## Estado de conectores

| Conector | Estado real | Qué funciona | Qué falta antes de prometerlo |
| --- | --- | --- | --- |
| Strava | Implementado | OAuth y sincronización de datos disponibles según autorización | Prueba completa de producción y webhooks con usuarios reales |
| Polar | Implementado con credenciales configuradas | Autorización desde ajustes/onboarding | Prueba de importación y revocación en producción |
| COROS | OAuth preparado | Autorización del usuario y base de conexión | Aprobación de partner para datos finales y/o envío de sesiones |
| Suunto | Solicitud enviada | Estado pendiente y alternativa Strava | Aprobación, credenciales OAuth y pruebas de datos |
| Amazfit / Zepp | Solicitud enviada el 15/09 | Estado pendiente | Respuesta de Zepp, contrato/credenciales y API de datos |
| Garmin | Bloqueado externamente | No se finge conexión | Garmin pausó nuevas aprobaciones; no prometer sincronización ni envío |
| Apple Health | Parcial, iPhone | Sueño, HRV y pulso en reposo mediante HealthKit | Autorización real, prueba en dispositivo y declaración de privacidad; no afirmar importación de entrenamientos |
| Bluetooth FC | Base nativa | Servicio de frecuencia cardíaca en iOS | Pruebas con periféricos, permiso y manejo de reconexión |

## Funciones que deben verificarse pantalla por pantalla

La interfaz tiene muchas acciones reales, pero una revisión visual no prueba datos ni navegación. Antes de lanzamiento hay que recorrer como atleta, entrenador y administrador:

1. Registro, Apple/Google/correo, recuperación y cierre de sesión.
2. Onboarding, objetivo, calendario, conexión de dispositivos y persistencia después de cerrar la app.
3. Plan: mover sesiones, propuestas inteligentes, conflictos, notificaciones y deshacer.
4. Entrenamiento: detalle, completar, feedback, exportación y comportamiento sin red.
5. Perfil y ajustes: dispositivos, privacidad, IA, borrado a 30 días y restauración de sesión.
6. Entrenador: invitación, alta/baja de atleta, control del plan, chat, grupos y límite de plazas.
7. Errores, carga, teclado, VoiceOver, texto grande, modo oscuro y orientación.

Los avisos mediante `alert()` y varios detalles de analítica deben sustituirse o validarse como estados nativos coherentes antes de llamar a toda la experiencia "nivel Apple".

## Bloqueos de App Store

- [ ] Compilar Archive Release **firmado** y probarlo en iPhone físico y TestFlight.
- [x] Crear `PrivacyInfo.xcprivacy`; revisar el manifest final contra el binario y SDK realmente incluidos.
- [ ] Completar App Privacy con datos de cuenta, salud/forma física, actividad, mensajes, diagnósticos y proveedores reales.
- [ ] Confirmar propósito y textos de HealthKit, Bluetooth, notificaciones y cualquier otro permiso usado.
- [ ] Preparar icono final, capturas reales, URL pública de soporte y política de privacidad sin iniciar sesión.
- [ ] Mantener cuentas sintéticas y notas claras para App Review.
- [ ] Ejecutar prueba de eliminación, revocación Apple y recuperación con sesión antigua.
- [ ] Configurar compras con StoreKit, restauración y validación de servidor antes de activar precios o una prueba real en iOS.
- [ ] Validar que todas las declaraciones de integraciones coinciden con el estado de la tabla anterior.

Apple requiere que las prácticas de privacidad declaradas sean exactas y cubran también a proveedores terceros; los manifests de privacidad documentan datos y APIs de razón requerida. Referencias: [App Privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy), [privacy manifests](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files) y [revisión](https://developer.apple.com/app-store/review/guidelines/).

## IA: funcionamiento y límites

La IA se usa para contextualizar orientación deportiva, resumir entrenamiento y proponer ajustes. Para atletas sin entrenador puede generar propuestas que **nunca cambian el plan sin confirmación**. Si existe entrenador activo, el entrenador controla el plan: la IA no lo modifica por encima de su criterio.

Los datos necesarios para la respuesta se reducen al contexto deportivo pertinente. La app debe solicitar y guardar consentimiento específico antes de enviar información personal a un proveedor de IA, explicar el proveedor y permitir retirar el consentimiento. Se debe mantener trazabilidad de propuestas, confirmaciones y rechazos, con límites de uso para proteger tanto costes como abuso.

La IA no diagnostica enfermedades ni sustituye a un médico, fisioterapeuta ni entrenador. Las alertas de recuperación deben expresarse como orientación, con rutas claras para consultar a profesionales ante síntomas, dolor o riesgo.

## Plan de cierre por orden

1. Implementar derechos de acceso y compras multiplataforma según la especificación de suscripciones.
2. Ejecutar matriz manual de botones y recorridos en web e iPhone, registrar evidencia y corregir fallos.
3. Configurar privacidad, permisos, StoreKit, notificaciones y variables de producción.
4. Archive/TestFlight y prueba con cuentas reales de atleta, entrenador y revisora.
5. Preparar la ficha, capturas, notas de revisión y enviar solo el build probado.
