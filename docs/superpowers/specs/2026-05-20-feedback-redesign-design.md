# Especificación Técnica: Rediseño y Mejoras del Apartado de Feedback

Este documento detalla la reestructuración y mejoras del apartado de sugerencias y feedback de la aplicación, renombrándolo de "Entrenador" a "Feedback", mejorando la experiencia de escritura y agregando características premium de diseño (Opción C - Pro Max).

## 1. Objetivos y Cambios Generales
- **Renombrar sección**: Cambiar la denominación de "Entrenador" a "Feedback" en toda la interfaz de usuario.
- **Cambio de ruta (URL)**: Mover la ruta `/coach-portal` a `/feedback`.
- **Textarea auto-expandible**: Permitir la escritura ilimitada en el campo de descripción del feedback mediante el auto-crecimiento de la altura de la caja de texto.
- **Mejoras UX/UI Premium**:
  - Incorporación de contador de caracteres en tiempo real.
  - Diseño optimizado de las tarjetas y estados de las sugerencias.
  - Selector de categorías y atletas mejorado.
  - Filtros interactivos para la lista de sugerencias enviadas.
  - Micro-animaciones y estados de carga pulidos con Framer Motion.

## 2. Cambios de Arquitectura y Archivos

### 2.1 Pestaña en Navegación y Rutas
- **[MODIFY] [mobile-bottom-nav.tsx](file:///Users/guillermohaya/Desktop/triatlon/triatlon-app/components/ui/mobile-bottom-nav.tsx)**:
  - Cambiar `{ href: '/coach-portal', label: 'Entrenador', icon: Users }` por `{ href: '/feedback', label: 'Feedback', icon: MessageSquare }`.
  - Importar `MessageSquare` de `lucide-react`.

### 2.2 Reestructuración de Páginas (Rutas)
- **[NEW] [page.tsx](file:///Users/guillermohaya/Desktop/triatlon/triatlon-app/app/feedback/page.tsx)**:
  - Nueva página que reemplaza a `app/coach-portal/page.tsx`.
  - Actualizar títulos a "Centro de Feedback" y "Sugerencias y Mejoras".
  - Mantener la integración con las acciones de base de datos para cargar atletas y sugerencias.
- **[DELETE] [page.tsx](file:///Users/guillermohaya/Desktop/triatlon/triatlon-app/app/coach-portal/page.tsx)**:
  - Eliminar el portal antiguo de entrenadores.

### 2.3 Formulario de Feedback
- **[MODIFY] [coach-suggestion-form.tsx](file:///Users/guillermohaya/Desktop/triatlon/triatlon-app/components/feedback/coach-suggestion-form.tsx)** (o renombrado):
  - Integrar `useRef` para calcular el `scrollHeight` del textarea en tiempo real para el comportamiento auto-expandible.
  - Añadir un contador de caracteres dinámico (ej: `142 / 2000`).
  - Añadir estados animados en el envío con Framer Motion.
  - Rediseñar los botones de categoría: "Mejora App", "Ajuste Plan", "Incidencia/Bug" y "Otro".

### 2.4 Filtros en el Histórico de Sugerencias
- **[MODIFY] [page.tsx](file:///Users/guillermohaya/Desktop/triatlon/triatlon-app/app/feedback/page.tsx)** (Componente de visualización):
  - Implementar un selector de pestañas para filtrar la lista de sugerencias enviadas: `Todas`, `Pendientes`, `En Revisión`, `Implementadas`.
  - Añadir transiciones suaves de entrada/salida para los elementos filtrados usando Framer Motion.

## 3. Plan de Verificación

### 3.1 Pruebas de Interfaz y Navegación
- Verificar que la pestaña de "Feedback" funciona en la barra de navegación móvil y de escritorio.
- Comprobar que la nueva URL `/feedback` es accesible y que `/coach-portal` redirige o ya no está activa.

### 3.2 Pruebas de Funcionamiento
- Escribir un texto largo en el área de sugerencia y comprobar que la caja de texto se expande dinámicamente sin barra de scroll interna.
- Enviar sugerencias con éxito y observar las micro-animaciones de confirmación.
- Utilizar los filtros del histórico y validar que las tarjetas se filtran correctamente según su estado.
