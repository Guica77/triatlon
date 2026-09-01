# Optimización de ejercicios y dashboard

## Objetivo

Reducir el tiempo de carga inicial y el JavaScript enviado al navegador, especialmente en móvil, sin cambiar el diseño visual ni los contratos públicos de la aplicación.

## Alcance

La primera fase optimizará dos superficies:

- la biblioteca de ejercicios, evitando enviar los 1.324 registros al navegador;
- el dashboard del atleta, priorizando la información del día y difiriendo contenido secundario pesado.

No se migrará el catálogo de ejercicios a Supabase, no se rediseñará la interfaz y no se cambiarán proveedores externos.

## Biblioteca de ejercicios

El catálogo JSON permanecerá como fuente local del servidor. Un endpoint `GET /api/exercises` aceptará página, búsqueda, categoría y equipamiento, validará sus parámetros y devolverá únicamente los resultados de la página solicitada junto con los totales necesarios para la navegación y los filtros.

La página de ejercicios dejará de importar el JSON y el cargador completo en un componente cliente. Mantendrá el mismo comportamiento visible, pero realizará peticiones cancelables y mostrará un estado de carga al cambiar filtros o página. La búsqueda tendrá un pequeño debounce para evitar una petición por pulsación.

El endpoint limitará el tamaño de página, normalizará consultas y podrá reutilizar en memoria el catálogo ya transformado durante la vida del proceso. Las imágenes usarán carga diferida y los GIF completos solo se solicitarán al abrir o visualizar el contenido que los necesita.

## Dashboard progresivo

El render inicial priorizará:

- entrenamiento y acción principal del día;
- recuperación y biometría esencial;
- nutrición necesaria para la jornada.

Calendario ampliado, analíticas, actividad histórica, insignias y modales no críticos se separarán en límites de carga diferida cuando puedan hacerlo sin cambiar el comportamiento. Los componentes interactivos grandes se dividirán por responsabilidad para que Next.js genere fragmentos más pequeños.

Las consultas iniciales dejarán de usar selecciones amplias cuando solo se necesite un subconjunto de columnas. Las consultas independientes continuarán ejecutándose en paralelo. No se aplicará caché compartida a datos privados del atleta salvo que la identidad forme parte inequívoca de la clave y la invalidación sea segura.

## Estados y errores

La biblioteca conservará los resultados anteriores durante una navegación breve para evitar parpadeos. Si una petición falla, mostrará un mensaje recuperable y permitirá reintentar. Una respuesta obsoleta no podrá sobrescribir filtros posteriores.

Los módulos diferidos del dashboard usarán estados de carga compatibles con el diseño actual. Un fallo de una sección secundaria no debe impedir mostrar la acción principal del día.

## Validación

Se añadirán pruebas para:

- validación, filtrado y paginación del catálogo;
- límites de página y consultas vacías;
- estabilidad de resultados y totales;
- manejo de respuestas obsoletas o fallidas en la página;
- preservación del contenido prioritario del dashboard.

La validación final incluirá TypeScript, lint, suite completa de Vitest y build de producción. Se comparará además que el módulo cliente de ejercicios ya no incluya el JSON completo y se registrarán los tamaños relevantes antes y después.

## Criterios de aceptación

- La página de ejercicios no incorpora `exercises-lite.json` en su bundle cliente.
- Cada petición devuelve como máximo el límite permitido y conserva filtros y paginación actuales.
- El dashboard muestra primero la información accionable sin esperar a módulos secundarios pesados.
- No se producen regresiones visuales ni funcionales en ejercicios o dashboard.
- Tipos, lint, pruebas y build terminan correctamente.
