# Soporte y eliminación de cuenta

## Texto para la página pública de soporte

**Borrador: completar correo y canal operativo antes de publicar.**

¿Necesitas ayuda con Triatlón Pro?

Escríbenos a PENDIENTE: correo de soporte verificado. Indica la versión de la aplicación, modelo de dispositivo, versión de iOS y una descripción del problema. Si adjuntas una captura, evita incluir datos médicos o mensajes privados innecesarios. Nunca te pediremos contraseñas de Apple, Garmin, Strava ni códigos de acceso.

Para problemas de cuenta, utiliza el correo con el que te registraste o indícanos cómo podemos verificar tu identidad. Horario y plazo de respuesta: PENDIENTE, fijar un compromiso que el equipo pueda cumplir.

### Eliminar tu cuenta

1. Inicia sesión en Triatlón Pro.
2. Abre Perfil y ajustes.
3. Busca Eliminar cuenta y pulsa Eliminar.
4. Escribe ELIMINAR y confirma.

Es una solicitud de borrado definitivo, no una pausa de tu cuenta. PENDIENTE: detallar el alcance y plazo verificados, las excepciones legales y el ciclo de backups. Si tienes una suscripción activa, consulta también la gestión de suscripciones de Apple; no confundir borrado con cancelación de cargos.

Si no puedes iniciar sesión, contacta en PENDIENTE: correo de privacidad/soporte. Este canal complementa el borrado dentro de la aplicación.

## Procedimiento interno necesario

| Paso | Evidencia exigida |
| --- | --- |
| Autenticación y confirmación | Solo el titular puede iniciar el borrado de su cuenta |
| Identidades y proveedores | Revocación Apple y tratamiento de autorizaciones deportivas verificados |
| Datos en base | Perfil, actividades, biometría, nutrición, feedback, memorias IA, chats, grupos y relaciones revisados |
| Storage y trabajos pendientes | Revisar objetos, suscripciones push, colas y tareas que podrían recrear datos |
| Servicios externos | Solicitudes/expiración según contratos; plazos definidos |
| Backups y logs | Periodos documentados, acceso restringido y borrado no revertido por restauraciones |
| Verificación | La sesión deja de funcionar y la cuenta no reaparece por un webhook/reintento |
| Fallos | Estado recuperable y comunicación clara; no declarar éxito si quedó incompleto |

En el estado actual se ejecuta `auth.admin.deleteUser`, pero no se ha validado todo este procedimiento. El formulario público actual simula envío; debe sustituirse por recepción real o un contacto verificado y honesto.

Fuente: [eliminación de cuentas en apps](https://developer.apple.com/support/offering-account-deletion-in-your-app/).
