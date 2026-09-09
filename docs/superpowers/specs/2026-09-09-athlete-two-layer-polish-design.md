# TriWaveX — Pulido de atleta en dos capas

**Fecha:** 9 de septiembre de 2026  
**Estado:** Diseño aprobado; pendiente de revisión escrita antes de implementar.

## Objetivo

Unificar la experiencia del atleta cuando usa TriWaveX como aplicación iOS: el contenido web móvil alojado por la aplicación y el marco nativo SwiftUI deben sentirse como una sola interfaz. La prioridad es corregir el centrado, los márgenes, la jerarquía y los estados de las pantallas de chat/directorio de entrenadores, ajustes y conexiones.

## Alcance de la primera fase

### Web móvil dentro de la aplicación

- Chat y directorio de entrenadores: cabecera compacta que no corta el título, contenido con ancho legible y tarjeta de código de invitación centrada.
- Ajustes: tarjetas de conexión con un único patrón de tamaño, separación y acción principal.
- Strava: estado explícito de conectado, disponible para conectar o error recuperable; la autorización se inicia mediante el flujo seguro correspondiente a la plataforma.
- Todas las vistas de atleta adoptan una escala común de espaciado, radio, alto de botones y ancho máximo responsive. Ningún control se debe desbordar ni quedar pegado a los bordes en iPhone.

### Marco nativo SwiftUI

- Inicio, selectores de rol, navegación, carga y error conservan los controles SwiftUI.
- Acciones principales: cápsulas con color TriWaveX, contraste suficiente, sombra breve y respuesta de pulsación corta.
- Acciones secundarias: material translúcido, borde fino y la misma geometría.
- Navegación y selectores: burbuja activa deslizante con muelle suave.
- Aparición de contenido, carga y alertas: transición corta; se elimina el movimiento no esencial cuando iOS tiene activado Reducir movimiento.

## Conexiones

- Apple: acceso nativo ya configurado en la aplicación; se muestra como disponible únicamente cuando se puede iniciar el flujo nativo.
- Strava: la app abre una sesión de autorización segura y vuelve automáticamente a TriWaveX. El estado final se refleja en Ajustes. Requiere las variables de Strava de producción para funcionar en un dispositivo real.
- Google: no se presentará como una conexión disponible hasta que se configure y pruebe su OAuth nativo. Mientras tanto, el mensaje indicará que está pendiente, sin simular éxito.

## Límites

- No se rehacen las pantallas internas como SwiftUI puro en esta fase: se mejora su versión web móvil y se conserva el contenedor nativo.
- No se modifican los cambios de onboarding ni los archivos no relacionados que ya estén sin confirmar en el repositorio.
- La integración real de Google no forma parte de este pulido visual.

## Verificación

1. Revisar chat/directorio, ajustes y Strava en anchuras de iPhone pequeño y grande, sin recortes ni desplazamiento horizontal.
2. Confirmar que las acciones principales y secundarias comparten tamaño, alineación y comportamiento táctil.
3. Comprobar los tres estados de conexión visibles: conectado, disponible y pendiente/error.
4. Compilar el proyecto de iOS para simulador sin firma.
5. Revisar en dispositivo real Apple y Strava después de aportar variables de producción y configuración de proveedor.

## Criterio de terminación

El atleta percibe una única interfaz coherente: las tarjetas y botones quedan centrados y alineados, el marco SwiftUI acompaña al contenido web sin contradicciones visuales, y cada conexión comunica con precisión si está disponible, conectada o pendiente.
