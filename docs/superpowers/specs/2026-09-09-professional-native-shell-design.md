# Marco nativo profesional de TriWaveX

## Objetivo

Elevar la percepción de calidad del contenedor SwiftUI sin rehacer las pantallas de producto que siguen viviendo en la web. La app debe sentirse estable, sobria y claramente nativa en iPhone.

## Decisión

- El primer arranque usa una superficie de carga de pantalla completa con el símbolo de TriWaveX y una jerarquía visual propia, no una tarjeta flotante sobre contenido incompleto.
- Las navegaciones posteriores no vuelven a cubrir la pantalla con una barrera de carga. El contenido se conserva mientras carga y el marco nativo evita destellos o sustituciones bruscas.
- La barra inferior se consolida como una pieza de navegación de material oscuro, con destinos legibles, selección clara y zonas táctiles de al menos 44 pt.
- Los errores quedan centrados sobre un fondo coherente, con un único reintento prioritario y sin mezclar estilos de web y SwiftUI.

## Calidad y accesibilidad

- Las transiciones usan opacidad corta; las pulsaciones y selección emplean muelles contenidos. Con “Reducir movimiento” se eliminan escala, desplazamiento y repetición decorativa.
- Los colores de marca se reservan para selección, progreso y acción. El resto de la interfaz emplea la escala neutra de iOS para conservar contraste y jerarquía.
- El diseño no añade botones de atrás o recarga globales: la navegación principal y los flujos web determinan las salidas disponibles.

## Verificación

- Compilación del destino iPhone sin firma para validar los cambios de Swift.
- Revisión del primer arranque y navegación entre destinos para confirmar que no reaparece una pantalla de carga intermedia.
- Prueba manual en dispositivo para contraste, barra inferior y reducción de movimiento.
