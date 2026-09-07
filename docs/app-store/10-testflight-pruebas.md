# TestFlight y plan de aceptación

**Estado: pendiente de cliente iOS.** Las pruebas web realizadas no equivalen a pruebas en TestFlight. Este documento no marca como superado ningún caso móvil.

## Preparación

Crear entorno y cuentas sintéticas: atleta A, atleta B sin relación con A, entrenador C vinculado solo con A, entrenador D no vinculado, administrador y cuenta desechable para eliminación. No incluir secretos en este documento. Preparar sesiones de distintas disciplinas, métricas suficientes para gráficos y mensajes de prueba.

Dispositivos: al menos un iPhone real con la versión mínima soportada y otro con iOS actual; incluir pantalla pequeña y grande. Probar iPad si se ofrece. Registrar modelo, versión del sistema, build y resultado por caso.

## Casos obligatorios

| ID | Prueba | Resultado esperado | Estado |
| --- | --- | --- | --- |
| T01 | Registro, verificación, contraseña olvidada | Flujo completo, enlaces vuelven a la app | Pendiente |
| T02 | Apple: primera entrada, correo privado, entrada posterior | Identidad estable, sin duplicados ni cambio de rol | Pendiente |
| T03 | Cerrar sesión, reiniciar, sesión expirada | Sin datos de la cuenta anterior, acceso protegido | Pendiente |
| T04 | Correo que contiene guillermo | Nunca concede administración por su texto | Pendiente |
| T05 | A consulta B por API directa | No puede leer perfil, tokens, métricas o chat de B | Pendiente |
| T06 | C consulta A y luego B; D consulta A | Solo C puede acceder a A con relación autorizada | Pendiente |
| T07 | Crear relación propia sin invitación, modificar role/plan | Operaciones rechazadas en base y servidor | Pendiente |
| T08 | Modificar/borrar sesión de otro entrenador | Rechazado; plantillas y calendarios ajenos intactos | Pendiente |
| T09 | Calendario, detalle, completar y feedback | Se guarda una vez y persiste al reabrir | Pendiente |
| T10 | Medianoche, cambio de zona horaria y horario de verano | Fechas de sesiones consistentes | Pendiente |
| T11 | Chat entre A y C, reconexión y envío repetido | Mensajes persistentes, sin duplicados ni falsa confirmación | Pendiente |
| T12 | Chat grupal, expulsión y denuncia/bloqueo | Acceso y moderación según permisos reales | Pendiente |
| T13 | IA sin permiso, retirar permiso, entrenador consulta A | Cero envío de datos sin permiso aplicable | Pendiente |
| T14 | IA: proveedor caído, respuesta cortada, cuota agotada | Error claro y reintento; sin consejo inventado como fallback | Pendiente |
| T15 | Integración real: conectar, cancelar y desconectar | Estado refleja autorización real; no tokens simulados | Pendiente |
| T16 | OAuth con state inválido, expirado y reutilizado | Rechazo sin vinculación | Pendiente |
| T17 | Actividades duplicadas, webhook retrasado y reintentos | Una actividad persistente y cola recuperable | Pendiente |
| T18 | CSV y calendario desde iOS | Archivo correcto, compartir/abrir funciona y respeta permisos | Pendiente |
| T19 | Notificaciones: aceptar/rechazar, app abierta/cerrada | Respeta elección y abre destino autorizado | Pendiente |
| T20 | Borrar cuenta Apple con sesión antigua y fallo de red | Revocación/borrado verificables, sin éxito engañoso | Pendiente |
| T21 | Webhook/reintento tras borrado | No recrea perfil ni datos personales | Pendiente |
| T22 | Compras si existen: éxito, cancelar, pendiente, restaurar | Derechos concedidos solo por transacción validada | Pendiente |
| T23 | Reinstalación, expiración/reembolso de suscripción | Estado coherente y restauración correcta | Pendiente si hay compras |
| T24 | Sin red, red lenta, suspensión y reapertura | No pierde entradas silenciosamente ni queda bloqueada | Pendiente |
| T25 | VoiceOver, texto grande, contraste y movimiento reducido | Controles accesibles y contenido legible | Pendiente |
| T26 | Teclado, safe areas, rotación y pantalla pequeña | Formularios y botones utilizables sin recortes | Pendiente |
| T27 | Privacidad y soporte desde dispositivo sin cuenta | Páginas accesibles y consulta recibida realmente | Pendiente |
| T28 | Restaurar backup en entorno aislado | Recuperación demostrada y borrados respetados | Pendiente |

## Texto de beta propuesto

Triatlón Pro permite organizar sesiones de natación, ciclismo y carrera y seguir el progreso deportivo. En esta beta queremos comprobar el calendario, el registro de sensaciones, los mensajes y la experiencia en iPhone.

Prueba iniciar sesión, consultar y completar una sesión, enviar un mensaje de prueba y volver a abrir la app después de cerrarla. Indica el dispositivo, versión de iOS y pasos para reproducir cualquier problema. No introduzcas datos médicos reales ni contraseñas de servicios deportivos en un flujo de prueba.

Integraciones y funciones habilitadas en esta beta: PENDIENTE, completar con el alcance real. Contacto para comentarios: PENDIENTE.

## Criterio de salida

Todos los P0/P1 cerrados; casos aplicables superados sobre el mismo build; sin fallos reproducibles de acceso, pérdida de datos, cierre inesperado o cobro; documentos y capturas coinciden con el producto. Las pruebas no aplicables deben justificarse por retirada real de la función, no por omisión de la prueba.
