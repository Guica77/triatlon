# Descuentos nativos y preparación de la tienda Apple

## Objetivo

Completar en la app iOS el descuento para atletas inscritos a una carrera y establecer, sin códigos ficticios ni precios inventados, el recorrido hasta habilitar compras y ofertas reales de Apple. No incluye reparto de ingresos ni pagos a entrenadores.

## Decisiones de producto aprobadas

- Atleta: 5,99 €/mes.
- Entrenador: 29,99 €/mes hasta 10 atletas; cada bloque adicional de hasta 5 plazas suma 2,99 €/mes.
- La app no fija un límite de capacidad: solo enseña las capacidades cuyos productos hayan sido configurados, aprobados y devueltos por Apple/StoreKit. Los siguientes tramos se provisionan como productos Apple independientes según se necesiten.
- Ofertas estándar: 25%, 50% y un mes al 100% (un mes gratis), cada una durante un periodo mensual y seguida del precio estándar, salvo que Apple ofrezca otro tipo de renovación aprobado.
- Descuento de carrera: 25% durante un mes para un atleta, sujeto a comprobante y revisión manual; el código Apple será único, de un solo uso y se entrega solo al aprobar.
- Apple StoreKit es la única vía de compra y canje. Los identificadores internos de campañas no se muestran ni se aceptan como códigos Apple.

## Flujo nativo de descuento por carrera

1. En Perfil/Ajustes, las cuentas atleta ven “Descuento por carrera”. Las cuentas entrenador no lo ven.
2. La pantalla SwiftUI explica la oferta y el tratamiento del justificante; permite indicar carrera/fecha y adjuntar una imagen o PDF.
3. La app envía la solicitud autenticada al backend nativo existente. El backend verifica el rol, valida tipo y tamaño del archivo, almacena el comprobante en el bucket privado ya existente y registra la solicitud pendiente. Se conserva el límite de una solicitud pendiente por atleta.
4. El atleta ve el estado pendiente/rechazado/aprobado y la nota de revisión cuando exista. Solo el panel administrativo existente puede aprobar o rechazar.
5. Para aprobar, el administrador debe asociar un código de oferta real emitido por Apple y confirmar que corresponde al producto atleta, 25% y un mes. Nunca se genera un código aleatorio en TriWaveX.
6. La vista nativa muestra el código aprobado y abre la hoja StoreKit de Apple para canjearlo. La compra/acceso solo se confirma después de que Apple y el backend reconcilien la transacción.
7. Al terminar la revisión, el comprobante privado se elimina siguiendo el comportamiento actual del backend.

## Componentes y seguridad

- Vista SwiftUI accesible desde el perfil nativo de atleta; mantiene el estilo de lista, botones y estados de carga/error del cuestionario y pantallas nativas existentes.
- Endpoints `/api/native/...` protegidos por la cookie de sesión autenticada y el marcador de cliente nativo, siguiendo el patrón existente. El servidor obtiene identidad y rol del perfil; no confía en valores de rol, porcentaje, estado ni identidad enviados por el cliente.
- Reutilizar `athlete_race_discount_requests`, el bucket privado `race-registration-proofs`, validación de archivos y acciones administrativas existentes. No crear un segundo sistema paralelo.
- El texto del código es dato sensible: solo se devuelve al atleta titular de una solicitud aprobada y al administrador autorizado. El backend conserva unicidad y no permite reusar un código Apple.
- Errores de red, sesión vencida, archivo inválido y rechazo se muestran con una acción recuperable; no se debe mostrar una oferta como disponible mientras no haya código emitido y verificado.

## Tienda y ofertas

- Estado observado el 25-09-2026: la versión TriWaveX 1.0 está en “Prepare for Submission”; existen dos productos mensuales (atleta y entrenador base), ambos en “Prepare for Submission” y ambos sin precio configurado. No están creados los productos de capacidad superior.
- La app necesita `get_native_apple_product_catalog()` en Supabase para enumerar suscripciones. En producción no existen esa función ni su tabla de catálogo, por lo que la tienda nativa no puede cargar su catálogo. Crear una migración mínima dedicada al catálogo, sin tablas ni funciones de reparto de ingresos.
- Configurar los precios acordados y los metadatos/localizaciones en App Store Connect; crear los productos de entrenador en incrementos de 5 según demanda. Apple/StoreKit determina el precio visible; no calcularlo ni simular un producto inexistente en el cliente.
- Crear ofertas de código Apple de 25%, 50% y 100% para cada producto existente que vaya a ofrecer descuentos, configurando duración de un periodo mensual, territorios, elegibilidad, caducidad/límite y convivencia con la prueba introductoria. Emitir códigos individuales de un solo uso para promociones restringidas como carrera. Registrar en Supabase solo referencias de oferta y estado verificado, nunca una etiqueta interna presentada como código de Apple.
- La primera versión y la primera suscripción tienen que enviarse a revisión en conjunto. No anunciar venta ni emitir códigos de producción antes de completar los requisitos de disponibilidad/aprobación que muestre App Store Connect.

## Pruebas y criterios de aceptación

- Atleta: enviar una solicitud válida, ver pendiente, ver nota de rechazo o recibir el único código aprobado; otro atleta no puede ver el código ni el justificante.
- Rechazo de entrenadores, archivo excesivo/falso, solicitud duplicada, sesión expirada, carga fallida, fallo de BD y respuesta tardía; ninguna ruta concede suscripción por sí sola.
- Verificar navegación nativa, VoiceOver, Dynamic Type, selección de imagen/PDF, estados vacíos y recuperación tras reabrir la app.
- El canje abre StoreKit; la UI distingue cancelación, código inválido/expirado y transacción confirmada. Solo la transacción verificada habilita el plan.
- Catálogo Supabase ausente/degradado: mensaje recuperable; nunca precios estimados ni botón que parezca una compra funcional.
- Para cerrar producción: la migración mínima de catálogo aplicada, productos y precios visibles en App Store Connect, ofertas configuradas y aprobadas, primera versión/suscripción aprobadas, y un código sandbox y uno de producción validados en iPhone/TestFlight según disponibilidad.

## Fuera de alcance

- Reparto o liquidación de ingresos a entrenadores.
- Inventar códigos Apple, marcar una campaña como activa como sustituto de una oferta Apple, o emitir códigos reales antes de que Apple permita hacerlo.
- Cambios de precios, descuentos o roles desde el cliente.
- Checkout fuera de Apple.
