# Pulido Apple de la experiencia de atleta

## Objetivo

Hacer que TriWaveX se perciba como una sola aplicación iPhone: conservar la paleta aqua, lima y coral, pero unificar la web móvil dentro del contenedor nativo con la geometría, la jerarquía y el movimiento sobrio de Apple.

## Alcance

- Aplicar una columna de contenido y un sistema de espaciado comunes al inicio, chat/directorio de entrenador, ajustes y conexiones.
- Hacer que controles principales y secundarios compartan tamaños táctiles, cápsulas, materiales y estados de pulsación.
- Mantener la barra de navegación SwiftUI como marco nativo y evitar que el contenido web duplique navegación.
- Sustituir cargas genéricas por el símbolo de TriWaveX, sin introducir imágenes o marcas nuevas.

## Sistema visual

- Contenido móvil: ancho fluido con un máximo común, relleno lateral de 16--20 pt y agrupaciones separadas por 24 pt.
- Superficies: material oscuro, borde de un píxel y sombra interior muy tenue; los colores TriWaveX solo comunican acción o disciplina.
- Controles: mínimo de 44 pt, acción primaria en cápsula con color de la disciplina o acento, secundaria translúcida con borde fino.
- Tipografía: títulos breves y jerárquicos; texto auxiliar limitado a un ancho legible para no desplazar las acciones.

## Carga y movimiento

- La carga mostrará `TriWaveXMark` centrado sobre la misma superficie de la pantalla, con una transición corta de opacidad y escala.
- Cuando no esté activado “Reducir movimiento”, el símbolo tendrá una pulsación muy ligera y no repetitiva que no retrase el contenido.
- Con “Reducir movimiento”, solo se usará aparición/desaparición sin desplazamiento ni escala.
- Los errores conservan el mismo marco, con una acción clara de reintento.

## Arquitectura

- La web móvil consume tokens y utilidades de estilo compartidas; no se duplican variantes de tarjeta por pantalla.
- `ProductView` continúa siendo responsable de navegación, carga, error y áreas seguras nativas.
- El símbolo existente de `TriWaveXMark` se reutiliza en web y SwiftUI para evitar dos identidades visuales.

## Validación

- Comprobar en anchos de iPhone que no haya desbordamiento ni columnas desalineadas.
- Ejecutar pruebas, comprobación de tipos y compilación de simulador iOS.
- Verificar que “Reducir movimiento” elimina escala y movimiento en las cargas.
