# Ajustes nativos y limpieza de Entreno

## Objetivo

Dejar la pestaña Entreno centrada en la sesión actual y el plan, y reunir configuración, conexiones y orientación en Ajustes con el patrón de listas agrupadas de iOS.

## Navegación

- **Entreno** conserva entrenamiento de hoy, próxima sesión y enlace al plan.
- Se eliminan de Entreno el acordeón “Actividad, logros y ajustes”, orientación, telemetría, objetivo, actividad reciente y logros.
- **Ajustes** contiene los destinos de configuración y orientación. Progreso conserva logros y actividad reciente.

## Ajustes

La pantalla usa fondo `systemGroupedBackground`, grupos blancos y filas de 44–56 pt. La tipografía es SF Pro mediante los estilos de sistema. Cada icono será un SF Symbol funcional, con un único color de acento semántico; no se usarán emoji ni iconos ilustrativos.

Grupos:

1. Perfil y objetivo: perfil, objetivo activo.
2. Entrenamiento: fisiología y zonas, plan, lesiones e historial.
3. Entrenador y orientación: orientación de la sesión y comunicación/estado del entrenador.
4. Dispositivos y datos: reloj, pulsómetro, fuentes conectadas y sincronización.
5. Cuenta: privacidad, datos, soporte y sesión.

## Configuración pendiente

Cuando falte un dato necesario para una experiencia personalizada (objetivo, zonas, dispositivo/fuente de salud o conexión del entrenador), Ajustes mostrará al inicio una sección compacta **Configuración pendiente**.

- Una fila resume el número de elementos pendientes y usa `exclamationmark.circle.fill` en naranja.
- Cada fila concreta muestra el estado `Pendiente` y abre directamente el ajuste necesario.
- No habrá alertas modales repetitivas: el aviso queda visible, no bloquea el uso y desaparece al completarse.

## Datos y comportamiento

La página de Ajustes carga el perfil, dispositivos, conexión de entrenador y los indicadores necesarios para construir la lista. Las acciones existentes (objetivo, zonas, dispositivos, privacidad, exportación y cierre de sesión) se conservan detrás de sus respectivas filas.

## Verificación

- Entreno no renderiza componentes de configuración ni el acordeón secundario.
- Ajustes muestra todos los destinos y únicamente los avisos pendientes aplicables.
- Las filas usan SF Symbols y se conservan accesibles por VoiceOver.
- Se ejecutan comprobación de tipos y pruebas relevantes.
