# TriWaveX · Bienvenida autenticada

Implementación local del 7 de septiembre de 2026. Este informe corresponde únicamente a la bienvenida; el repositorio ya contenía otros cambios anteriores.

## Referencia y logo

Se revisó visualmente la primera página de `/Users/guillermohaya/Desktop/TriWaveX — simple visual identity.pdf`.

El HTML proporcionado referencia `triwavex-simple-visual.svg` en:
`/Users/guillermohaya/Library/Application Support/Clicky/projects/triatlon-prelaunch-brief/output/reports/triatlon-name-refresh/`.

Se extrajo literalmente el contenido de `<g transform="translate(92 92)">` a `public/brand/triwavex-mark.svg`. Artboard 84 × 84, rectángulo de radio 24, los tres trazados, colores `#B7F36B` y `#0B1117`, grosor 7 y extremos redondos sin modificaciones. La copia existente `public/brand/triwavex-simple-visual.svg` permite verificar automáticamente esa igualdad.

El componente existente `TriWaveXMark` ahora reutiliza ese archivo. Wordmark TRIWAVEX con Inter ya disponible. Texto exacto: “Train with clarity.” y “Entrena con claridad.”.

## Comportamiento

- Login con contraseña: las tres entradas existentes activan una capa persistente después de una respuesta satisfactoria y navegan inmediatamente a su destino. Se elimina la espera fija de 800 ms. Una referencia bloquea envíos y navegaciones repetidos.
- OAuth: el callback conserva sus decisiones de rol, onboarding, invitación y rutas especiales. Los destinos de bienvenida admitidos pasan por `/welcome`, que verifica la sesión antes de navegar. La ausencia de sesión vuelve al login; los errores reales del servicio siguen siendo errores visibles.
- La capa vive en el layout raíz y permanece sobre la ruta mientras se obtiene la información. Las páginas de destino indican disponibilidad después de resolver autenticación y datos iniciales.
- El logo y ambas líneas aparecen con transiciones de opacidad breves. Cuando los datos están listos, se revela la página con un fundido de 220 ms. No existe tiempo mínimo de espera ni navegación programada para decorar; por eso las cargas rápidas pueden terminar antes de 800 ms. Una carga lenta conserva el progreso indeterminado y ofrece reintentar después de 10 segundos.
- Sesión restaurada: la carga inicial puede conservar el mismo estado de marca; no vuelve a animar un logo ya servido. Refrescos de datos y eventos normales de visibilidad/foco no disparan la secuencia. Se mantiene el gestor existente de ciclo de vida, incluida su recarga completa tras ausencias largas.
- Se conservan los esqueletos existentes para navegaciones posteriores del dashboard, ajustados al fondo oscuro y a Reduce Motion.
- Reduce Motion elimina animación de progreso y entradas escalonadas; salida con fundido de 80 ms. Safe areas, desplazamiento vertical cuando es necesario, foco en el encabezado del destino y contenido inferior inerte mientras está cubierto. Se habilita el zoom que antes estaba bloqueado por el viewport.
- Errores, sesión rechazada e invitaciones que redirigen a una página pública retiran la capa. No se cambian credenciales, dominios, identificadores ni configuración del backend.

## Archivos de esta implementación

| Archivo | Cambio |
| --- | --- |
| `public/brand/triwavex-mark.svg` | Logo original extraído |
| `components/brand/triwavex-mark.tsx` | Reutilización del asset |
| `components/brand/authenticated-welcome.tsx` | Capa persistente, progreso, recuperación, señales de carga y disponibilidad |
| `components/brand/authenticated-welcome.module.css` | Estilos y movimiento accesible |
| `lib/auth/welcome.ts` | Estados y destinos permitidos |
| `app/layout.tsx` | Proveedor, fondo continuo y zoom |
| `app/welcome/page.tsx` | Entrada autenticada OAuth |
| `app/welcome/loading.tsx` | Estado de carga |
| `app/auth/callback/route.ts` | Handoff visual conservando destinos existentes |
| `app/(auth)/actions.ts` | Devuelve el destino de invitación al login para conservar la capa durante el cambio |
| `app/(auth)/login/page.tsx` | Login unificado sin espera fija, exclusión de envíos repetidos y errores visibles |
| `app/(auth)/athlete/login/page.tsx` | Login de atleta con la misma bienvenida |
| `app/(auth)/coach/login/page.tsx` | Login de entrenador con la misma bienvenida |
| `app/(app)/dashboard/page.tsx` | Señal de datos preparados |
| `app/(app)/dashboard/loading.tsx` | Carga inicial y esqueleto posterior |
| `app/(app)/coach/dashboard/page.tsx` | Señal de datos preparados |
| `app/(app)/coach/dashboard/loading.tsx` | Carga inicial y esqueleto posterior |
| `app/(app)/onboarding/page.tsx` | Señal de destino preparado |
| `app/(app)/onboarding/loading.tsx` | Carga inicial |
| `app/invite/[coachId]/page.tsx` | Señal de invitación preparada, manteniendo la aceptación explícita |
| `app/error.tsx` | Retirar bienvenida al mostrar un error |
| `app/not-found.tsx` | Retirar bienvenida al mostrar un 404 |
| `tests/authenticated-welcome.test.ts` | 11 pruebas DOM y de fidelidad del logo |
| `tests/welcome-route.test.ts` | 5 pruebas de sesión y destinos |
| `package.json`, `package-lock.json` | jsdom como dependencia de desarrollo para Vitest |
| `docs/ui/triwavex-welcome/` | Informe, vista y resultados de comprobación |

## Validación

- 183 pruebas en 28 archivos superadas, incluidas 16 nuevas. El caso real `AuthSessionMissingError` se reprodujo primero con una prueba fallida y quedó corregido.
- TypeScript sin errores. Compilación de producción correcta. `git diff --check` correcto.
- Lint: cero errores; seis avisos anteriores de `@next/next/no-location-assign-relative-destination` en `app/error.tsx:57`, `app/global-error.tsx:47`, `app/not-found.tsx:29`, `app/offline/page.tsx:17`, `components/onboarding/hybrid-wizard.tsx:208` y `components/settings/delete-account-card.tsx:20`. No se desactivaron reglas para ocultarlos.
- Vitest mantiene el aviso anterior sobre la configuración ESM en `vitest.config.ts` cargada como CommonJS. No impide las pruebas.
- Comprobación visual en Chrome aislado usando el componente real renderizado y sus estilos: 320 × 568, 390 × 844, 430 × 932, 568 × 320 y 320 × 568 con texto al 200%. Sin desbordamiento horizontal. Fondo calculado `rgb(11, 17, 23)`. Reduce Motion: animación `none`, fundido `0.08s`. No son capturas de un usuario real autenticado.
- Prueba de navegador sobre el servidor local compilado: `/welcome?next=/coach/dashboard` sin sesión termina en `/login`, formulario visible, capa retirada, fondo oscuro y cero errores JavaScript.

No quedan errores de código conocidos de esta implementación. Queda por validar con una cuenta real el recorrido completo Apple/Google y el dashboard con datos de producción, además de dispositivos físicos iOS. No se han usado cuentas reales ni publicado el cambio.
