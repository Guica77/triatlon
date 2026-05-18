# Rediseño del Upper Deck (Cabecera del Dashboard) — Enfoque Bento / Doble Nivel

- **Fecha**: 2026-05-18
- **Estado**: Aprobado
- **Autor**: Antigravity (UI/UX Pro Max & Frontend Design)
- **Objetivo**: Resolver la colisión visual y saturación de la cabecera del dashboard (`app/dashboard/page.tsx`) en pantallas móviles (375px), adoptando una arquitectura limpia de dos niveles (Bento Header) que mantenga una estética premium, de alto rendimiento y táctica.

---

## 1. Arquitectura y Estructura de Componentes

El componente de cabecera en `app/dashboard/page.tsx` se reestructurará pasando de un contenedor único con `flex-wrap` a una jerarquía clara de dos niveles (filas) independientes.

### Nivel 1: Fila Superior (Identidad y Salida)
- **Propósito**: Mostrar la identidad del atleta y permitir la salida rápida del sistema sin elementos distractores.
- **Contenedor Principal**: `flex justify-between items-center px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 backdrop-blur-md sticky top-0 z-50`
- **Sección Izquierda (Identidad)**:
  - Contenedor `flex items-center gap-3`.
  - **Icono**: Caja oscura `w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-inner` con el icono `Trophy` (`w-4 h-4 text-zinc-300`).
  - **Textos**: 
    - Título del Plan: `<h1 className="text-base font-medium text-zinc-50 truncate max-w-[200px] sm:max-w-none">{activePlan?.name}</h1>` (garantiza que no empuje al botón de salir en pantallas pequeñas).
    - Subtítulo: `<p className="text-xs text-zinc-400 capitalize truncate">Atleta: {profile.first_name || 'Triatleta'} • Nivel {profile.level}</p>`
- **Sección Derecha (Salida)**:
  - Formulario de cierre de sesión (`/auth/signout`).
  - Botón compacto `<AnimatedButton variant="ghost" size="icon" className="w-9 h-9 text-zinc-500 hover:text-red-400 ml-2">` con el icono `LogOut`.

### Nivel 2: Fila Inferior (Barra de Píldoras de Acción / Quick Actions)
- **Propósito**: Ofrecer acceso directo y fluido a las acciones secundarias del sistema sin saturar la cabecera principal.
- **Contenedor Principal**: `flex items-center gap-2 px-6 py-2.5 bg-zinc-950/60 border-b border-zinc-800/50 overflow-x-auto scrollbar-none` (permite scroll horizontal suave en dispositivos móviles).
- **Botones (Píldoras)**:
  - **Material 2ª Mano**: `<AnimatedButton variant="ghost" size="sm" className="rounded-full text-xs py-1.5 px-3.5 border border-cyan-500/30 bg-cyan-500/10 flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 shadow-sm shrink-0">` (con icono `ShoppingBag`).
  - **Analíticas**: `<AnimatedButton variant="ghost" size="sm" className="rounded-full text-xs py-1.5 px-3.5 border border-zinc-800 bg-zinc-900/50 flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 shrink-0">` (con icono `BarChart2`).
  - **Cambiar Plan**: `<AnimatedButton variant="ghost" size="sm" className="rounded-full text-xs py-1.5 px-3.5 border border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:text-zinc-100 shrink-0">`

---

## 2. Flujo de Datos y Manejo de Errores

- **Origen de Datos**: Se mantienen intactas las consultas existentes en `app/dashboard/page.tsx` (`supabase.auth.getUser()`, tabla `profiles`, relación `training_plans`).
- **Manejo de Valores Nulos / Fallbacks**:
  - `profile.first_name`: Fallback a `'Triatleta'`.
  - `activePlan?.name`: Uso de opcional `?.` y truncamiento por CSS (`truncate`).
- **Comportamiento Responsive**:
  - En móvil (`< 640px`): El Nivel 1 mantiene el título truncado y el botón de salir visibles. El Nivel 2 permite deslizar horizontalmente si los botones exceden los 375px de ancho.
  - En desktop (`>= 640px`): El contenedor se expande de forma natural, mostrando todas las píldoras alineadas sin necesidad de scroll.

---

## 3. Plan de Pruebas (QA)

1. **Prueba de Colisión en Móvil (375px)**:
   - Verificar con herramientas de desarrollo que el título del plan y el botón de salir permanecen en una única línea horizontal sin solaparse.
   - Comprobar que la barra inferior de píldoras permite hacer scroll horizontal de forma fluida y táctil.
2. **Prueba de Contraste y Accesibilidad (UI/UX Pro Max)**:
   - Confirmar que los textos cyan (`#22d3ee`) sobre fondo oscuro (`#09090b` / `#18181b`) cumplen con el ratio de contraste mínimo 4.5:1.
3. **Prueba de Enlaces y Acciones**:
   - Validar que cada píldora redirige correctamente a `/marketplace`, `/analytics` y `/onboarding`.
   - Validar que el botón `LogOut` ejecuta correctamente el formulario POST hacia `/auth/signout`.
