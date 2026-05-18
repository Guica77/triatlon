# Implementation Plan: Athlete Profile Settings

## Objective
Implement the new `/settings` page using a modern Bento Grid architecture to allow the athlete to view and edit their active race goal, physiological metrics, and virtual garage gear.

## Step 1: Server Actions (Backend)
**File**: `app/settings/actions.ts`
- Implement `updatePhysiologicalData` to safely update `current_ftp`, `current_swim_pace`, `current_run_pace`, and `baseline_training_hours` in the `profiles` table.
- Implement `updateVirtualGarage` to safely update the `virtual_garage` string array in the `profiles` table.
- Use Supabase Auth to ensure actions are only performed on the logged-in user's profile.
- Return success/error payloads for toast notifications.

## Step 2: Main Layout & Data Fetching (Server Component)
**File**: `app/settings/page.tsx`
- Ensure route is protected (redirect to `/login` if no user).
- Fetch the user's `profile` (including `training_plans` join).
- Render a top navigation header with a "Volver al Dashboard" button.
- Render a CSS Grid container for the Bento Cards.

## Step 3: Race Goal Card Component
**File**: `components/settings/race-goal-card.tsx`
- Client component receiving the active `training_plans` data and `target_finish_time`.
- Display a visually prominent "Hero" style card with a cyan gradient.
- Provide an "Actualizar Objetivo" link/button that navigates the user back to `/onboarding` to run the wizard again if they change their season goal.

## Step 4: Physiological Baseline Card & Edit Modal
**File**: `components/settings/physiological-card.tsx`
- Client component receiving FTP, Swim Pace, Run Pace, and baseline hours.
- Render the data cleanly inside a Bento card.
- Include an "Editar Métricas" button that opens a `framer-motion` modal.
- The modal contains a form to edit these values.
- On submit, call the `updatePhysiologicalData` server action and show a success toast.

## Step 5: Virtual Garage Card & Edit Modal
**File**: `components/settings/virtual-garage-card.tsx`
- Client component receiving the `virtual_garage` array.
- Display the owned items as sleek badges.
- Include an "Editar Garaje" button that opens a `framer-motion` modal.
- The modal displays the 8 available gear items (Bici, Cabra, Neopreno, etc.) as toggleable buttons.
- On submit, call the `updateVirtualGarage` server action and show a success toast.

## Step 6: Navigation Integration
**File**: `app/dashboard/page.tsx`
- Update the Quick Actions bar in the Dashboard.
- Change the current "Cambiar Plan" button to navigate to `/settings` instead of `/onboarding`, renaming it to "Ajustes y Perfil".
