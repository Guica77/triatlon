# Triathlon Training Methodology Research Pack

Documento aportado por el titular el 7 de septiembre de 2026, conservado íntegro en `source.txt` (SHA-256 `bdc18181d811187e78cb88f758b0f2bb6d016e781d01176cd3b1ba30b70240c9`).

## Integración

- `manifest.json`: documento y 80 fragmentos deterministas de sus 11 secciones y 24 referencias. La introducción y el resumen permanecen en el original; la recuperación indexa el desarrollo de los temas.
- Cada fragmento cabe en el límite existente de 1.200 caracteres e incluye su cautela de evidencia. Los fragmentos temáticos conservan los enlaces citados en su sección y etiquetas en español para facilitar las consultas de la app.
- Las referencias se conservan como aportadas: no se presenta el pack como una revisión científica exhaustivamente verificada ni sus sesiones de ejemplo como protocolos universales.
- No se modifican recomendaciones ni planes de atletas al importar conocimiento.

## Importación reproducible

Desde la raíz de la app:

```sh
node scripts/ingest-training-methodology.mjs
node scripts/ingest-training-methodology.mjs --apply
```

El primer comando solo valida y muestra el inventario. El segundo usa las credenciales de servidor ya configuradas para generar vectores normalizados de 768 dimensiones con el modelo de embeddings del proyecto y escribir en `ai_knowledge_documents` y `ai_knowledge_chunks`. No imprime claves ni errores de proveedor que puedan contenerlas.

Los identificadores dependen del contenido y de la versión del fragmentador. Repetir la importación idéntica devuelve `already-imported`. Una versión nueva obtiene otros identificadores; las versiones anteriores no se borran ni se desactivan implícitamente. Al cambiar las reglas de fragmentación debe incrementarse la versión del fragmentador.

Todos los vectores se calculan antes de escribir. Un documento nuevo permanece inactivo mientras se cargan y verifican los fragmentos. Se activa al final y se comprueba su recuperación mediante la función vectorial existente.

## Resultado remoto comprobado

- Estado: `imported-and-retrievable`.
- Documento: `f475117d-6f40-5e42-a231-1fc804104781`.
- 80 fragmentos activos; vectores de 768 dimensiones.
- Segunda ejecución: `already-imported`, sin duplicados.
- Consulta sintética en español sobre recuperación, sueño y ACWR: HTTP 200, 6 coincidencias, 5 de recuperación, similitud superior 0.830277 con el umbral existente de 0.5.
- Seis pruebas nuevas de integridad, determinismo, referencias, tamaño, revisión de identidad y recuperación textual. Suite completa: 189 pruebas superadas.

Esta importación solo escribe conocimiento general en las tablas existentes. No aplica las migraciones de seguridad o moderación pendientes ni configura Apple/Google.
