# Suscripciones, prueba y acceso multiplataforma

Fecha: 15 de septiembre de 2026.

## Decisiones aprobadas

- Las suscripciones son mensuales.
- Atleta: 5 EUR/mes.
- Entrenador: 30 EUR/mes e incluye hasta 10 atletas activos.
- Al superar 10 atletas, se añade un bloque de hasta 5 atletas por 2 EUR/mes. Los bloques se aplican de inmediato al aceptar al atleta que supera el límite: 11--15 añade un bloque; 16--20 añade dos, y así sucesivamente.
- Toda cuenta nueva puede activar una prueba gratuita de 7 días una sola vez desde el último paso del onboarding.
- En la web se cobra mediante Stripe. En iPhone, las suscripciones digitales se adquieren y restauran mediante StoreKit / App Store. Ambos canales conceden el mismo derecho de acceso en el servidor.

## Límites comerciales

La interfaz pública para consumidores mostrará el precio total aplicable, incluidos impuestos cuando proceda. El sistema conservará importes netos, impuestos y moneda en los comprobantes; no presentará un precio neto como precio final de un consumidor.

Un entrenador podrá abrir plazas hasta su capacidad pagada. Al intentar aceptar al atleta número 11, 16, 21, etc., verá el importe incremental, su efecto inmediato y la confirmación de compra. No se expulsará ni se cobrará retroactivamente a atletas existentes por un error de conteo.

## Modelo de acceso único

El servidor es la fuente de verdad. Una tabla de derechos de acceso registra: titular, plan, canal de compra, estado, inicio y fin de prueba, período vigente, capacidad incluida, bloques extra, y referencia verificable del proveedor. Otra tabla inmutable registra eventos de facturación y cambios de plaza.

Las pantallas, las acciones del servidor y las políticas de datos consultarán el mismo derecho:

1. Onboarding crea una prueba de siete días si la cuenta no consumió otra.
2. Durante la prueba, la cuenta usa las funciones del plan elegido sin cobrar.
3. Al terminar, web abre Stripe Checkout; iOS ofrece StoreKit.
4. Stripe webhooks y App Store Server Notifications actualizan el derecho tras validar su firma. El cliente nunca cambia por sí solo el rol ni el estado de pago.
5. Los cambios, cancelaciones, reembolsos, restauraciones y vencimientos se reflejan en web e iOS de forma idempotente.

## Flujo de onboarding

El último paso mostrará una elección simple y accesible:

- **Atleta**: "7 días gratis · después 5 EUR/mes".
- **Entrenador**: "7 días gratis · después 30 EUR/mes · 10 atletas incluidos".
- Una nota explica que los bloques de 5 atletas cuestan 2 EUR/mes y se cobran al añadir el atleta que abre el bloque.

El botón principal inicia la prueba y entra en el producto. Cuando sea necesario pagar, el flujo explica el precio antes de abrir Apple o Stripe. Se muestran Restaurar compras (iOS), Gestionar suscripción, estado de prueba y fecha de renovación.

## Seguridad y errores

- Las claves secretas, eventos y validaciones viven solo en el servidor.
- Cada webhook se verifica, se guarda con un identificador de idempotencia y no concede acceso por una notificación sin validar.
- Stripe y Apple no comparten identificadores de pago; ambos se vinculan al usuario autenticado mediante referencias de aplicación seguras.
- Si el pago está pendiente o no se puede verificar, se mantiene el acceso anterior y se explica qué ocurrió; no se presenta una compra como completada.
- Las plazas se reservan dentro de una transacción para evitar que dos altas simultáneas superen la misma capacidad.

## Verificación

- Prueba nueva, prueba ya consumida y prueba vencida.
- Compra, cancelación, renovación, fallo, reembolso y restauración tanto en Stripe de pruebas como en StoreKit Sandbox.
- Límites de 10, 11, 15, 16 atletas y concurrencia al aceptar invitaciones.
- Coherencia de acceso en navegador y iPhone con la misma cuenta.
- Accesibilidad: Dynamic Type, VoiceOver, foco, estados de carga y conexión limitada.

## Requisitos externos antes de activar cobros

- Cuenta Stripe, precios y webhook configurados; claves de entorno de servidor.
- App Store Connect: productos de suscripción, grupo, localizaciones, metadatos, Sandbox y App Store Server Notifications.
- Identificador de aplicación y firma de distribución definitivos.
- Textos legales y de App Store coherentes con prueba, precio, renovación, cancelación y privacidad.
