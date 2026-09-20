# Skill Observations

### Observation 1: Aislar DerivedData en builds iOS paralelos

**Status:** OPEN
**Date:** 2026-09-10
**Session context:** Validación local reproducible de la aplicación web y del cliente SwiftUI iOS.
**Skill:** task-observer
**Type:** internal
**Phase/Area:** Validación de toolchain

**Issue:** Dos builds `xcodebuild` concurrentes sobre el mismo DerivedData fallaron con `unable to attach DB ... build.db: database is locked`, aunque el proyecto compiló correctamente al repetirlos con rutas `-derivedDataPath` distintas.

**Suggested improvement:** En procedimientos de validación paralela, asignar siempre un `-derivedDataPath` temporal único por build iOS o serializar builds que compartan DerivedData.

**Principle:** Las validaciones paralelas que escriben índices o bases de datos de build deben aislar su directorio de artefactos para que un bloqueo de infraestructura no se confunda con un fallo del código.

### Observation 2: Separar fallos preexistentes de la validación visual

**Status:** OPEN
**Date:** 2026-09-19
**Session context:** Auditoría Apple Design del shell autenticado de TriWaveX y validación del repositorio con cambios locales de backend/iOS.
**Skill:** triatlon-app:apple-design
**Type:** internal
**Phase/Area:** Validación de cambios acotados

**Issue:** Lint pasó, pero el type-check, build y cuatro tests fallaron en archivos de Apple/native billing y sesiones nativas que ya estaban modificados fuera del alcance de la auditoría visual; una validación global no distingue automáticamente esos fallos de una regresión del shell.

**Suggested improvement:** Antes de cerrar tareas visuales, registrar el alcance de archivos modificados y complementar la validación global con checks enfocados en los archivos o suites tocados.

**Principle:** La evidencia de validación debe atribuir cada fallo al cambio correcto; cuando el árbol contiene trabajo paralelo, separar checks de alcance de checks globales evita reparar código ajeno o declarar una regresión visual inexistente.
