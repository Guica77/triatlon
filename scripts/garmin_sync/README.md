# Sincronización Garmin

GitHub Actions ejecuta `sync_all.py` cada hora, en el minuto 17 UTC,
y permite ejecutarlo manualmente. GitHub puede retrasar el inicio.
El día de las métricas se calcula en Europe/Madrid.

## Activación

1. Publicar el workflow y este directorio en la rama predeterminada del repositorio.
2. Configurar los secretos de Actions `NEXT_PUBLIC_SUPABASE_URL` y
   `SUPABASE_SERVICE_ROLE_KEY` para la base de datos de la app.
3. Habilitar Actions y ejecutar `Garmin hourly sync` manualmente una vez.
4. Comprobar el resultado de la ejecución y las métricas en la app.

No se han verificado las credenciales ni una ejecución remota desde este cambio.
No subir credenciales ni archivos `.env` al repositorio.

Se actualiza la misma fila por usuario y fecha, sin duplicar registros.
La sincronización no escribe la valoración subjetiva de fatiga del check-in.
Recoge métricas del día: sueño, pulso, estrés, HRV y estado de entrenamiento;
no importa el historial completo de actividades.
Un fallo de autenticación o de guardado hace fallar la ejecución, después
de intentar procesar los demás usuarios. No tener datos todavía no es un fallo.

La conexión heredada lee email y contraseña desde `garmin_auth_tokens`.
La migración a sesiones y almacenamiento protegido sigue pendiente.
