# Suscripciones, prueba y acceso multiplataforma

Fecha: 15 de septiembre de 2026.

## Decisiones aprobadas

- Las suscripciones son mensuales.
- Atleta: 5 EUR/mes.
- Entrenador: 30 EUR/mes e incluye hasta 10 atletas activos.
- Un atleta sin entrenador paga 5 EUR/mes netos íntegros a TriWaveX.
- Cada atleta con entrenador paga 5 EUR/mes netos: 2,50 EUR se devengan para TriWaveX y 2,50 EUR para el entrenador que lo atiende. Comisiones de pago, impuestos, reembolsos y ajustes se registran por separado.
- Al superar 10 atletas, se añade un bloque de hasta 5 atletas por 2 EUR/mes. Los bloques se aplican de inmediato al aceptar al atleta que supera el límite: 11--15 añade un bloque; 16--20 añade dos, y así sucesivamente.
- Toda cuenta nueva puede activar una prueba gratuita de 7 días una sola vez desde el último paso del onboarding.
- En la web se cobra mediante Stripe. En iPhone, las suscripciones digitales se adquieren y restauran mediante StoreKit / App Store. Ambos canales conceden el mismo derecho de acceso en el servidor.

## Límites comerciales

La interfaz pública para consumidores mostrará el precio total aplicable, incluidos impuestos cuando proceda. El sistema conservará importes netos, impuestos y moneda en los comprobantes; no presentará un precio neto como precio final de un consumidor.

Un entrenador podrá abrir plazas hasta su capacidad pagada. Al intentar aceptar al atleta número 11, 16, 21, etc., verá el importe incremental, su efecto inmediato y la confirmación de compra. No se expulsará ni se cobrará retroactivamente a atletas existentes por un error de conteo. Para cada atleta aceptado, la liquidación separará los 2,50 EUR del entrenador, la parte de TriWaveX, las comisiones y cualquier devolución.

## Modelo de acceso único

El servidor es la fuente de verdad. Una tabla de derechos de acceso registra: titular, plan, canal de compra, estado, inicio y fin de prueba, período vigente, capacidad incluida, bloques extra, y referencia verificable del proveedor. Otra tabla inmutable registra eventos de facturación y cambios de plaza.

Las pantallas, las acciones del servidor y las políticas de datos consultarán el mismo derecho:

1. Onboarding crea una prueba de siete días si la cuenta no consumió otra.
2. Durante la prueba, la cuenta usa las funciones del plan elegido sin cobrar.
3. Al terminar, web abre Stripe Checkout; iOS ofrece StoreKit.
4. Stripe webhooks y App Store Server Notifications actualizan el derecho tras validar su firma. El cliente nunca cambia por sí solo el rol, el estado de pago ni el importe liquidable al entrenador.
5. Los cambios, cancelaciones, reembolsos, restauraciones y vencimientos se reflejan en web e iOS de forma idempotente.

## Flujo de onboarding

El último paso mostrará una elección simple y accesible:

- **Atleta con IA**: "7 días gratis · después 5 EUR/mes".
- **Atleta con entrenador**: "7 días gratis · después 5 EUR/mes".
- **Entrenador**: "7 días gratis · después 30 EUR/mes · 10 atletas incluidos".
- Una nota explica que cada bloque adicional de 5 plazas cuesta 2 EUR/mes y se cobra al añadir el atleta que abre el bloque.

El botón principal inicia la prueba y entra en el producto. Cuando sea necesario pagar, el flujo explica el precio antes de abrir Apple o Stripe. Se muestran Restaurar compras (iOS), Gestionar suscripción, estado de prueba y fecha de renovación.

## Secuencia de pago en onboarding

El cobro no interrumpe la creación del objetivo. Primero se muestra la semana inicial y el valor concreto que recibirá la persona. Después aparece una pantalla final de decisión, con un único botón principal y la siguiente información visible sin desplegables:

1. "7 días gratis · no se cobra hoy" y la fecha exacta en la que termina la prueba.
2. El precio que aplicará después de la prueba: 5 EUR/mes para atleta o 30 EUR/mes para entrenador, con 10 atletas incluidos.
3. Para entrenador, la regla de capacidad: a partir del atleta 11, 2 EUR/mes por cada bloque de hasta cinco plazas.
4. El enlace a gestionar/cancelar, restaurar compras en iPhone y la aclaración de que se muestra el total aplicable antes de confirmar.

El reparto interno de una cuota de atleta con entrenador nunca se muestra en las pantallas del atleta. Es un dato de liquidación para TriWaveX y el entrenador, no una condición comercial que el atleta deba interpretar.

## Debilidades que deben cerrarse antes de activar el cobro

- La interfaz ya puede explicar precios y prueba, pero no debe prometer una prueba activa hasta que exista una fuente de verdad de derechos en el servidor.
- Falta crear el producto/precio de Stripe, el producto de App Store Connect y los webhooks/notificaciones firmados que actualizan la misma suscripción.
- Falta un registro idempotente de prueba, renovación, cancelación, reembolso y restauración. El cliente no puede decidir por sí solo que una cuenta está pagada.
- Para pagar al entrenador, falta la alta y verificación de la cuenta conectada del entrenador y la liquidación mediante Stripe Connect. Nunca se muestran ni se exponen estos datos bancarios al atleta.
- Antes de publicar en Apple, hay que verificar en Sandbox una compra, una restauración, la cancelación, el vencimiento de la prueba y la sincronización con la web.

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
