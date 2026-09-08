# Panel local de operaciones TriWaveX

## Objetivo

Crear una ruta local de solo lectura para revisar métricas reales de producto y el estado del RAG sin depender del acceso de administrador de la aplicación.

## Alcance

- Mostrar churn, retención, usuarios, actividad y métricas de negocio existentes.
- Mostrar documentos y chunks del RAG con sus estados activo/inactivo.
- Consultar datos reales de Supabase mediante el cliente de servidor con privilegios.
- Bloquear la ruta cuando `NODE_ENV=production` para impedir su publicación accidental.
- No incluir acciones de escritura, credenciales ni secretos en la interfaz.

## Arquitectura

La ruta `/local-dashboard` será un Server Component. Obtendrá las métricas de negocio reutilizando `getBusinessMetrics()` y consultará las tablas de conocimiento con el cliente administrativo del servidor. La presentación quedará separada en tarjetas simples para que un fallo de una consulta no oculte el resto del panel.

## Datos y estados

El panel mostrará valores reales cuando estén disponibles. Si una tabla no existe, está vacía o una consulta falla, se mostrará el estado concreto de esa sección en vez de inventar datos. Los errores no expondrán mensajes de Supabase ni claves.

## Seguridad

La ruta devolverá `404` fuera de desarrollo. El cliente administrativo solo se ejecutará en el servidor y nunca se enviará al navegador. El panel será de lectura.

## Validación

Se ejecutarán typecheck, lint dirigido y las pruebas existentes relacionadas con administración y conocimiento.
