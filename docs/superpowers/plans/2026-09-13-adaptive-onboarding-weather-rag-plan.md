# Plan de implementación: alta, tiempo y conocimiento privado

1. Revisar el acceso actual, las acciones de OAuth y el wizard de onboarding para reutilizar sus contratos y conservar Apple Sign In.
2. Añadir al onboarding un modelo de pasos por rol, respuestas binarias sin símbolos y control de confirmación por deslizamiento con accesibilidad equivalente.
3. Persistir las respuestas nuevas necesarias sin sustituir datos confirmados existentes; permitir reanudar y editar desde Perfil.
4. Crear reglas puras de ajuste meteorológico y pruebas unitarias para condiciones extremas, sesión interior y ausencia de datos.
5. Exponer una propuesta en la ficha de entrenamiento con acciones explícitas Aplicar ajuste y Mantener plan, conservando el original.
6. Diseñar la ampliación de RAG privado como migración y flujo de ingestión: propiedad del entrenador, relación activa de atleta, documento/PDF y transcripción de vídeo. No habilitar carga de vídeo hasta contar con un procesador de transcripción y límites de almacenamiento.
7. Ejecutar comprobaciones TypeScript, pruebas y build de Next; compilar Swift y probar en iPhone físico antes de publicar.
