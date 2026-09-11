# Diseño: entrenamiento primero, con lenguaje visual Apple

## Objetivo

Conservar la identidad de TriWaveX como aplicación de entrenamiento de triatlón y eliminar el aspecto de panel automático de la vista de recuperación. La pantalla debe responder primero a «¿qué entreno hoy?» y después explicar el contexto físico para tomar esa decisión.

## Jerarquía

1. **Entrenamiento de hoy.** Es el bloque principal al abrir la pantalla. Muestra disciplina, duración, objetivo y una única acción: «Ver entrenamiento» o «Empezar».
2. **Recuperación.** Ofrece la recomendación que condiciona la sesión (mantener, moderar o recuperar) sin competir visualmente con ella.
3. **Progreso semanal.** Presenta sesiones, carga y tiempo como resumen breve y escaneable.

## Composición

- El fondo usa `systemGroupedBackground`/el equivalente web claro. No se apilan tarjetas: cada bloque usa una superficie de grupo o queda directamente en el fondo.
- El entrenamiento se expresa en una sola tarjeta o sección de lista, no en una cuadrícula de tarjetas internas. El color de la disciplina aparece solo como acento: azul para natación, verde para bici y naranja para carrera.
- La recuperación usa una lectura principal (por ejemplo, «Preparado para entrenar») y, debajo, filas nativas para HRV, sueño, readiness, fatiga y pulso. Se elimina el indicador circular decorativo, el emoji y la repetición de barras de progreso.
- Progreso semanal muestra una única barra de cumplimiento y cifras de apoyo; no añade indicadores redundantes.

## Tipografía e iconografía

- SF Pro / la pila de fuentes del sistema de Apple en todas las superficies.
- Título de pantalla en `largeTitle`, títulos de sección en `headline` y métricas en `body`/`subheadline`; sin mayúsculas decorativas ni tracking artificial.
- Solo SF Symbols de Apple, pequeños y semánticos. No se usan emojis para describir el entrenamiento o el estado físico.
- Los textos secundarios se limitan a una frase que ayude a decidir; se evita explicar la métrica dos veces.

## Estados y accesibilidad

- Cuando no haya sesión, el primer bloque comunica «Sin entrenamiento programado» y conduce al calendario.
- Un estado de recuperación desfavorable cambia la recomendación y el énfasis de la sesión, pero no oculta el entrenamiento previsto.
- Los colores nunca son la única señal: cada estado incluye texto y símbolo con etiqueta accesible.
- Las filas y acciones conservan objetivos táctiles de al menos 44 puntos y se adaptan a Dynamic Type.

## Alcance

- Aplicar la jerarquía a la experiencia web autenticada y al resumen nativo SwiftUI.
- No se cambian cálculos, datos, autenticación ni navegación. El endpoint de progreso nativo se conserva.
- La animación se limita a una transición de selección/actualización breve y sin rebote, respetando reducir movimiento.

## Validación

- Revisar la pantalla en iPhone con texto normal y tamaño de accesibilidad.
- Verificar las variantes sin sesión, con recuperación buena y con recuperación baja.
- Ejecutar pruebas web, lint y compilación iOS disponible.
