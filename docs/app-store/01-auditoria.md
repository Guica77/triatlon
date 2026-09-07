# Auditoría de código y preparación de lanzamiento

Fecha: 07/09/2026. Base app: `2acfe67`. Web pública: carpeta `triatlon-landing`, sin repositorio Git propio detectado.

## Alcance y límites

Inventario de app Next.js, componentes, servicios, pruebas, SQL y web pública; revisión dirigida a autenticación, autorización, datos sensibles, integraciones, pagos, eliminación de cuentas y requisitos de Apple. Ejecución de pruebas, lint, compilación y comprobaciones HTTP sin sesión. No es una certificación de que cada línea sea correcta ni una prueba de penetración exhaustiva.

No se han inspeccionado las políticas efectivas de producción, leído historiales privados, creado cuentas reales ni probado cobros o integraciones con cuentas de terceros. Los hallazgos SQL describen las migraciones locales; su exposición real depende también de las migraciones aplicadas, permisos de tabla y configuración remota. No se ha reproducido un ataque sobre usuarios reales.

## Verificación ejecutada

| Comprobación | Resultado |
| --- | --- |
| `npm test`, app | 140 pruebas correctas, 20 archivos |
| `npm run lint`, app y landing | Correcto con las reglas configuradas |
| `npm run build`, app y landing | Correcto, TypeScript incluido |
| Primer intento de build restringido | Falló al descargar Google Fonts; repetir con red permitió compilar |
| Smoke HTTP sobre build de producción local | 10/10 correctos; dashboard/chat redirigen en respuesta de streaming; API privadas 401 |
| `npm audit --omit=dev`, app | 5 paquetes afectados: 4 de gravedad alta, 1 moderada |
| `npm audit --omit=dev`, landing | 4 paquetes afectados, todos de gravedad alta |
| iOS / Xcode / TestFlight | No hay proyecto ni build iOS que comprobar |

Los avisos de dependencias no demuestran por sí solos explotabilidad en esta aplicación. Los tests usan dobles para varios servicios y no sustituyen pruebas reales de permisos. ESLint desactiva, entre otras, `rules-of-hooks`, `exhaustive-deps`, `no-explicit-any` y excluye archivos JS/MJS.

## P0 · Resolver antes de exponer datos reales

### A01. Administrador concedido por coincidencia parcial de correo

Evidencia: `app/admin/actions.ts`, función `checkAdminAccess`, líneas 375–401; existe copia en `app/(app)/owner/owner-actions.ts`.

La condición `user.email?.includes('guillermo')` concede acceso administrativo a un correo ajeno que contenga esa cadena. La función devuelve `true` aunque falle la actualización de `role`. Una cuenta verificada como `guillermo.prueba@example.org` cumpliría la condición; no se ha creado esa cuenta. `getBusinessMetrics` solo comprueba que exista sesión y no repite la autorización administrativa.

Corrección propuesta: autorización administrativa por ID inmutable, mantenida en servidor y no editable por el usuario; comprobarla dentro de cada acción administrativa, retirar ambos criterios por texto y probar usuario ordinario, administrador y correo parecido. La página protegida no basta para proteger una Server Action.

### A02. Perfiles de atletas visibles para cualquier usuario autenticado

Evidencia: `supabase/migrations/20260606000001_profiles_lookup_policy.sql`, líneas 4–7. Política `TO authenticated USING (role = 'athlete')`, sin vínculo entre solicitante y atleta. No se encontró su retirada en migraciones posteriores.

Los perfiles incorporan correo, datos de salud y `garmin_auth_tokens`/`strava_auth_tokens`; RLS restringe filas, no oculta automáticamente esas columnas. Un lector con permisos SELECT de tabla podría acceder a todos esos campos. `saveGarminCredentialsAction`, en `app/(app)/settings/actions.ts`, guarda `{ email, password }` directamente en JSON. No hay cifrado de aplicación en ese flujo.

Corrección propuesta: eliminar búsqueda amplia de perfiles, ofrecer búsqueda limitada mediante invitación o función con salida mínima; separar secretos en almacenamiento exclusivo de servidor, cifrado y con ciclo de revocación. Comprobar permisos efectivos con dos atletas y un entrenador no relacionado. Si producción contiene esas credenciales bajo la política, evaluar alcance, revocar/rotar los secretos afectados y gestionar el incidente según los hechos.

