# Perfil nativo tipo Ajustes

## Objetivo

Convertir la pantalla de Perfil y ajustes en una experiencia iOS sobria y profesional. Debe dejar de parecer un dashboard de tarjetas y organizar la información como una jerarquía de perfil y ajustes.

## Estructura aprobada

1. **Perfil**: encabezado breve con identidad del atleta.
2. **Próximo objetivo**: una fila editable con nombre de la prueba y fecha; no una tarjeta promocional.
3. **Entrenamiento**: grupo de filas para Fisiología y zonas, dispositivos conectados y plan.
4. **Cuenta**: privacidad, exportación y acciones de sesión agrupadas al final.

## Lenguaje visual

- Fondo agrupado del sistema y superficies blancas únicas por grupo.
- Separadores finos entre filas; sin sombras, gradientes ni paneles anidados.
- SF Symbols discretos solo cuando ayuden a reconocer una acción.
- Valores de FTP, ritmos y horas dentro de Fisiología y zonas como filas de valor, no cuatro tarjetas.
- Acción principal en azul del sistema; acciones destructivas aisladas al final.
- Tipografía de sistema con título grande, texto de fila de tamaño normal y metadatos secundarios.

## Comportamiento

- El objetivo abre la configuración existente del plan, sin cambiar datos ni rutas.
- Las conexiones, zonas, sudoración, historial de lesiones, exportación, facturación y cierre de sesión conservan sus funcionalidades; cambian de agrupación visual.
- No se cambian las pantallas de entrenador ni el flujo de autenticación.

## Verificación

- Revisión a ancho de iPhone y escritorio.
- Tipos de TypeScript, pruebas y lint.
- Confirmación de que todos los enlaces y acciones actuales continúan presentes.
