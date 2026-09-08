# Dominio TriWaveX

Configuración acordada el 8 de septiembre de 2026:

| Dirección | Uso |
| --- | --- |
| `https://triwavex.com` | Sitio público y página comercial |
| `https://app.triwavex.com` | Aplicación web y versión iOS de producción |
| `https://staging.triwavex.com` | Validación previa con cuentas y datos sintéticos |

## Antes de conectar la app

1. Añadir los tres dominios al proveedor que despliega la web y crear los registros DNS que indique.
2. Esperar a que el certificado HTTPS sea válido en los tres destinos.
3. Publicar la aplicación Next.js en staging con `/api/native/session`, `/privacidad` y `/soporte` disponibles sin iniciar sesión cuando corresponda.
4. En Supabase, añadir ambos destinos de aplicación y sus rutas `/auth/callback` a las URL de redirección permitidas. Mantener los secretos fuera de URLs y del cliente.
5. Establecer en el despliegue de staging `NEXT_PUBLIC_SITE_URL=https://staging.triwavex.com`, y en producción `NEXT_PUBLIC_SITE_URL=https://app.triwavex.com`.
6. Comprobar desde un iPhone ajeno que la app puede entrar, que recibe una sesión, que funciona el retorno de OAuth y que las URLs públicas abren con HTTPS.

La web pública puede redirigir a `app.triwavex.com` para acceso. No se ha cambiado DNS, Vercel, Supabase ni el entorno de producción en este repositorio.