### A03. Relaciones de entrenador autoconcedidas y escritura global de sesiones

Evidencia: `20260606000000_b2b_coach_schema.sql`, política de inserción en `coach_athletes`: solo `auth.uid() = coach_id`; `status` nace como `active`. Las políticas derivadas autorizan lecturas de datos mediante esa relación. `20260606000002_coach_write_policies.sql`, líneas 59–73, permite insertar, actualizar y eliminar cualquier `training_sessions` a cualquier autenticado.

Consecuencia bajo esas políticas/permisos: un usuario podría crear su propia relación con otro atleta, y una sesión compartida podría alterarse o borrarse. La clave externa de `user_workouts.session_id` tiene `ON DELETE CASCADE`, lo que amplía el daño potencial de borrar plantillas.

Corrección propuesta: relación por invitación/aceptación verificadas y estado activo comprobado en todas las políticas; propiedad explícita para sesiones del entrenador y plantillas globales de solo lectura. Probar acceso directo a la base con credenciales ordinarias; los filtros del frontend no son controles de seguridad.

## P1 · Bloqueos de lanzamiento

### A04. Suscripción y rol modificables sin compra validada

`app/(app)/settings/actions.ts`, `updateSubscriptionStatus`, líneas 249–277, toma `free/pro/coach` del cliente y actualiza suscripción y rol sin verificar pago. `components/settings/billing-card.tsx` llama a esa acción. La política general de actualización del propio perfil tampoco protege columnas de privilegios en las migraciones revisadas.

Decidir si la versión será gratuita o comercial. Para cobrar por funciones digitales, implementar el mecanismo aplicable de Apple, comprobación de transacciones en servidor y restauración; proteger rol/suscripción en la base. Separar elegir un perfil profesional de obtener privilegios administrativos o permisos sobre otros atletas.

### A05. Dependencias con avisos de seguridad

App: Next.js 16.2.6; landing: 16.2.9. El registro consultado señala avisos de Next.js anteriores a 16.2.11, además de `postcss`, `sharp`, `nanoid`; la app añade `qs`. Guardados los informes completos en `evidencias/`. El registro propone Next 16.3.4 como posible resolución del árbol actual: **no se ha instalado ni validado**.

Actualizar dependencias y archivos de bloqueo de forma controlada, revisar compatibilidad y repetir pruebas, build y audit. No ejecutar una actualización forzada sin revisar sus cambios. El alcance de cada aviso depende de las funciones utilizadas y del despliegue.

### A06. Conexión Strava sin state vinculado a la sesión

`app/api/auth/telemetry/connect/route.ts`, líneas 27–32, usa valores previsibles `settings/onboarding` como `state`. `callback/route.ts`, desde línea 15, los interpreta para navegación pero no verifica un nonce de un solo uso vinculado al usuario antes de canjear el código.

Riesgo de vinculación OAuth no solicitada. Generar y comprobar state aleatorio, caducidad y consumo único en servidor; validar retorno y origen de mensajes de ventana. Probar rechazo de state ausente, alterado, reutilizado o perteneciente a otra sesión.

### A07. Datos personales enviados a IA sin consentimiento específico comprobado

`app/api/ai/chat/route.ts` llama a embeddings y generación tras autenticar/autorización, sin comprobar permiso específico para terceros IA. `lib/ai-context.ts:386` incluye nombre, lesiones, alergias y métricas en el contexto. `lib/ai-service.ts` usa Gemini y contempla Anthropic. La búsqueda de consentimiento solo encontró el banner de cookies.

Informar del proveedor y categorías reales, pedir permiso explícito antes de cualquier envío, persistirlo y verificarlo también en servidor. Minimizar el contexto y permitir retirar el permiso. La autorización del entrenador para ver un atleta no sustituye el consentimiento de ese atleta para compartir datos con IA. Revisar contratos y retención de los proveedores. Apple lo exige en 5.1.2(i); véase [fuentes](13-fuentes.md).

