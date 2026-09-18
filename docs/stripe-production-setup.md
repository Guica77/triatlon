# Configuración de Stripe para producción

Las variables de producción de Vercel son:

- `STRIPE_SECRET_KEY`: la clave restringida de producción creada en Stripe. Nunca usar el prefijo `NEXT_PUBLIC_`.
- `STRIPE_PRICE_ATHLETE`: precio mensual de atleta.
- `STRIPE_PRICE_COACH`: precio mensual de entrenador.
- `STRIPE_WEBHOOK_SECRET`: secreto del endpoint de Stripe, creado en el siguiente paso.
- `STRIPE_WEBHOOK_SECRET` también valida reembolsos y pagos fallidos; no lo pongas en el cliente.
- `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`: ya usadas por el servidor para persistir acceso.

## Endpoint de eventos

En Stripe, crea un endpoint de eventos de producción con esta URL:

`https://app.triwavex.com/api/billing/webhook`

Escoge exclusivamente estos eventos:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `charge.refunded`
- `refund.updated`

Guarda el secreto que Stripe muestra solo como `STRIPE_WEBHOOK_SECRET` en Vercel. No debe compartirse por chat ni añadirse al repositorio. Después, redeploy de producción y envía un evento de prueba desde Stripe; debe contestar con `200`.

## Límites de plataforma

El checkout de Stripe y Apple Pay queda disponible en web. En iOS, las suscripciones digitales se cobran mediante StoreKit/App Store In-App Purchase; ambas plataformas deben reflejarse en la misma tabla de permisos, pero no compartir la clave de Stripe con la app.

## App Store Server Notifications V2

Configura `https://app.triwavex.com/api/apple/notifications` en producción y sandbox. El endpoint verifica criptográficamente `signedPayload` con la librería oficial de Apple y registra cada `notificationUUID` una sola vez. Define `APPLE_BUNDLE_ID`, `APPLE_APP_ID` y los certificados raíz DER de Apple en Vercel como variables **Secret**. Nunca guardes certificados o claves en el repositorio.
