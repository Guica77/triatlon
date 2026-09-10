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
