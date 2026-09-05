# Verificación de Triatlón Pro — 4 de septiembre de 2026

## Dictamen

La versión local compila y pasa las comprobaciones descritas abajo. **No está lista
para enviarse a App Store**: quedan integraciones sin validar, contenido RAG por
cargar y trabajo específico de iOS. No se ha publicado esta revisión ni se han
aplicado migraciones a la base de datos remota.

## Resultados comprobados

| Comprobación | Resultado y alcance |
| --- | --- |
| Suite automática | **137 pruebas, 19 archivos, todas correctas**. Solo la versión actual; se excluyeron las copias de `.claude/worktrees`. |
| Producción | `npm run build` correcto, TypeScript incluido; 36 páginas prerenderizadas. |
| Análisis de código | `npm run lint` correcto; revisión adicional de `react-hooks/rules-of-hooks` sin hallazgos. Varias reglas del proyecto siguen desactivadas: esto no equivale a un análisis exhaustivo. |
| HTTP sin sesión | **10 comprobaciones correctas**: login, dashboard, chat, API IA, notificaciones, exportación, cron, ejercicios, manifest y offline. Las páginas privadas redirigen al login dentro de la respuesta de streaming; las API privadas devuelven 401. |
| Navegador | Login visible. Biblioteca de ejercicios con resultados, búsqueda sin resultados y apertura de ficha comprobadas. A 390 × 844 se ven los cuatro accesos inferiores y los tres apartados de Entreno; Entreno mantiene `aria-current=page`. Sin errores de consola observados en esa pantalla. |
| Supabase configurado localmente | Las consultas responden 200. Existen las tablas de chat y del RAG. No se leyeron ni mostraron contenidos privados de mensajes. |
| Gemini real | `gemini-3.6-flash` respondió 200 con texto ante una consulta ficticia. `gemini-embedding-001` respondió 200 con 768 dimensiones. No se enviaron datos de atletas. |

La suite cubre lógica de entrenamiento, nutrición, zonas, clasificación de
actividades, autorización de exportaciones y notificaciones, cron, chat,
navegación, composición y aislamiento de contexto RAG, validación de la API IA,
errores de respuesta y compatibilidad de embeddings. Las pruebas de integración
automatizadas sustituyen las dependencias externas por dobles; las pruebas
reales de servicios se describen aparte y no validan toda la aplicación.

## Dashboard y RAG

El dashboard de atleta incluye `WorkoutAIFeedback`, que llama a `/api/ai/chat`.
La API autentica al usuario, determina el atleta autorizado, recupera su contexto,
consulta memorias y conocimiento, y añade ese contexto al prompt antes de generar.
Existe búsqueda semántica y alternativa textual.

La base de datos configurada localmente devolvió:

| Contenido | Registros |
| --- | ---: |
| `ai_knowledge_documents` | 0 |
| `ai_knowledge_chunks` | 0 |
| Fragmentos activos con embedding | 0 |
| `athlete_ai_memories` | 0 |

**Existe la implementación del RAG, pero no una base de conocimiento poblada.**
El contexto de perfil/plan es una fuente distinta; no debe confundirse con
documentos recuperados. Falta cargar fuentes revisadas, generar sus embeddings
con el mismo modelo y probar preguntas cuya respuesta se compruebe en las fuentes.
No se han insertado documentos sintéticos en la base real para aparentar cobertura.

## Correcciones realizadas durante esta revisión

- Se eliminó `ignoreBuildErrors` para que una publicación no oculte errores TypeScript.
- Se limitó Vitest a los tests de este proyecto, excluyendo copias de otras ramas.
- El estado de configuración de IA pasa del servidor al dashboard: el navegador
  ya no importa el servicio ni intenta consultar claves privadas del servidor.
- Los fallos de streaming se muestran como errores reintentables, no como consejos
  ni como un JSON pegado a una respuesta incompleta.
- El consejo alternativo dejó de afirmar que una sesión se había guardado sin prueba.
- Se sustituyó el embedding retirado por `gemini-embedding-001`, con 768 dimensiones
  explícitas, normalización y rechazo de vectores inválidos. En esta base no había
  vectores previos; en otras bases con vectores antiguos sería necesario reindexar.
