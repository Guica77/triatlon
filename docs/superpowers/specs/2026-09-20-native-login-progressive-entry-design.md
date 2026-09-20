# Entrada progresiva del acceso nativo

## Objetivo

Convertir cada apertura de la pantalla nativa de acceso en una secuencia de bienvenida con identidad propia, sin bloquear el acceso ni perjudicar a personas que prefieren reducir el movimiento.

## Secuencia

La secuencia completa se reproduce solo la primera vez que una persona alcanza la pantalla de acceso. En las aperturas posteriores se omiten las frases y dura aproximadamente 2 segundos:

1. De 0,0 a 4,5 segundos, se escriben y se borran lentamente, una a una y en el centro de la pantalla, tres frases cortas sobre los problemas que resuelve la aplicación:
   - «¿Pagar demasiado por entrenar?»
   - «¿Otra app difícil de manejar?»
   - «¿No sabes ni por dónde empezar?»
2. A continuación aparece el cierre: `Para eso está…`.
3. `TriWaveX` aparece centrado mediante un fundido, sin símbolo.
4. El texto sube suavemente hasta su posición definitiva en el encabezado. Después se incorporan el lema, selector de cuenta, credenciales, acceso con Apple y enlaces; cada bloque entra una vez, con un desfase corto y opacidad.

En aperturas posteriores, solo se muestra `TriWaveX` centrado; el texto sube suavemente hasta el encabezado y después aparecen los controles. La preferencia se guarda de forma local en el dispositivo.

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
