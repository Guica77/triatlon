# Sign in with Apple en producción

## Identificadores de TriWaveX

- Bundle ID de la app iOS: `com.guillermohaya.triwavex`
- `APPLE_CLIENT_ID`: `com.guillermohaya.triwavex`
- `APPLE_BUNDLE_ID`: `com.guillermohaya.triwavex`
- Dominio web: `app.triwavex.com`
- Endpoint nativo: `https://app.triwavex.com/api/native/apple/session`

Para el flujo nativo actual, el `identityToken` lo emite Apple para el Bundle ID de la aplicación. Por eso `APPLE_CLIENT_ID` debe coincidir con `com.guillermohaya.triwavex`.

## Apple Developer

1. En **Certificates, Identifiers & Profiles → Identifiers → App IDs**, abre o crea el App ID explícito `com.guillermohaya.triwavex`.
2. Activa **Sign in with Apple** para ese App ID.
3. Comprueba que el entitlement de Xcode contiene `com.apple.developer.applesignin` con `Default`.
4. En **Supabase → Authentication → Providers → Apple**, configura:
   - Client ID: `com.guillermohaya.triwavex`
   - Secret Key: el client secret JWT generado con Apple Developer.
5. El JWT debe usar:
   - `iss`: Team ID de Apple Developer.
   - `sub`: `com.guillermohaya.triwavex`.
   - `aud`: `https://appleid.apple.com`.
   - `iat` y `exp`: fechas válidas; Apple limita la caducidad del client secret.
   - Firma ES256 con la private key de Sign in with Apple y su `Key ID`.
6. En **Vercel → Project → Settings → Environment Variables**, crea las variables para **Production**:
   - `APPLE_CLIENT_ID=com.guillermohaya.triwavex`
   - `APPLE_CLIENT_SECRET=<JWT completo, guardado como Secret>`
   - `APPLE_BUNDLE_ID=com.guillermohaya.triwavex`
   - `TOKEN_ENCRYPTION_KEY=<64 caracteres hexadecimales aleatorios>`
7. Redeploya producción después de guardar las variables.

## Importante sobre Service ID

No se debe inventar un Service ID ni usar `com.triwavex.app`. Para este flujo nativo, el identificador correcto es el Bundle ID real de Xcode: `com.guillermohaya.triwavex`.

Si más adelante se habilita el login Apple web mediante OAuth, se puede crear un Service ID separado, por ejemplo `com.guillermohaya.triwavex.web`, asociado al mismo App ID. Ese Service ID se usaría para el flujo web y sus dominios/callbacks, pero no sustituye al Bundle ID del flujo nativo.

## Validación segura

Después del redeploy:

1. Abre la app en un dispositivo iOS real firmado con el mismo Team ID.
2. Pulsa **Continuar con Apple**.
3. Si falla, usa el mensaje de la app para distinguir:
   - `400`: payload Apple inválido.
   - `401`: token rechazado por Apple/Supabase; revisar Client ID, Team ID, key y secret JWT.
   - `503`: problema de servicio o configuración del backend.
4. Nunca pegues en chats, commits o logs el `APPLE_CLIENT_SECRET`, la private key `.p8`, un `identityToken`, un refresh token, cookies ni el nonce.
