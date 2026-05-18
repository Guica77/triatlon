# Design Spec: Athlete Profile & Settings (Bento Grid)

## 1. Overview
A new dedicated page (`/settings`) that serves as the athlete's command center for adjusting their hyper-personalized data. It uses a modern Bento Grid layout to display the current Race Goal, Physiological Baseline, and Virtual Garage, aligning perfectly with the premium UI/UX of the Dashboard and Onboarding flows.

## 2. Architecture & Data Flow
- **Route**: `app/settings/page.tsx` (Server Component)
- **Data Fetching**: 
  - Server-side fetch from `profiles` (for physiological data and virtual garage).
  - Join with `training_plans` to show the current active plan name.
- **Mutations**: 
  - `app/settings/actions.ts`: Contains Server Actions (e.g., `updatePhysiologicalData`, `updateVirtualGarage`).
  - Forms/Modals use `useTransition` and optimistic UI updates to ensure a snappy, premium feel.

## 3. UI Components (Bento Grid)

### 3.1 Header
- Standard top navigation bar similar to the Dashboard.
- Includes a prominent "Volver al Dashboard" (Back to Dashboard) button.

### 3.2 Race Goal Card (`RaceGoalBentoCard`)
- **Visuals**: A visually distinct "Hero" card within the grid. Uses a subtle gradient background based on the modality (e.g., cyan for Triathlon).
- **Data**: Displays `target_race_name`, `target_race_date`, and `target_finish_time`.
- **Action**: "Cambiar Objetivo" button that redirects the user to `/onboarding` to run the wizard again if they change their season goal.

### 3.3 Physiological Baseline Card (`PhysiologicalBentoCard`)
- **Visuals**: A clean metrics card displaying FTP, Swim Pace, Run Pace, and Baseline Hours.
- **Action**: An "Editar" (Edit) button that opens a sleek `Framer Motion` modal. 
- **Form**: The modal allows the user to update their metrics. Upon saving, it calls `updatePhysiologicalData` and refreshes the page/state.

### 3.4 Virtual Garage Card (`VirtualGarageBentoCard`)
- **Visuals**: Displays the array of currently owned items from `profile.virtual_garage` using small, high-contrast badges/icons.
- **Action**: An "Editar Garaje" button.
- **Form**: Opens a modal showing the 8 primary gear items (similar to Onboarding Step 3). The user can toggle them on/off. Saves via `updateVirtualGarage`.

## 4. Error Handling & Feedback
- All server actions will return a typed response `{ success: boolean; error?: string }`.
- We will use a toast notification system (or animated proactive banners) to confirm to the user: "✅ Perfil actualizado correctamente. Tu próximo entrenamiento ha sido reajustado."

## 5. Next Steps for Implementation
1. Create `app/settings/actions.ts` with Supabase update logic.
2. Build the `app/settings/page.tsx` grid layout.
3. Extract and build the individual Bento Card client components.
4. Add the Framer Motion modals for inline editing.
