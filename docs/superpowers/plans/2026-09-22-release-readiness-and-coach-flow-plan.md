# Plan de cierre: App Review, suscripciones y flujo entrenador–atleta

## Resultado buscado

Dejar TriWaveX lista para una revisión real de Apple, con pago StoreKit claro y seguro, soporte visible, derechos del usuario completos y un vínculo entrenador–atleta explicable, consentido y auditable.

## Fase 0 — Evidencia y configuración de producción

### Fuentes verificadas

- [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/): 1.2, 1.5, 2.1, 3.1.1, 3.1.2, 5.1.1 y 5.1.2.
- [Account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app).
- [App Store Server Notifications](https://developer.apple.com/documentation/AppStoreServerNotifications/notificationType).
- Implementación actual: `ios/TriWaveX/SubscriptionStore.swift`, `app/api/native/apple/transaction/route.ts`, `app/api/apple/notifications/route.ts`, `ios/TriWaveX/AccountSettingsView.swift` y `app/soporte/page.tsx`.

### Checklist manual obligatorio

1. Verificar en App Store Connect los dos productos, sus precios actuales, periodo mensual y prueba de siete días.
2. Verificar URL y producción de App Store Server Notifications V2 con una compra sandbox/TestFlight.
3. Verificar las variables de producción de Vercel para la reconciliación de Apple, soporte y correo.
4. Probar en un iPhone real: compra, cancelación, restauración, expiración y reembolso sandbox.
5. Completar App Privacy con el inventario real de identidad, salud, fitness, mensajes y ubicación.

No se declarará que está “perfecta para publicar” antes de completar esta evidencia externa.

## Fase 1 — Pago y derechos del usuario

### Implementar

1. Aplicar el componente `SlideToConfirm` aprobado en `NativePaymentReviewView` de `ios/TriWaveX/SubscriptionStore.swift`. Conserva `Product.purchase` como única acción de cobro y bloquea dobles intentos.
2. Crear una ayuda de suscripción única en la app y en `app/soporte/page.tsx`: restaurar, gestionar/cancelar en Apple, pedir reembolso a Apple y contacto humano.
3. Mejorar la eliminación de cuenta: avisar que borrar la cuenta no cancela Apple, mostrar “Gestionar suscripción con Apple” y ofrecer eliminación inmediata cuando sea legalmente posible, además de la opción programada.
4. Completar la reconciliación de eventos de Apple: renovación, fallo, grace period, revocación, reembolso y sus solicitudes asociadas, sin resucitar acceso con eventos antiguos.
5. Revisar textos de términos y privacidad: canal Apple/web, prueba, renovación, cancelación, reembolso y soporte.

### Guardas

- No usar Stripe ni PassKit para acceso digital comprado dentro de iOS.
- El slide se describe como “continuar”, nunca como pago ya completado.
- `transaction.finish()` permanece después de validar y conciliar la transacción.

### Verificación

- Compra cancelada, compra completada, restauración, reembolso y revocación actualizan el acceso correctamente.
- VoiceOver puede confirmar el pago sin arrastrar y Reducir movimiento no rompe el control.
- Un usuario con suscripción activa recibe una advertencia clara al iniciar el borrado de cuenta.

## Fase 2 — Vínculo atleta–entrenador y comunicación

### Implementar

1. Añadir una solicitud de entrenador: el atleta elige entrenador, ve exactamente qué comparte, añade objetivo, horas disponibles y mensaje opcional; lesiones y datos de salud no se comparten sin permiso explícito.
2. Crear estados `pending`, `accepted`, `declined` y un registro de auditoría. El entrenador recibe una notificación y puede aceptar o declinar antes de acceder a los datos del atleta.
3. Al aceptar, avisar a ambos, mostrar un onboarding específico para cada rol y abrir el chat solo cuando la relación esté activa.
4. Ampliar las solicitudes de cambio de plan con motivo libre. El entrenador puede aprobar, rechazar o proponer una alternativa; el atleta recibe el resultado y conserva el historial.
5. Para un cambio completo de plan por el entrenador, mostrar previsualización, confirmar la sustitución, guardar versión/registro y avisar al atleta. Nunca borrar su calendario antes de validar que el nuevo plan se ha creado correctamente.
6. Añadir al chat nativo bloqueo y reporte, igual que en web, y un centro de notificaciones. Las notificaciones nativas se diseñan con APNs; mientras tanto no se promete un aviso inmediato fuera de la app.

### Guardas

- Todas las consultas y acciones comprueban relación activa, no solo coincidencia de IDs.
- El entrenador no ve datos antes de aceptación del atleta.
- El chat sigue siendo 1:1 hasta que se diseñe explícitamente una función de grupos.

### Verificación

- Solicitud, aceptación, rechazo y cancelación mantienen RLS, roster y perfil consistentes.
- Las solicitudes de ajuste y reemplazo generan un evento, una notificación y una respuesta visible para ambos.
- Reintentos no duplican mensajes, planes ni relaciones.

## Fase 3 — Descuentos compatibles con Apple

### Implementar

1. Mantener el panel privado de campañas como registro de administración.
2. Crear tres campañas iniciales: `25%`, `50%` y `100%`, para atleta y entrenador, con fecha, límite y estado.
3. Para iOS, ligar cada campaña a una oferta promocional u offer code creado en App Store Connect. TriWaveX solo almacena su referencia y verifica el entitlement final de Apple.
4. Añadir flujo de canje que no altere localmente el precio ni conceda premium por un código propio.
5. Alinear los precios web visibles con los precios reales definidos para Stripe, sin mezclar el canal Apple con el web.

### Guardas

- No entregar una suscripción iOS de pago con un código privado de base de datos.
- El descuento del 100% se configura como oferta de Apple o acceso promocional legalmente definido, nunca como bypass de StoreKit.

### Verificación

- Límite de usos, fechas y estado de campaña se respetan.
- Un cupón inválido o agotado no cambia el acceso.
- Una compra con oferta se reconcilia como cualquier otra transacción de Apple.

## Fase 4 — Revisión final de publicación

1. Ejecutar pruebas web, build iOS y pruebas StoreKit sandbox.
2. Comprobar navegación para todos los extremos: soporte, privacidad, términos, restaurar, gestionar/cancelar, reembolso y borrar cuenta.
3. Probar los dos roles en dispositivos reales y cuentas separadas.
4. Preparar notas para App Review con productos, flujo del slide, cuenta demo, ruta de restauración y detalles del backend de transacciones.
5. Revisar los errores y vacíos de UX, no solo casos felices.

## Estado actual

- Pruebas web: 50 archivos y 288 pruebas superadas el 22 de septiembre de 2026.
- StoreKit 2, restauración, cancelación y reconciliación JWS ya existen.
- Faltan cierre UX/legal de reembolso y borrado de cuenta, ofertas reales de Apple, solicitud explícita atleta→entrenador, notificaciones nativas y confirmación externa de App Store Connect/TestFlight.
