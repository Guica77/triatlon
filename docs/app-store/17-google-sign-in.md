# Google Sign-In: estado y configuración pendiente

## Estado comprobado

- El login web ya muestra «Continuar con Google» y usa Supabase Auth OAuth con callback `/auth/callback`.
- `supabase/config.toml` tiene Google habilitado para desarrollo local y toma client ID/secret del entorno. La comprobación de nonce queda activada (`skip_nonce_check = false`).
- El login nativo SwiftUI de iPhone todavía no ofrece Google: actualmente presenta correo/contraseña y Sign in with Apple.
- No se han encontrado credenciales de Google Cloud verificables para producción. Que el flujo figure en el código no acredita que el proveedor esté configurado en el proyecto Supabase desplegado.

## Para habilitarlo correctamente

1. En Google Cloud Console, crear un cliente OAuth **Web** para Supabase y autorizar como redirect la URL de callback que muestra el proveedor Google en Supabase Auth (`https://<proyecto>.supabase.co/auth/v1/callback`). Añadir el dominio público TriWaveX como origen autorizado.
2. En Supabase Auth → Providers → Google, introducir el client ID y el secret en el panel del proyecto de producción. Mantener los alcances de inicio de sesión básicos `openid`, correo y perfil; no pedir acceso a Google APIs que TriWaveX no necesita.
3. Probar login, registro nuevo, cuenta existente, cancelación y callback de producción con perfiles sintéticos.
4. Para el cliente SwiftUI, crear además un cliente OAuth **iOS** para el bundle ID firmado, configurar el URL scheme correspondiente y validar su ID token en Supabase Auth mediante el flujo nativo. Nunca distribuir el client secret web dentro de la app.
5. Probar el retorno al producto, asignación de rol para cuentas nuevas y continuidad de la sesión en el contenedor WebKit antes de lanzar.

Google publica una guía específica para [Sign in with Google en iOS](https://developers.google.com/identity/sign-in/ios/sign-in); Supabase documenta [Google Auth y los redirects permitidos](https://supabase.com/docs/guides/auth/social-login/auth-google). La conexión nativa está pendiente de los dos client IDs, la configuración de Google Cloud/Supabase y la integración/validación en un iPhone firmado.
