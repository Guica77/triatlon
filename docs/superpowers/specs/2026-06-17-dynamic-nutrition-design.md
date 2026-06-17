# Spec: Integración de Nutrición Dinámica y Pacing Automático (Estilo INDYA)

Diseño e implementación de un sistema de nutrición deportiva y pacing dinámico. Esta funcionalidad elimina el conteo manual de calorías al calcular de forma automatizada los requisitos nutricionales (agua, carbohidratos, sodio) basándose en las cargas de entrenamiento importadas (TSS, potencia, pulso, duración) desde Garmin/Strava y Apple Health, integrando las pautas directamente en la tarjeta de cada sesión.

---

## 1. Meta y Visión del Diseño

- **Frontend Premium y sin "Slop AI":** Evitar layouts genéricos y aburridos. Utilizaremos el sistema de diseño del proyecto de forma pulida, con tipografía atractiva (Outfit), acabados *glassmorphic*, sombras neón para disciplinas y gradientes de color suaves.
- **Robustez Extrema:** La interfaz debe ser robusta en TypeScript, manejando con gracia los estados en que falte información (sesiones de descanso, atleta sin peso registrado, falta de telemetría o modo offline) sin provocar parpadeos ni descuadres de interfaz.
- **Automatización Pasiva:** La app se actualiza automáticamente a partir del peso del atleta (vía Apple Health) y del gasto real de los entrenamientos (vía webhooks de Strava/Garmin).

---

## 2. Cambios Propuestos

### Base de Datos (Supabase Migrations)

#### [NEW] [20260617000000_athlete_nutrition_schema.sql](file:///Users/guillermohaya/Desktop/triatlon/triatlon-app/supabase/migrations/20260617000000_athlete_nutrition_schema.sql)
Añadir soporte en la tabla `profiles` para almacenar la información fisiológica y los parámetros del test del atleta:
- `sweat_rate` (`NUMERIC(3,1)`): Tasa de sudoración en L/h (por defecto `NULL`, que usa `0.8 L/h` como estándar).
- `sweat_test_weight_before` (`NUMERIC(4,1)`)
- `sweat_test_weight_after` (`NUMERIC(4,1)`)
- `sweat_test_fluid_intake` (`INTEGER` en ml)
- `sweat_test_duration_min` (`INTEGER` en minutos)
- `custom_carbs_per_hour` (`INTEGER` en gramos, opcional para sobreescribir el cálculo automático).

---

### Lógica de Servidor (Server Actions)

#### [NEW] [nutrition-actions.ts](file:///Users/guillermohaya/Desktop/triatlon/triatlon-app/app/(app)/dashboard/nutrition-actions.ts)
Implementar lógica en TypeScript para:
- **`saveSweatTest(data)`**: Registra el test, calcula la tasa de sudoración y guarda en Supabase.
- **`getDailyNutrition(date)`**:
  - Obtiene el peso más reciente de `user_biometrics` o el del perfil.
  - Calcula las calorías basales (BMR $\times$ 1.2) + el gasto calórico de los entrenamientos planificados para el día (usando coeficientes de MET: Natación: 7, Bici: 8, Carrera: 10, Fuerza: 4).
  - Calcula carbohidratos diarios dinámicos ($4.0\text{g/kg}$ a $8.5\text{g/kg}$ según duración total de la sesión) y proteínas ($1.6\text{g/kg}$ a $2.0\text{g/kg}$).
  - Devuelve las necesidades diarias y las pautas para cada entrenamiento de esa fecha.

---

### Componentes Visuales

#### [MODIFY] [daily-workout-card.tsx](file:///Users/guillermohaya/Desktop/triatlon/triatlon-app/components/dashboard/daily-workout-card.tsx)
- Añadir la pestaña **"Nutrición ⚡"** en la navegación secundaria de la tarjeta de sesión.
- Renderizar:
  - **Hidratación (ml/h):** Recomendar beber el 65% de su tasa de sudoración.
  - **Sodio (mg/h):** Recomendar 700mg de sodio por cada Litro de hidratación necesaria.
  - **Carbohidratos (g HC/h):** Mostrar el objetivo de carga según el deporte y duración.
  - **Pack del entrenamiento:** Una lista visual estructurada de lo que debe llevar en la mochila (geles, bidones, pastillas).

#### [NEW] [daily-fuel-card.tsx](file:///Users/guillermohaya/Desktop/triatlon/triatlon-app/components/dashboard/daily-fuel-card.tsx)
- Crear el widget principal **"Combustible del Día"** al lado de la biometría.
- Mostrar anillo de progreso circular para las kcal diarias y barras horizontales animadas con gradientes de neón brillante para Carbohidratos, Proteínas y Grasas.

#### [NEW] [sweat-test-card.tsx](file:///Users/guillermohaya/Desktop/triatlon/triatlon-app/components/settings/sweat-test-card.tsx)
- Diseñar la tarjeta interactiva para que el usuario complete su test de sudoración (con campos validados y cálculo en tiempo real).

---

## 3. Plan de Verificación

### Pruebas Automatizadas
- Crear test `/tests/nutrition.test.ts` para verificar las fórmulas de la tasa de sudoración y la distribución dinámica de macronutrientes.
- Asegurar que compile correctamente con `npm run build` sin errores de tipos.

### Verificación Manual
- Simular la ingesta de un entrenamiento (Garmin/Strava webhook) y constatar que el widget "Combustible del Día" recalcula y aumenta las calorías del día al instante.
- Probar la responsividad en móviles y tablets para garantizar que la interfaz se vea impecable y robusta.
