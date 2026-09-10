# Verificación local de TriWaveX — 10 de septiembre de 2026

## Dictamen

La revisión local de esta fecha confirma que el producto web y el cliente iOS compilan y que las rutas públicas/protegidas básicas responden como se espera sin sesión. La validación funcional que depende de credenciales, despliegues, proveedores externos o interacción real de cuenta sigue abierta; no es un dictamen de lanzamiento ni de App Store.

## Comprobaciones ejecutadas

| Comprobación | Resultado |
| --- | --- |
| Suite Vitest | **222 pruebas, 37 archivos, todas correctas** (`npm test`). Vitest muestra un aviso de configuración ESM/CommonJS, sin fallo. |
| TypeScript | **Correcto** (`npx tsc --noEmit`). |
| Lint | **0 errores, 6 avisos**. Los avisos son usos de `window.location.href/assign` para navegación interna en pantallas de error, offline, onboarding y eliminación de cuenta. |
| Build web | **Correcto** (`npm run build`): Next.js 16.3.4, compilación, TypeScript, generación de 46 páginas y rutas completadas. |
| Smoke HTTP producción local | **10 comprobaciones correctas** con `node scripts/smoke-http.mjs`: login, dashboard y chat sin sesión, API IA/notificaciones/exportación/cron con 401, ejercicios, manifest y offline. Las páginas protegidas devuelven streaming con redirección interna a login, comportamiento contemplado por el script. |
| Cliente iOS — simulador | **Correcto**: build Debug arm64 para iPhone Simulator iOS 26.5 con `-derivedDataPath /tmp/TriWaveXDerivedData`, instalación y lanzamiento en iPhone 17. Se capturó pantalla del login. |
| Cliente iOS — SDK de dispositivo | **Correcto**: build Debug genérico para `iphoneos` sin firma con `-derivedDataPath /tmp/TriWaveXDeviceDerivedData`. |
| Revisión visual local | Login iOS visible en simulador: selector Atleta/Entrenador, campos de correo/contraseña, acceso Apple, recuperación, privacidad y soporte. No equivale a probar credenciales ni VoiceOver real. |

## Incidencias de la ejecución

- Una primera instalación de dependencias se lanzó desde el directorio padre y falló porque no existe `package.json` allí; se repitió desde `triatlon-app/` y terminó correctamente.
- Dos builds iOS concurrentes sobre el mismo DerivedData produjeron un bloqueo de `build.db`; la repetición con DerivedData aislado terminó correctamente.
- Una primera combinación de lint/type-check/build se solapó con otro `next build`; el build limpio posterior terminó correctamente.
- El lint no bloquea, pero conserva seis avisos de navegación interna que conviene resolver antes de endurecer el gate de calidad.

## Sigue pendiente de validación funcional

Quedan sin validar mediante una cuenta y entorno reales: login exitoso y fallido contra staging, Sign in with Apple completo, navegación autenticada de atleta y entrenador, Strava, VoiceOver real, orientación landscape, recuperación de cuenta, privacidad, soporte, cierre/reapertura y expiración de sesión, APNs, descargas/exportación y pruebas manuales de eliminación. También siguen pendientes el despliegue verificable de los dominios/endpoints nativos, la configuración Apple definitiva, las migraciones remotas, el contenido RAG poblado y el ensayo con cuentas sintéticas separadas.

Las evidencias anteriores de dependencias externas, RAG, Strava, Apple, TestFlight y producción permanecen descritas en [verification-2026-09-04.md](verification-2026-09-04.md) y [15-ios-implementation-status.md](app-store/15-ios-implementation-status.md).

## Repetición

```sh
npm test
npm run lint
npx tsc --noEmit
npm run build
npm run start -- --port 3100 --hostname 127.0.0.1
node scripts/smoke-http.mjs
xcodebuild -project ios/TriWaveX.xcodeproj -scheme TriWaveX -sdk iphonesimulator -configuration Debug -destination 'platform=iOS Simulator,name=iPhone 17' CODE_SIGNING_ALLOWED=NO -derivedDataPath /tmp/TriWaveXDerivedData build
xcodebuild -project ios/TriWaveX.xcodeproj -scheme TriWaveX -sdk iphoneos -configuration Debug -destination 'generic/platform=iOS' CODE_SIGNING_ALLOWED=NO -derivedDataPath /tmp/TriWaveXDeviceDerivedData build
```
