# Implementation Plan: Humanized PMC Analytics

## Objective
Implement the Performance Management Chart (PMC) and the simplified Dashboard Form Status Widget.

## Step 1: Install Dependencies
- Verify or install `recharts` for the interactive graphs.
- Verify or install `date-fns` for robust date manipulation (since we need to calculate rolling 42-day and 7-day windows).

## Step 2: Math Engine
**File**: `utils/pmc-calculations.ts`
- Implement a robust function `calculatePMC(sessions)` that takes an array of `{ date, tss }` objects.
- It must fill in missing days with `0 TSS` to ensure the exponential decay calculations are correct over time.
- Implement standard PMC formulas:
  - CTL (Fitness) = Exponential Moving Average (EMA) over 42 days.
  - ATL (Fatigue) = Exponential Moving Average (EMA) over 7 days.
  - TSB (Form) = CTL (yesterday) - ATL (yesterday).
- Return an array of daily data points suitable for Recharts.

## Step 3: Data Fetching (Server Actions)
**File**: `app/analytics/actions.ts`
- Create `getPMCData()` action.
- Fetch all `training_sessions` for the current user where `actual_tss` is not null OR `status = 'completed'` (using `planned_tss` as fallback).
- Map the data into the `{ date, tss }` format.
- Run `calculatePMC()` and return the history for the last 6 months.

## Step 4: The Interactive Chart Component
**File**: `components/analytics/pmc-chart.tsx`
- Client component using `recharts`.
- **Condición Física (CTL)**: Rendered as a blue `Area` chart.
- **Fatiga (ATL)**: Rendered as a pink/red `Line` chart.
- **Frescura (TSB)**: Rendered as a yellow/green `Bar` chart depending on if it's positive or negative.
- Implement a custom tooltip that translates the acronyms to Spanish words.

## Step 5: The Analytics Page
**File**: `app/analytics/page.tsx`
- Server component that calls `getPMCData()`.
- Renders the header and the `PMCChart`.
- Renders a "Current Status" summary section at the top showing the numerical values for today.

## Step 6: Dashboard Form Widget
**File**: `components/dashboard/form-status-widget.tsx`
- A smart Bento card component.
- Takes the latest TSB value as a prop.
- Logic:
  - `TSB > 5`: "Pico de Forma" (Green)
  - `-10 <= TSB <= 5`: "Entrenamiento Óptimo" (Blue)
  - `-20 <= TSB < -10`: "Sobrecarga Controlada" (Yellow)
  - `TSB < -20`: "Alerta Fatiga" (Red)
- Displays this string prominently and links to `/analytics`.

## Step 7: Dashboard Integration
**File**: `app/dashboard/page.tsx`
- Fetch the PMC data alongside the other dashboard data.
- Place the `FormStatusWidget` at the top of the dashboard near the Biometrics card.
