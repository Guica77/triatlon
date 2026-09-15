# Flujo de cuenta seguro y fluido

## Objetivo

Dar al atleta un flujo coherente en iOS y web para gestionar su sesión y una eliminación diferida de la cuenta, sin acciones irreversibles accidentales ni pantallas decorativas.

## Experiencia

Perfil ofrece una fila `Cuenta`. En iOS abre una vista SwiftUI nativa; en web abre `Ajustes > Cuenta`. Las dos presentan los mismos grupos:

- `Sesión`: cerrar sesión requiere una alerta de confirmación. La interfaz solo vuelve al acceso cuando la sesión se invalida correctamente.
- `Zona de riesgo`: eliminar cuenta explica que los datos se eliminarán en 30 días. La persona escribe `ELIMINAR` para habilitar la acción.

Al confirmar la eliminación, el servidor registra `deletion_requested_at` y `deletion_scheduled_for` (30 días después), invalida la sesión y devuelve la fecha. Ambos clientes muestran una pantalla de confirmación con la fecha legible y una explicación de que puede iniciar sesión antes de esa fecha para cancelar.

Si ya existe una solicitud, la pantalla de Cuenta muestra la fecha, no repite la acción de eliminación y permite cancelar la solicitud. La cancelación confirma el resultado y conserva la sesión.

## Arquitectura

- Web conserva las server actions existentes `requestAccountDeletion` y `cancelAccountDeletion`, y mejora su presentación con confirmaciones y estados explícitos.
- iOS añade un cliente nativo autenticado para leer el estado de cuenta y para solicitar/cancelar la eliminación. Usa las cookies del `WKWebsiteDataStore`, una sesión efímera, tiempos de espera, validación de origen y respuestas JSON.
- El cliente nativo de sesión añade un cierre autenticado que borra las cookies locales solo tras una respuesta correcta. `RootView` observa el cierre y muestra el acceso.
- La API nativa no acepta identificadores de usuario enviados por el cliente: siempre deriva la cuenta de la sesión autenticada.

## Estados y errores

- Cada botón se desactiva mientras la petición está activa.
- Los errores se muestran junto a la acción y permiten reintentar.
- Un fallo de red no cierra sesión localmente ni anuncia una eliminación que no se haya registrado.
- Las confirmaciones y el campo `ELIMINAR` impiden toques accidentales.

## Pruebas

- Pruebas de autorización de las rutas nativas: encabezado, origen y sesión.
- Pruebas de contrato: fecha programada, estado pendiente y cancelación.
- Compilación de iOS y suite web completa.