### A08. Éxitos simulados

- `settings/actions.ts`, `pushWeekWorkoutsToGarminAction`: espera 1,5 s y devuelve éxito sin enviar entrenamientos; incluso acepta una conexión Strava.
- `api/auth/telemetry/connect/route.ts`: si no entra en OAuth Strava crea tokens aleatorios y presenta conexión completa.
- `triatlon-landing/src/app/soporte/page.tsx:19`: espera 1 s y confirma mensaje registrado/respuesta en 24 h sin enviar ni guardar nada.
- `components/dashboard/ai-workout-generator.tsx`: devuelve `mockWorkouts`; `simulateWatchIngestion` sigue siendo una acción exportada.

Implementar los flujos que se vayan a ofrecer o retirarlos de la versión distribuida, tanto en UI como servidor. No anunciar envío al reloj, integraciones o soporte operativo hasta comprobarlo.

### A09. Eliminación de cuenta incompleta ante fallos de Apple

Sí existe: Ajustes → Eliminar cuenta → escribir ELIMINAR. En `settings/actions.ts:8`, un token/configuración ausente o una respuesta de revocación no correcta solo genera un log y se continúa borrando el usuario. Una excepción de red puede abortar el proceso y el componente no tiene `try/finally` para restaurar el estado.

Necesita revocación robusta con datos persistidos de forma segura o reautenticación, tratamiento de errores/reintentos y comprobación de todos los datos asociados, backups, integraciones y proveedores. No basta prometer «todos los datos» si solo se ha verificado `deleteUser`. Probar Apple después de renovar sesión, no solo justo tras el primer login.

### A10. Falta cliente iOS

No se encontraron `.xcodeproj`, `.pbxproj`, configuración Capacitor/Expo, entitlements ni manifiesto nativo de privacidad en el código propio. Un manifest PWA y web push no producen un binario App Store. Construir cliente iOS con valor funcional y probar OAuth, navegación, teclado, descargas y notificaciones. La aprobación de un contenedor web no está garantizada (guía 4.2).

### A11. Privacidad pública incompleta y declaraciones inexactas

La web afirma OAuth oficial para Garmin, pero existe el flujo de contraseña descrito. Afirma acceso exclusivo del usuario a datos que también se comparten con entrenadores. Faltan responsable, contacto de privacidad, plazos, proveedores IA, transferencias y bases de tratamiento. El formulario de soporte simulado hace que la URL de soporte no sea un canal fiable.

Completar los borradores de este paquete y aplicar las prácticas correspondientes antes de publicarlos. No declarar «no recopilamos datos»: se guardan perfiles, salud, actividad, mensajes e identificadores; también rutas Strava mediante `summary_polyline/raw_payload`.

## P2 · Calidad y validación adicional

- Chat individual/grupal: no se encontró flujo claro de denuncia/bloqueo/moderación; evaluar y completar para la funcionalidad social distribuida (guía 1.2).
- API IA: no se encontró cuota/límite propio por usuario. Añadir límites y presupuesto para evitar abuso y costes, además de límites del proveedor.
- `revalidateTag` se fuerza con `as any` y un solo argumento en Ajustes. La documentación local de Next lo considera obsoleto, aunque aún funciona. Elegir `updateTag` o la firma de dos argumentos según consistencia necesaria.
- El informe anterior habla de RAG vacío y Apple desactivado; son observaciones del 04/09, **no comprobaciones remotas de hoy**. Revalidar proveedores, conocimiento RAG, colas de Strava, cron y variables en producción.
- Métricas administrativas incluyen estimaciones/simulaciones. Etiquetarlas con precisión antes de tomar decisiones de ingresos o retención.
- Faltan pruebas de dispositivo iOS, VoiceOver, tamaño de texto, teclado, suspensión/reapertura, pérdida de red, aislamiento real entre cuentas y restauración de backups.

## Criterio de cierre

Cada A01–A11 requiere una corrección o una retirada explícita del alcance, pruebas de regresión y verificación del entorno que se publicará. Los resultados verdes de esta revisión no cierran estos hallazgos. No se ha modificado código funcional en esta tarea de auditoría/documentación.
