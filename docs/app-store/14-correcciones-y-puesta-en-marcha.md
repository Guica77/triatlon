# Correcciones y puesta en marcha

Actualización local: 7 de septiembre de 2026. Complementa la auditoría inicial; no sustituye las pruebas del producto desplegado.

## Correcciones implementadas

- Administración: autorización mediante UUID explícitos de `ADMIN_USER_IDS`, comprobada también en las acciones del servidor. Eliminados los accesos por coincidencia de correo y la promoción automática de roles.
- Datos personales: migración que limita perfiles a su titular y entrenador activo, protege cambios de rol y suscripción y retira secretos de los perfiles. Los tokens Strava quedan en almacenamiento con acceso restringido; se eliminan credenciales Garmin heredadas y registros de conexiones simuladas.
- Entrenadores: aceptación expresa de invitaciones; un entrenador no puede darse acceso unilateralmente. Personalizar una sesión crea una copia para ese entrenamiento y no modifica la plantilla compartida.
- Strava: estado OAuth aleatorio, ligado a usuario y cookie, caducidad y consumo único. Eliminadas conexiones ficticias. Los errores de consulta o guardado dejan de devolver éxito.
- IA: consentimiento explícito y revocable antes de transmitir contexto personal; incluye proveedores configurados y alternativas. Entrenador y atleta deben consentir cuando corresponda. Límite atómico de 30 solicitudes por hora por actor. Un error de autorización impide el envío.
- Eliminación de cuenta: revocación Apple con token cifrado cuando está disponible, reintento y alternativa manual visible cuando no puede revocarse. No se confunde el token de otra identidad enlazada con un token Apple. Un fallo posterior de cierre de sesión no oculta un borrado ya realizado.
- Funciones incompletas: retirados pagos ficticios, conexiones y envíos simulados a dispositivos y la finalización automática de entrenamientos de demostración. La generación de sesiones que antes era una maqueta informa de que no está disponible.
- Chat: bloqueo, denuncia de mensajes y cola de revisión para administradores, con retirada de mensajes. La base de datos limita mensajes a relaciones activas y aplica los bloqueos. Sigue siendo necesario establecer responsables y tiempos de moderación; esto no demuestra por sí solo cumplimiento completo de la norma 1.2 de Apple.
- Soporte: página real que utiliza `SUPPORT_EMAIL` cuando existe, sin simular envíos. Corregidas promesas de precios, cobros e integraciones de la web pública.
- Dependencias: Next.js 16.3.4 y actualización de dependencias compatibles en app y web pública. La auditoría de dependencias tras la actualización encontró cero vulnerabilidades conocidas; no es una garantía de ausencia de defectos.

## Validación local

167 pruebas pasan en 26 archivos. Incluyen autorización administrativa, consentimiento IA, OAuth de Strava, cifrado/revocación Apple, retirada de simulaciones y permisos SQL ejecutados en PostgreSQL aislado mediante PGlite.

Las pruebas SQL aplican las dos migraciones nuevas sobre un esquema de prueba con las columnas necesarias. No prueban todos los datos históricos ni sustituyen un ensayo sobre una copia de la base real. No se enviaron mensajes reales ni se probaron cuentas Apple/Strava de producción. La consulta remota de metadatos del esquema no devolvió resultado y se canceló; la compatibilidad completa con el esquema remoto queda pendiente de verificar.

Aplicación y web pública compilan. Consultar las evidencias actualizadas para resultados finales de compilación, tipos y lint. El lint conserva avisos de navegación en pantallas de recuperación; no se han desactivado para ocultarlos.

## Despliegue coordinado pendiente

Las correcciones están en los archivos locales. No se ha actualizado la aplicación pública ni aplicado ninguna de estas migraciones remotas:

1. `20260907000000_release_security.sql`.
2. `20260907010000_chat_safety.sql`.

Antes de aplicarlas:

1. Preparar copia recuperable de la base y ensayar ambas migraciones en un entorno de prueba equivalente. Revisar relaciones entrenador-atleta históricas y confirmar cuáles fueron autorizadas.
2. Configurar `ADMIN_USER_IDS` con UUID reales. Mantenerlo vacío deniega administración.
3. Configurar `TOKEN_ENCRYPTION_KEY` como 32 bytes aleatorios en hexadecimal, conservarla de forma segura y establecer `APPLE_CLIENT_ID` y `APPLE_CLIENT_SECRET` válidos. Renovar el secreto Apple según su caducidad. Nunca exponer estas variables como públicas.
4. Establecer `NEXT_PUBLIC_SITE_URL`, callbacks autorizados, credenciales Strava y `SUPPORT_EMAIL` real en cada despliegue que corresponda.
5. Coordinar una ventana de mantenimiento: aplicar ambas migraciones y desplegar inmediatamente la app actualizada. La versión anterior depende de permisos que se retiran; la nueva depende de tablas y funciones nuevas.
6. Probar con dos atletas y un entrenador: separación de datos, invitación, edición de una sesión, bloqueo/denuncia, consentimiento, sincronización y eliminación. Verificar también acceso denegado sin sesión.
7. Si falla el despliegue, mantener mantenimiento y corregir hacia delante. No restaurar políticas amplias ni volver a exponer contraseñas para recuperar funcionalidad.

La primera migración elimina contraseñas Garmin heredadas y conexiones de proveedores que solo estaban simuladas. Antes de ejecutarla, confirmar el inventario de proveedores del entorno real. Conserva actividades y entrenamientos; los usuarios tendrán que volver a autorizar las integraciones que finalmente se implementen.

## Lo que todavía impide enviar a Apple

- Falta un cliente iOS real, identificadores y firma del titular, archivo de distribución y beta de TestFlight. Una web compilada no es un binario iOS.
- Faltan datos legales definitivos, dirección real de soporte, dominio y decisión comercial. Los documentos con `PENDIENTE` siguen siendo borradores.
- Faltan validación en dispositivos, capturas definitivas, privacidad del binario y pruebas reales de Apple/Strava y eliminación de datos.
- Falta la puesta en marcha de las correcciones anteriores en el servidor y la base de datos.
- La moderación necesita operación humana y medidas de filtrado acordes al producto antes de declarar completo el cumplimiento de contenido generado por usuarios.

No se garantiza que todo el código esté perfecto ni la aprobación de Apple. Las correcciones y las pruebas reducen problemas concretos documentados; los puntos anteriores permanecen abiertos.