- Tras comprobar fallos de generación con los modelos 2.0 y 2.5, se verificó 3.6
  y se actualizó el valor por defecto, el ejemplo y la configuración local.
  **También hay que actualizar `GEMINI_MODEL` en el despliegue**: una variable remota
  antigua prevalecería sobre el nuevo valor por defecto.
- Se añadieron pruebas de API IA, respuesta del dashboard, embeddings y navegación.

## Bloqueos antes de un lanzamiento

1. **Contenido RAG:** cargar y evaluar conocimiento real; verificar la recuperación
   y el aislamiento con cuentas de atleta/entrenador sobre la base real.
2. **Strava:** la consulta real de suscripciones devuelve **403**. Verificar las
   credenciales y permisos de la aplicación; todavía no se puede afirmar que estén
   llegando actividades. El receptor actual también necesita confirmación rápida
   y procesamiento duradero con reintentos.
3. **Garmin:** workflow horario preparado localmente, pero no publicado ni observado
   en ejecución. La conexión heredada almacena contraseña en el perfil; migrar a
   almacenamiento protegido/sesiones. Otras rutas de telemetría aún contienen
   conexiones simuladas y no deben presentarse como integraciones operativas.
4. **Chat:** pruebas locales de persistencia/reintento correctas y tabla remota
   accesible. Falta probar dos cuentas reales, cambio de red, suspensión/reapertura
   y teclado iOS. Aplicar el índice preparado y verificar backups/restauración.
   La eliminación de cuentas aún puede borrar mensajes por las relaciones CASCADE.
5. **Configuración:** faltan `NEXT_PUBLIC_SITE_URL` y `CRON_SECRET` en el entorno

## Acceso con Apple

- Se añadió el botón oficial localizado “Continuar con Apple”, con las medidas y colores indicados por Apple.
- El retorno OAuth solo admite rutas internas y ya no permite cambiar el rol de una cuenta existente.
- Se contemplan el correo privado y la ausencia de nombre en accesos posteriores de Apple.
- Ajustes incluye borrado definitivo dentro de la app y revocación de Apple cuando están disponibles el token y las credenciales.
- La consulta real al proyecto Supabase devuelve `apple: false` y `google: true`: falta activar Apple en Authentication > Providers antes de probar el acceso completo.
- Producción necesita `NEXT_PUBLIC_SITE_URL`, `APPLE_CLIENT_ID` y `APPLE_CLIENT_SECRET`.
   local inspeccionado. No se ha inspeccionado la configuración de producción.
6. **Controles incompletos:** el chat muestra acciones de adjuntos, emojis y audio
   que no tienen todavía un flujo funcional en ese componente. Implementarlas o
   retirarlas antes de presentar la app como terminada.

## Preparación de App Store

Este repositorio es una app Next.js con manifest PWA. No se encontró proyecto
iOS/Xcode, configuración Capacitor/Expo, firma ni un paquete listo para TestFlight.

El siguiente hito debería ser **una beta de TestFlight**, después de resolver los
bloqueos anteriores y preparar el cliente iOS, la cuenta de Apple Developer,
identificador, firma, enlaces de autenticación y notificaciones nativas.

También faltan un flujo de eliminación de cuenta accesible dentro de la app,
revisión de los datos de privacidad declarados, comprobación de compras si se venden
servicios digitales, y credenciales/instrucciones de prueba para App Review.
La política actual remite al soporte para eliminar la cuenta. Apple exige permitir
iniciar la eliminación desde la app cuando esta permite crear cuentas:
[requisitos de eliminación de cuenta](https://developer.apple.com/support/offering-account-deletion-in-your-app/).

Una envoltura web por sí sola no garantiza aceptación; revisar funcionalidad mínima
y el resto de requisitos en las
[App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).

## Repetir las comprobaciones

```sh
npm test
npm run lint
npm run build
npm run start -- --port 3100 --hostname 127.0.0.1
node scripts/smoke-http.mjs
node scripts/verify-services.mjs
node scripts/verify-services.mjs --probe-ai --ai-only
```

El último comando realiza dos llamadas mínimas con texto ficticio al proveedor IA.
El verificador de servicios solo consulta la base de datos y Strava, e imprime
estados y recuentos agregados; no publica cambios ni muestra credenciales.

Referencias técnicas consultadas:
[retirada de modelos Gemini](https://ai.google.dev/gemini-api/docs/deprecations),
[dimensiones y migración de embeddings](https://ai.google.dev/gemini-api/docs/embeddings).
