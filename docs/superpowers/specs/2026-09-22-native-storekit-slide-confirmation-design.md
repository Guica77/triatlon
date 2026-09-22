# Confirmación deslizante nativa para suscripciones

## Objetivo

Sustituir el botón de confirmación previo a la compra por un control SwiftUI de deslizamiento, con aspecto y respuesta propios de iOS. El gesto evita toques accidentales y deja claro que la compra todavía será autorizada por Apple.

El alcance de esta entrega es únicamente la confirmación previa a la suscripción. El dock de Ajustes/Compartir y la pantalla diaria de entrenamientos son trabajos independientes y no se modifican aquí.

## Experiencia

La hoja de revisión de la suscripción conserva el plan, precio y la prueba gratuita. En lugar de un botón, muestra una pista con el texto:

- `Desliza para empezar 7 días gratis` para ofertas introductorias.
- `Desliza para confirmar` para el resto de casos.

El usuario arrastra el control circular de izquierda a derecha. El control sigue el dedo con límites definidos por la pista. Si suelta antes de alcanzar el umbral, vuelve suavemente al origen. Si llega al umbral:

1. El control queda bloqueado y emite respuesta háptica de éxito.
2. La pantalla inicia la compra existente de StoreKit.
3. StoreKit muestra la hoja oficial de Apple con el precio, la prueba y la autenticación con Face ID o contraseña.
4. La suscripción se concede solo después de que StoreKit devuelva una transacción verificada y la API de TriWaveX la reconcilie.

La interfaz vuelve a estar disponible si el usuario cancela la hoja de Apple o se produce un error. En ese caso, el gesto se restablece sin necesidad de cerrar la pantalla.

## Arquitectura

Se crea un componente SwiftUI interno y reutilizable, `SlideToConfirm`, aislado de StoreKit. Recibe texto, estado de disponibilidad y una acción de completado. Su responsabilidad se limita al gesto, la animación, la accesibilidad y la háptica.

`NativePaymentReviewView` decide el texto contextual, entrega el estado `isBusy` y llama al flujo de compra existente mediante `onConfirm`. `SubscriptionStore` no cambia: mantiene el uso de `product.purchase(options: [.appAccountToken(...)])`, la validación de transacciones y la reconciliación con el servidor.

## Interacción y accesibilidad

- La pista tendrá altura cómoda para pulgar, contraste suficiente y un icono de candado o flecha visible.
- El arrastre se actualizará en la misma interacción mediante `DragGesture`, sin crear tareas para animar el dedo.
- VoiceOver expondrá el propósito y una acción alternativa equivalente para activar la confirmación sin arrastrar.
- Mientras el pago está en curso, el control anuncia que está procesando y no acepta un segundo gesto.
- `accessibilityReduceMotion` reduce la animación de retorno y éxito, pero no elimina el cambio de estado.

## Límites de pago

El control no afirma completar el cobro y no sustituye ningún diálogo del sistema. Apple controla el consentimiento final, el método de pago, la renovación, las restauraciones y la autenticación. No se añade Stripe ni PassKit para esta suscripción digital de iOS.

## Estados de error

- Cancelación de Apple: el control vuelve a disponible sin mostrar un error falso.
- Error de StoreKit o de reconciliación: se conserva el mensaje de error de la pantalla actual y el control vuelve a disponible.
- Producto no disponible: se mantiene el estado desactivado actual; el control no puede activarlo.

## Verificación

1. Compilar la aplicación para el simulador y ejecutar las pruebas existentes.
2. Verificar manualmente que un arrastre incompleto retorna al inicio y no inicia StoreKit.
3. Verificar que un arrastre completo inicia exactamente una compra y bloquea duplicados.
4. En un iPhone de pruebas con StoreKit sandbox, cancelar y completar el diálogo oficial de Apple y comprobar ambos resultados.
5. Con VoiceOver y Reducir movimiento, confirmar que existe una alternativa accesible y que no se pierde el flujo de compra.
