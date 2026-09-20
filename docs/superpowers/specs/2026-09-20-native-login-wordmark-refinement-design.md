# Refinamiento de la marca en el acceso nativo

## Objetivo

Dar más presencia a TriWaveX al terminar el preonboarding y al volver a la pantalla de acceso, sin cambiar los controles actuales ni añadir un símbolo o un fondo de color. La X azul es el único acento de color de la marca.

## Secuencia de primera apertura

Después de las tres preguntas existentes —escritas, mantenidas y borradas a un ritmo más lento para que se lean con calma— la secuencia será:

1. Mostrar `Para eso está…` centrado durante una pausa de lectura ligeramente más larga que la actual.
2. Fundir esa frase y revelar `TriWaveX` centrado, a un tamaño más expresivo, con el subtítulo `Entrena con una dirección clara` debajo.
3. Mantener la composición brevemente.
4. Fundir el subtítulo al comenzar el movimiento, conservar el wordmark y elevarlo con suavidad mientras reduce hasta el tamaño exacto del encabezado actual.
5. Revelar el login existente sin modificar su estructura.

No habrá halo, símbolo, fondo azul ni una animación repetitiva. `TriWave` conserva el color principal y solo la `X` usa el azul de TriWaveX.

## Vuelta al acceso

En aperturas posteriores se omiten las preguntas y `Para eso está…`. Se muestra directamente `TriWaveX` centrado con la `X` azul y el subtítulo debajo. El subtítulo se desvanece lentamente, pero el wordmark no desaparece: permanece visible y asciende de forma continua hasta convertirse en el encabezado del login. La versión es sensiblemente más corta que la primera apertura.

## Accesibilidad e interacción

Con Reducir movimiento se preserva el orden de lectura mediante fundidos breves, sin desplazamiento vertical. Los controles permanecen desactivados visualmente solo hasta que la entrada haya concluido; no se altera el flujo de contraseña ni Apple Sign In.

## Implementación y verificación

La lógica vive en la vista raíz nativa y reutiliza los valores de movimiento del sistema de diseño. Se sustituye el tratamiento anterior del logo por un wordmark de texto con una X azul, sin crear recursos gráficos nuevos.

- La primera apertura conserva las tres preguntas y añade la secuencia descrita.
- Las aperturas posteriores muestran la versión corta.
- El encabezado final coincide visualmente con el login actual.
- Se comprueba el parseo de Swift y las pruebas existentes de autenticación.
