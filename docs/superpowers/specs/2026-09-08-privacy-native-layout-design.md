# Privacidad con el diseño de Soporte

## Objetivo

Mostrar la política de privacidad de TriWaveX con la misma lectura limpia que la pantalla de Soporte dentro de la aplicación iOS.

## Diseño

- Eliminar la cabecera interna de la web, la tarjeta envolvente y los controles de vuelta al panel.
- Mantener el fondo, ancho y tipografía que usa Soporte: contenido centrado, márgenes amplios y secciones en flujo vertical.
- Conservar sin cambios el contenido legal existente, agrupado bajo sus cuatro apartados actuales.
- Añadir un bloque de contacto de privacidad que abre un correo a `privacy@triwavex.com`.
- La cabecera y el cierre permanecen a cargo del contenedor nativo de iOS; no se duplica navegación en la página web.

## Verificación

- Comprobar tipos y lint de la página.
- Confirmar que la ruta no activa la navegación inferior del contenedor nativo.
- Publicar el cambio en la rama `prueba` para `staging.triwavex.com`.
