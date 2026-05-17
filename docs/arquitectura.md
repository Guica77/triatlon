# Arquitectura del Proyecto

Esta es la justificación de cada carpeta en el proyecto:

- **app/**: Para las páginas, rutas y layouts (App Router de Next.js).
- **components/**: Exclusivamente para componentes visuales de React.
- **lib/**: Para la lógica de negocio, conexiones a APIs (Stripe, Resend) y utilidades puras de TS.
- **hooks/**: Para los React Hooks personalizados (ej. use-user.ts).
- **supabase/migrations/**: Donde se guarda el historial de todos los cambios de tu base de datos en archivos .sql.
- **scratch/**: Carpeta "borrador". Es súper útil para dejar scripts sueltos (repair_db.ts), probar plantillas HTML (mock-invoice.html) o correr scripts rápidos sin que ensucien el código principal de la app.
- **.agents/ y .next/**: No las tienes que crear, se autogeneran. `.next/` al compilar la app, y `.agents/` la crea la herramienta de IA que estás utilizando para guardar tu contexto.
- **scripts/**: Para scripts automatizados o herramientas internas.
- **docs/**: Para documentación del proyecto.
- **informacion-general/**: Para guardar notas o información relevante sobre el dominio del problema.
- **images/**: Para recursos gráficos e imágenes de diseño (mockups, etc).
- **types/**: Para las definiciones de tipos globales en TypeScript.
