# Finalización e integración del RAG de IA para atletas

## Objetivo

Completar el RAG iniciado para que el chat de IA use contexto fiable, privado y relevante de cada atleta. El trabajo se consolidará primero en `prueba`, se validará contra Supabase remoto y después se integrará en `main` sin regresiones.

## Alcance

El sistema incluirá:

- memoria semántica aislada por atleta;
- conocimiento general de entrenamiento recuperable por similitud;
- contexto estructurado procedente del perfil, objetivos, planificación, entrenamientos, recuperación, nutrición y telemetría;
- generación y persistencia de embeddings exclusivamente en servidor;
- integración del contexto recuperado en el endpoint de chat existente;
- ciclo de vida explícito de memoria: propuesta, confirmación, revisión, expiración y desactivación;
- migraciones, tipos, pruebas y validación completa en Supabase remoto;
- promoción segura de `prueba` a `main`.

Quedan fuera del alcance una nueva interfaz de administración de conocimiento, el cambio de proveedor principal de IA y la reescritura visual del chat.

## Estrategia de integración

Se conservará el trabajo válido que existe en `worktree-promote-prueba-to-main`, pero se trasladará selectivamente a `prueba`. No se copiará el worktree completo ni se sobrescribirán cambios actuales. Cada archivo se comparará con su equivalente en `prueba`, se adaptará a la versión vigente y se verificará antes de continuar.

Una vez completado el RAG en `prueba`, las migraciones se aplicarán al proyecto Supabase remoto configurado. La promoción a `main` solo se realizará después de superar las comprobaciones de base de datos, tipos, lint, pruebas y build.

## Arquitectura

### Persistencia

Supabase/Postgres utilizará `pgvector` y dos dominios separados:

- `athlete_ai_memories`: hechos o preferencias relacionados con un atleta, con estado, procedencia, fechas de revisión y expiración, y embedding de 768 dimensiones;
- `ai_knowledge_chunks`: fragmentos de conocimiento general, versionados y etiquetados por deporte o categoría, con embedding de 768 dimensiones.

Los índices vectoriales HNSW acelerarán la búsqueda por similitud. Los índices relacionales cubrirán atleta, estado, expiración, categoría y deporte.

### Seguridad

RLS garantizará que un atleta solo pueda leer sus memorias y que un entrenador únicamente acceda a atletas con relación activa. Las escrituras directas a tablas de memoria estarán bloqueadas para clientes autenticados.

Las operaciones de propuesta, confirmación, revisión y desactivación se realizarán mediante funciones SQL con validación de identidad y permisos. La escritura del embedding utilizará una función interna concedida únicamente a `service_role`. Las funciones fijarán un `search_path` seguro y limitarán longitud, estados y parámetros de búsqueda.

### Recuperación

Para cada mensaje del usuario:

1. se valida la sesión y se identifica al atleta autorizado;
2. se carga contexto estructurado reciente y relevante;
3. se genera el embedding de la consulta en servidor;
4. se recuperan memorias confirmadas, activas y no caducadas del mismo atleta;
5. se recuperan fragmentos generales activos y pertinentes;
6. se deduplican y recortan los resultados conforme al presupuesto de contexto;
7. se construye un bloque de contexto claramente delimitado y se envía al modelo de chat.

La búsqueda vectorial aplicará límites estrictos, umbral de similitud acotado y filtros por deporte cuando sean aplicables. Los resultados nunca cruzarán identidades de atletas.

### Degradación segura

Si la generación de embeddings o una consulta vectorial falla, el chat continuará usando el contexto estructurado disponible. El fallo se registrará en servidor sin exponer secretos ni detalles internos al cliente. Un fallo del RAG no debe convertir un mensaje válido en un error total salvo que también falle el proveedor de chat.

## Construcción del contexto

El módulo de contexto será independiente del endpoint HTTP y tendrá límites explícitos por sección. Normalizará valores ausentes, fechas, unidades y texto libre antes de producir el prompt.

El contexto distinguirá entre:

- datos actuales del sistema;
- memorias confirmadas por el usuario;
- conocimiento general recuperado;
- inferencias o datos provisionales.

El prompt indicará al modelo que priorice los datos actuales, no invente métricas, trate las memorias como contexto revocable y no presente conocimiento general como diagnóstico médico.

## Ciclo de vida de memoria

Una memoria nueva se crea inicialmente como propuesta. Solo una confirmación autorizada la convierte en memoria recuperable permanente. Las memorias podrán marcarse para revisión, caducar automáticamente o desactivarse. El contenido se normalizará y limitará antes de almacenarse; el embedding se calculará después desde el servidor.

Las propuestas duplicadas o casi idénticas no deberán multiplicar contexto innecesariamente. La recuperación excluirá memorias inactivas, no confirmadas o vencidas.

## Validación

Las pruebas automatizadas cubrirán como mínimo:

- construcción determinista y acotada del contexto;
- recuperación con y sin embedding;
- degradación ante errores del proveedor de embeddings;
- aislamiento entre atletas;
- permisos de atleta, entrenador y `service_role`;
- rechazo de escrituras directas y entradas inválidas;
- estados de confirmación, revisión, expiración y desactivación;
- integración del contexto en el endpoint de chat sin alterar su contrato público.

La validación local incluirá comprobación de tipos, lint, suite de Vitest y build de producción. En Supabase remoto se verificará la existencia y permisos de tablas, índices, políticas y funciones, además de una búsqueda vectorial de prueba que no exponga datos de otros atletas.

## Despliegue y promoción

Antes de aplicar migraciones se comprobarán el proyecto remoto enlazado, el historial de migraciones y las variables requeridas, sin imprimir secretos. Las migraciones serán incrementales y compatibles con el estado ya desplegado.

Después de aplicarlas se ejecutarán verificaciones de esquema y permisos. Si una comprobación falla, no se promoverá `main`; se corregirá mediante una nueva migración segura en lugar de reescribir una migración ya aplicada.

Con todas las validaciones superadas, `prueba` se integrará en `main`. Se resolverán conflictos archivo por archivo, preservando cambios existentes, y se repetirá la validación completa sobre el resultado final de `main`.

## Criterios de aceptación

- El chat responde usando contexto individual relevante cuando existe.
- La ausencia o caída del componente vectorial no rompe el chat.
- Ningún usuario puede leer o modificar memorias de un atleta no autorizado.
- Los clientes no pueden persistir embeddings directamente.
- Las migraciones remotas terminan correctamente y sus permisos coinciden con el diseño.
- Tipos, lint, pruebas y build pasan tanto en `prueba` como tras la integración en `main`.
- `main` contiene todo el RAG terminado sin perder cambios previos de ninguna rama.
