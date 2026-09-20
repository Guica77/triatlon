# Entrada progresiva del acceso nativo

## Objetivo

Convertir cada apertura de la pantalla nativa de acceso en una secuencia de bienvenida con identidad propia, sin bloquear el acceso ni perjudicar a personas que prefieren reducir el movimiento.

## Secuencia

La secuencia se reproduce siempre que se muestra la pantalla de acceso y dura aproximadamente 3,5 segundos:

1. De 0,0 a 1,8 segundos, aparecen tres frases cortas, una detrás de otra, sobre los problemas que resuelve la aplicación:
   - «¿Pagar mucho por entrenar? Que el triatlón no sea solo para unos pocos.»
   - «¿Cansado de apps difíciles? Que entrenar no requiera aprender otra carrera.»
   - «¿No sabes ni por dónde empezar? Que alguien te marque el camino.»
2. De 1,8 a 2,1 segundos, aparece el cierre: `Para eso está…`.
3. De 2,1 a 2,7 segundos, la marca `TriWaveX` se revela de izquierda a derecha mediante una máscara, acompañada de una línea de acento azul discreta.
4. De 2,7 a 3,5 segundos, se incorporan el lema, selector de cuenta, credenciales, acceso con Apple y enlaces. Cada bloque entra una vez, con un desfase corto, opacidad y un desplazamiento vertical mínimo.

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
