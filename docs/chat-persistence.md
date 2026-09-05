# Conservación del chat

Los mensajes confirmados se guardan en `chat_messages` de Supabase. La app no
aplica caducidad ni borra historial al cerrar sesión, recargar o cambiar de entrenador.
Los permisos de lectura siguen limitados a remitente y destinatario.

Cada envío lleva un UUID que se reutiliza al reintentar. Un conflicto se confirma
solo si coinciden remitente, destinatario y texto. Las notificaciones se ejecutan
después de responder, sin retrasar la confirmación de guardado ni repetirse al reintentar.

Los mensajes sin confirmar se conservan en localStorage, separados por cuenta.
Tras recargar aparecen con «Reintentar»; no se promete entrega sin conexión.
Si el navegador no permite guardar, se muestra un aviso. Borrar los datos del
navegador elimina estos pendientes, pero no los mensajes confirmados en Supabase.

El historial muestra los últimos 50 y permite cargar anteriores con cursor de
fecha e ID. Realtime, reconexión, vuelta a la pestaña y una comprobación cada
30 segundos mientras está visible recuperan los mensajes nuevos del servidor.
Las respuestas de una conversación anterior no deben contaminar la actual.

## Antes de publicar

- Aplicar la migración de índice `20260904194000_chat_history_indexes.sql`.
- Verificar las políticas existentes de `chat_messages` y su publicación Realtime.
- Probar en dos cuentas reales el envío, reconexión, reintento y lectura.
- Verificar copias de seguridad y una restauración en el proyecto Supabase real.

No se ha verificado ni configurado el respaldo remoto desde estos cambios.
El esquema existente utiliza `ON DELETE CASCADE` para los perfiles: eliminar
una cuenta puede borrar sus mensajes. No se ha cambiado esa política de borrado
de cuentas ni se promete conservación ilimitada frente a una eliminación administrativa.

Pruebas locales: `npx vitest run tests/chat-persistence.test.ts`.
