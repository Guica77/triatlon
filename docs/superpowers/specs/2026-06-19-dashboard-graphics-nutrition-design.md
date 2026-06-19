# Diseño Técnico: Dashboard de Altas Prestaciones con Gráficos Avanzados e IA de Nutrición

Este documento define la arquitectura y los cambios de interfaz para mejorar los gráficos de rendimiento y salud en el Dashboard de Triatlón, integrando además el recomendador de alimentos personalizados y el asistente de IA para nutrición deportiva.

---

## 1. Cambios en el Layout del Dashboard (Priorización)

Se reordena el grid principal en la vista de atleta para colocar las métricas más críticas en primer plano:
1. **Estado de Forma (PMC)**: Muestra la carga de entrenamiento actual y el balance de fatiga (TSB).
2. **Biometría y Preparación**: Muestra el Readiness score y el estado fisiológico de recuperación.
3. **Combustible del Día**: Tarjeta de nutrición optimizada con pestaña de macros y pestaña de platos recomendados + IA.

---

## 2. Tarjeta: Estado de Forma (PMC Trend Widget)

Se reemplaza el indicador de arco simple por un minigráfico PMC de 7 días:
- **Estructura**:
  - Un contenedor SVG responsivo de 300x100px.
  - Curva azul para **CTL** (Fitness).
  - Curva roja para **ATL** (Fatiga).
  - Curva verde/punteada y área sombreada para **TSB** (Forma/Balance).
  - Eje X simplificado con etiquetas `LUN`, `MAR`, `MIÉ`, etc.
  - Leyenda dinámica en el pie de la tarjeta mostrando los valores del día de hoy.

---

## 3. Tarjeta: Biometría y Preparación (Sparklines)

Se introducen gráficos de tendencias de los últimos 7 días en las tres sub-tarjetas (Sueño, HRV, RHR):
- **Estructura**:
  - En la parte inferior de cada una de las 3 tarjetas de factores objetivos (Sueño, HRV, RHR), se integra un mini SVG `<path>` de tendencia de 7 días.
  - Se obtienen estos datos de `initialBiometricsHistory` que ya se recupera en el servidor.
  - **Sueño**: Área sombreada violeta (`#8b5cf6`).
  - **HRV**: Área sombreada rosa (`#f43f5e`).
  - **RHR**: Área sombreada verde (`#10b981`).

---

## 4. Tarjeta: Combustible del Día (Macros y Platos + IA)

Se rediseña por completo la tarjeta de Nutrición convirtiéndola en una tarjeta interactiva con dos pestañas:

### Pestaña A: `[Macros]`
- Muestra el consumo vs objetivo calórico mediante un gráfico circular de progreso más estilizado.
- En lugar de barras horizontales simples, se introduce un gráfico circular/donut SVG de macronutrientes (CHO, PRO, FAT) que visualiza el reparto porcentual calórico del día (ej. 55% CHO, 20% PRO, 25% FAT).

### Pestaña B: `[Platos e IA]`
- **Plan de Comidas Dinámico**:
  - **Desayuno / Pre-Entreno**: Sugerencia basada en la sesión programada de hoy y tus preferencias alimentarias.
  - **Intra-Entreno**: Estrategia de hidratos/sales según la duración y el deporte.
  - **Comida / Post-Entreno**: Plato de recuperación rico en proteínas y carbohidratos (ej. Pollo con Arroz Basmati y Aguacate si estas son tus preferencias).
- **Asistente de IA de Nutrición**:
  - Panel para realizar preguntas rápidas sobre nutrición deportiva.
  - Botones con **Preguntas Sugeridas** rápidas:
    - *¿Cómo sustituyo el pollo hoy?*
    - *¿Cómo adapto esta comida si soy intolerante al gluten?*
    - *¿Qué ceno si entreno tarde?*
  - Al hacer clic en una pregunta o escribir una personalizada, el componente realiza una llamada de servidor a `askNutritionAI` y muestra la respuesta en tiempo real con un efecto premium de máquina de escribir y formato Markdown.

---

## 5. Backend y Lógica de Negocio

- **Nueva Server Action en `nutrition-actions.ts`**:
  ```typescript
  export async function askNutritionAI(
    question: string,
    dateString: string,
    preferredIngredients: string[]
  ): Promise<{ response: string; success: boolean }>
  ```
  - Esta acción combina la información biométrica del atleta (peso), los entrenamientos programados para la fecha (duración, deporte, TSS, gasto calórico), las macros calculadas para el día y las preferencias de ingredientes para responder de manera ultra-personalizada y "con sentido" clínico-deportivo.

---

## 6. Plan de Verificación

### Pruebas Automatizadas
- Ejecutar `npx tsc --noEmit` para validar tipos TypeScript.
- Ejecutar `vitest` para comprobar que la lógica de cálculo de macronutrientes y recuperación sigue funcionando al 100%.

### Pruebas Manuales
- Abrir `http://localhost:3005/dashboard` y verificar:
  - El nuevo orden de las tarjetas (Forma -> Biometría -> Nutrición).
  - La alternancia fluida de pestañas en la tarjeta de nutrición.
  - La renderización y actualización dinámica de los gráficos SVG (Sparklines y mini-PMC) al cambiar de día en la navegación semanal.
  - La respuesta interactiva del chat de IA de nutrición al pulsar una pregunta sugerida.
