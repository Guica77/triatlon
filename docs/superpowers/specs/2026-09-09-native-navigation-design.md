# Navegación nativa de TriWaveX

## Objetivo

Eliminar la barra superior global duplicada en la experiencia de TriWaveX dentro de la app iPhone. La navegación principal queda concentrada en la barra inferior existente.

## Alcance

- Solo se aplica cuando la página se muestra con el agente de usuario de TriWaveX nativo.
- La navegación web en navegador no cambia.
- La barra inferior mantiene sus siete destinos: Entreno, Recuperación, Ejercicios, Análisis, Resumen, Chat y Ajustes.
- Las páginas internas pueden conservar una cabecera compacta con atrás y título cuando sea necesaria para el contexto.

## Diseño

- No se muestra una barra superior de navegación global en iPhone.
- El contenido respeta el área segura superior e inferior del dispositivo.
- Los controles de la app usan proporciones, radio, contraste, estados presionados y jerarquía propios de iOS: fondo de material, bordes sutiles y respuesta breve al toque.

## Verificación

- El navegador web conserva su navegación actual.
- La vista nativa no muestra dos barras de navegación.
- Todos los destinos siguen accesibles desde la barra inferior.
