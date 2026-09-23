# Política de privacidad: control antes de publicar

La versión pública se mantiene en [`app/legal/privacidad/page.tsx`](../../app/legal/privacidad/page.tsx), ruta `/legal/privacidad`. Esta página describe las funciones encontradas en el código (web e iOS); no es una certificación jurídica ni demuestra que todos los servicios externos estén configurados igual en producción.

## Hechos revisados en el código

- Cuenta y perfil de atleta/entrenador, planes, sesiones, biometría, feedback y mensajes se almacenan o procesan en los servicios de la app.
- La integración nativa con Apple Salud solicita permisos para sueño, HRV, frecuencia cardiaca en reposo y workouts. La ruta de sincronización examinada envía sueño, HRV y frecuencia cardiaca en reposo a `user_biometrics`.
- La conexión Bluetooth lee el pulso localmente en el servicio Swift revisado. WeatherKit recibe un `CLLocation` para consultar el tiempo. Las actividades de Strava pueden contener rutas.
- Las llamadas de IA requieren registros de consentimiento vigente para quien consulta y, cuando procede, para el atleta cuyo contexto se consulta. El aviso de consentimiento deriva la lista de proveedores de configuración activa.
- La eliminación de cuenta se programa para 30 días; el flujo permite cancelarla antes de la fecha. Esto no cancela una suscripción de Apple.
- Hay flujos de compras con Apple/StoreKit y Stripe web; la política aclara que los proveedores de pago procesan los datos de tarjeta.
- El atleta puede remitir un justificante de inscripción (imagen o PDF, hasta 4 MB) para solicitar una oferta promocional; el archivo se almacena privado en Supabase Storage, solo se firma para revisión manual por el equipo y la aplicación intenta eliminarlo al cerrar la revisión.

## No considerar definitiva hasta completar

1. Añadir la identidad legal, domicilio y datos de contacto confirmados del responsable; comprobar que `privacy@triwavex.com` recibe solicitudes.
2. Validar las bases jurídicas, en especial el tratamiento de datos de salud introducidos manualmente y procedentes de HealthKit, así como las responsabilidades entre TriWaveX y cada entrenador.
3. Confirmar los proveedores realmente activos en producción, sus entidades contractuales, regiones, encargos y garantías para transferencias internacionales.
4. Documentar plazos efectivos de conservación, eliminación en cada tabla/servicio y expiración de copias de seguridad.
5. Confirmar edad mínima, tratamiento de datos de menores, cookies/telemetría y datos técnicos del hosting/SDK.
6. Revisar la política contra el binario iOS distribuido y las respuestas de App Store Connect antes de enviar una versión.

No completar estos puntos con datos supuestos. La información debe coincidir con los contratos, la configuración de producción y la app publicada. Para los requisitos de información y datos de salud, revisar el [RGPD (arts. 9 y 13)](https://eur-lex.europa.eu/eli/reg/2016/679/) y consultar asesoramiento de privacidad adecuado.
