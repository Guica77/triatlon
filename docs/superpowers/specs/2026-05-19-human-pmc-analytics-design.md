# Design Spec: Humanized PMC Analytics System

## 1. Overview
The Performance Management Chart (PMC) is the gold standard for tracking triathlon progress, but it is historically difficult to understand. This design implements a two-tier approach:
1. **The Dashboard "Form Status" Widget**: A simplified, natural-language widget that reads the PMC data and tells the athlete how they feel (e.g., "En pico de forma" or "Fatiga alta").
2. **The Dedicated `/analytics` Page**: A full, interactive chart using `recharts` for athletes who want to dive deep into their Fitness (CTL), Fatigue (ATL), and Form (TSB) over time, but using plain-spanish terminology.

## 2. Architecture & Components

### 2.1 Form Status Widget (`components/dashboard/form-status-widget.tsx`)
- Placed in `app/dashboard/page.tsx`.
- Visually acts as a "Traffic Light" (Green/Yellow/Red) based on the current TSB (Frescura).
- Example states:
  - TSB > 5: "🔥 Pico de forma (Frescura Alta)"
  - TSB between -10 and 5: "⚡ Óptimo (Entrenamiento Productivo)"
  - TSB < -20: "⚠️ Fatiga Severa (Riesgo de lesión, descansa)"
- Acts as a Link button redirecting to `/analytics`.

### 2.2 PMC Chart Component (`components/analytics/pmc-chart.tsx`)
- Uses `recharts` to render an overlapping Area/Line chart.
- X-Axis: Dates (last 30, 90, or 180 days).
- Y-Axis: TSS (Training Stress Score).
- **Lines/Areas:**
  - **Condición Física (Azul / Area)**: Represents CTL. Slowly builds up.
  - **Fatiga (Rosa / Línea)**: Represents ATL. Spikes quickly after hard workouts.
  - **Frescura (Verde-Naranja / Barras)**: Represents TSB. Oscillates around 0.

### 2.3 Analytics Page (`app/analytics/page.tsx`)
- A new top-level page with the dashboard layout wrapper.
- Contains the `PMCChart` component and maybe a summary of total hours/TSS trained this month.

## 3. Data Flow & Calculations
- **Source**: Fetch all completed `training_sessions` for the user that have an `actual_tss` value (or fallback to `planned_tss` if marked as completed but watch wasn't synced).
- **Math Engine (`utils/pmc-calculations.ts`)**:
  - We need to calculate exponential moving averages.
  - **CTL (Condición)** = Exponential average of TSS over 42 days.
  - **ATL (Fatiga)** = Exponential average of TSS over 7 days.
  - **TSB (Frescura)** = Yesterday's CTL - Yesterday's ATL.
- This calculation will be done on the server before passing the generated array of day-by-day metrics to the client chart.

## 4. Edge Cases & Empty States
- **No Data**: If the athlete just registered and has no completed workouts, the dashboard widget will say "🏃‍♂️ Completa tu primer entreno para calcular tu forma", and the chart will show an empty placeholder graphic.

## 5. Next Implementation Steps
1. Create `utils/pmc-calculations.ts` to implement the math logic.
2. Build the `app/analytics/page.tsx` and the `recharts` component.
3. Build the `FormStatusWidget` and integrate it into the Dashboard.
