# Lista de intervalos nativa

## Objetivo

Convertir los intervalos del dispositivo en una lista de entrenamiento clara y sobria, coherente con SwiftUI y las listas de Apple. La información debe ser más importante que la decoración.

## Decisión aprobada

Se adopta la opción C: código por línea.

- Se elimina el recuadro gris que hoy encierra cada icono.
- Cada bloque se identifica mediante una línea vertical fina a la izquierda.
- El color de la línea expresa la función del bloque: activación, intervalo, recuperación, repetición o vuelta a la calma.
- El nombre y la condición quedan alineados como una fila de lista; el objetivo se muestra a la derecha como texto secundario, sin cápsulas pesadas.
- El título cambia de «Intervalos del dispositivo» a «Series e intervalos» para que sea comprensible tanto con como sin dispositivo conectado.

## Comportamiento y accesibilidad

- Se mantienen los datos existentes de tiempo, distancia, ritmo, potencia y frecuencia cardiaca.
- El significado no depende solo del color: cada fila conserva su etiqueta textual.
- La jerarquía usa la tipografía del sistema, con título en peso semibold y metadatos en color secundario.
- No se añaden animaciones decorativas ni iconos sustitutos.

## Alcance

El cambio se limita al detalle de entrenamiento en la web, que es también la vista mostrada dentro de la app SwiftUI. No modifica la estructura de los entrenamientos ni su sincronización con dispositivos.

## Verificación

- Comprobación de tipos de TypeScript.
- Pruebas existentes y lint.
- Revisión visual en pantalla estrecha y ancha para confirmar que los objetivos no cortan la información principal.
