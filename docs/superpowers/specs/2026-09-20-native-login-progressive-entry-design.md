# Entrada progresiva del acceso nativo

## Objetivo

Convertir cada apertura de la pantalla nativa de acceso en una secuencia de bienvenida con identidad propia, sin bloquear el acceso ni perjudicar a personas que prefieren reducir el movimiento.

## Secuencia

La secuencia se reproduce siempre que se muestra la pantalla de acceso y dura aproximadamente 6 segundos:

1. De 0,0 a 3,3 segundos, se escriben lentamente, carácter a carácter y en el centro de la pantalla, tres frases cortas sobre los problemas que resuelve la aplicación:
   - «¿Pagar demasiado por entrenar?»
   - «¿Otra app difícil de manejar?»
   - «¿No sabes ni por dónde empezar?»
2. A continuación aparece el cierre: `Para eso está…`.
3. El símbolo de tres trazos de TriWaveX aparece centrado en blanco y negro, con `TriWaveX` grande encima, y se mantiene brevemente.
4. El símbolo monocromo desaparece, pero el texto `TriWaveX` permanece centrado. Ese mismo texto sube lentamente desde esa posición hasta el encabezado de la pantalla de acceso. Solo al completar ese movimiento se incorporan el lema, selector de cuenta, credenciales, acceso con Apple y enlaces; cada bloque entra una vez, con un desfase corto, opacidad y un desplazamiento vertical mínimo.

La entrada utiliza curvas existentes de TriWaveX, transforma y opacidad; no anima medidas ni posiciones de layout. La interacción queda disponible al terminar la secuencia.

## Accesibilidad e interrupción

Con `Reducir movimiento`, se conserva el orden informativo, pero se eliminan desplazamientos y máscara: los elementos aparecen mediante fundidos breves. Los controles mantienen etiquetas de accesibilidad y no se ejecutan animaciones repetitivas.

## Diagnóstico de acceso

El modelo de sesión diferenciará un fallo de red de una respuesta HTTP no correcta, de una respuesta que no puede interpretarse y de una sesión sin cookies. Los mensajes de credenciales y Apple usarán el error seguro devuelto por el servidor cuando exista, sin exponer tokens ni detalles internos.

## Verificación

- Compilar y ejecutar pruebas de iOS.
- Comprobar que la marca se revela de izquierda a derecha y que los bloques respetan su orden.
- Activar `Reducir movimiento` en el simulador y verificar la variante de fundido.
- Ejecutar las pruebas existentes de los endpoints nativos de contraseña y Apple.
