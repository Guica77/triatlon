# Gestión nativa del plan

## Objetivo

Dar al atleta una entrada de gestión del plan desde Perfil que no le envíe simplemente a la pestaña de calendario ni repita el onboarding.

## Flujo

La fila actual de Perfil abrirá una hoja nativa llamada **Gestionar mi plan**. Mostrará cuatro acciones claras:

1. **Editar sesiones**: abre el calendario existente para mover una sesión o actualizar su estado.
2. **Cambiar objetivo**: abre la edición existente de objetivo y fecha de carrera.
3. **Subir carga**: permite elegir semana completa o una disciplina y nivel suave, medio o alto. Antes de guardar mostrará qué volumen cambia y una advertencia de recuperación.
4. **Ver recomendaciones**: muestra la explicación de la última recomendación adaptativa, sin aplicar ningún cambio automáticamente.

## Reglas

- El atleta sin entrenador confirma los cambios después de una vista previa.
- Cuando el plan está gestionado por entrenador, las mismas acciones se presentan como una solicitud; no cambian el plan de forma automática.
- El aumento de carga nunca puede modificar sesiones completadas ni aplicar un cambio sin confirmación.
- El flujo usa pantallas y hojas SwiftUI del sistema, con etiquetas explícitas, estados de carga y error, y soporte de Dynamic Type.

## Datos y verificación

La versión inicial reutilizará el motor de vista previa y confirmación del plan para el movimiento de sesiones. Las acciones que requieran un ajuste de volumen necesitan un endpoint específico y una simulación de reglas antes de persistir. Se verificarán mediante pruebas de cliente, compilación Release y prueba manual tanto con atleta autónomo como con entrenador.
