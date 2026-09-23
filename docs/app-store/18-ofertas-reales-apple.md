# Ofertas reales 25%, 50% y 100% en iPhone

El portal `/admin/discounts` es un registro privado para organizar campañas. Los códigos que aparecen ahí son referencias internas: no son códigos de Apple, no modifican el precio y no conceden acceso. La compra y el canje reales se hacen con StoreKit y App Store Connect.

## Qué significa cada porcentaje

- 25% y 50%: crea en App Store Connect una oferta de código con precio rebajado. Apple trabaja con puntos de precio por territorio y duración; comprueba el precio final en cada región, no des por supuesto que el porcentaje nominal será exacto en todas las monedas.
- 100%: configura un precio gratis durante una duración concreta. No significa gratis para siempre. En App Store Connect elige si la suscripción se renueva al precio estándar al terminar o si el acceso termina con el periodo gratis. La pantalla de confirmación de Apple debe mostrar la duración y el precio posterior.
- Crea ofertas separadas por porcentaje y por cada uno de los 10 productos: el producto atleta y los nueve productos de capacidad del entrenador (10, 15, 20, 25, 30, 35, 40, 45 y 50). Son 30 ofertas en total (25%, 50% y 100% por SKU). Los identificadores y precios están en `docs/superpowers/specs/2026-09-23-apple-coach-capacity-and-offers-design.md`.

La app ya reconoce los nueve IDs de capacidad en transacciones firmadas por Apple, y el servidor deriva de ahí el máximo de atletas. Los ocho productos de más de 10 plazas siguen pendientes de crearse/configurarse en App Store Connect; hasta que Apple los devuelva en StoreKit, sus opciones aparecen como no disponibles. El portal privado prepara 30 referencias internas pero no crea ni activa ofertas en Apple.

Apple especifica que los códigos de oferta de suscripciones ofrecen un precio gratis o reducido por una duración concreta. La app debe estar en estado **Ready for Sale** para que los clientes puedan canjearlos. Consulta [Configurar códigos de oferta de suscripción](https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-subscription-offer-codes).

## Configuración necesaria para reconocer el canje con la cuenta TriWaveX

Cuando Apple confirma un código canjeado fuera del flujo de compra ordinario, la transacción puede no contener `appAccountToken`. El servidor acepta únicamente una transacción firmada y verificada por Apple, de uno de los diez productos de suscripción y marcada como oferta de código; después asocia el `originalTransactionId` a la cuenta que inició sesión mediante `Set App Account Token`. Si falla la asociación, no activa el acceso.

Para habilitar esa asociación en producción:

1. En App Store Connect, crea una clave de **App Store Connect API** desde **Users and Access → Integrations**. No uses `AuthKey_MV8NJJAXQ9.p8` si esa es la clave de Sign in with Apple: es una credencial distinta.
2. Guarda en el gestor de secretos del servidor los valores `APPLE_SERVER_API_ISSUER_ID`, `APPLE_SERVER_API_KEY_ID` y `APPLE_SERVER_API_PRIVATE_KEY_BASE64` (contenido del `.p8` codificado en Base64). Conserva también el `APPLE_BUNDLE_ID` correcto y configura el entorno `APPLE_NOTIFICATION_ENV` coherente con la prueba.
3. No añadas el `.p8` al repositorio, a la app iOS ni a variables `NEXT_PUBLIC_*`. Si se expone, revoca la clave y crea otra.
4. Prueba en sandbox con cuentas de prueba: código válido, código vencido, producto equivocado, otra cuenta ya asociada, rechazo/fallo del servidor y renovación tras el periodo gratuito. Verifica en App Store Connect el precio y duración mostrados antes de la confirmación.
5. Antes de producción, confirma que App Store Server Notifications V2 llega al endpoint, que los diez productos están aprobados/configurados y que la versión está **Ready for Sale**.

El servidor mantiene el acceso denegado si falta la clave de API o Apple rechaza la asociación. Esto evita que una referencia interna del panel se convierta accidentalmente en una compra gratis.

## Limitaciones del panel

El portal guarda nombre, segmento, porcentaje orientativo, límites y una referencia ASC. No crea ofertas ni códigos en App Store Connect, y el número de usos del portal no es el contador de canjes de Apple. El estado “Activa” del portal es administrativo; la validez comercial la determina Apple.
