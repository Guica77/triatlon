# Advanced Onboarding & Virtual Garage AI Gear Match Specification

## 1. Executive Summary
This specification defines the architectural enhancements and UI/UX flows required to implement an Advanced Hybrid Onboarding experience, a Virtual Garage inventory system, and an automated AI Gear Match loop. The system bridges the gap between an athlete's current physiological baseline and their target race finish time while proactively identifying equipment deficiencies for upcoming training sessions.

## 2. Database Architecture (Supabase Schemas)

### 2.1 Table `profiles` Enhancements
The `profiles` table will be extended with the following columns to capture athlete ambitions, baseline availability, physiological metrics, and owned equipment:

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS target_finish_time TEXT, -- e.g., '04:30:00' for Half Ironman
ADD COLUMN IF NOT EXISTS baseline_training_hours TEXT, -- e.g., '4-6h', '7-10h', '12+h'
ADD COLUMN IF NOT EXISTS current_ftp NUMERIC, -- Cycling Functional Threshold Power in Watts
ADD COLUMN IF NOT EXISTS current_swim_pace TEXT, -- e.g., '01:45' per 100m pace
ADD COLUMN IF NOT EXISTS current_run_pace TEXT, -- e.g., '04:30' per km pace
ADD COLUMN IF NOT EXISTS virtual_garage TEXT[] DEFAULT '{}'; -- Array of owned gear items
```

### 2.2 Table `training_sessions` Enhancements
The `training_sessions` table will be extended to explicitly declare the equipment required to successfully execute each specific workout:

```sql
ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS gear_needed TEXT[] DEFAULT '{}'; -- e.g., ARRAY['Palas de Natación', 'Aletas de Natación']
```

## 3. UI/UX Specification: Hybrid Onboarding Wizard

The onboarding flow will be upgraded to a 3-step Bento-grid interactive wizard:

### 3.1 Step 1: Ambition & Availability
- **Target Race Selection**: User inputs or selects their target race name, date, distance (`sprint`, `olimpico`, `half`, `full`), and multisport modality.
- **Target Finish Time**: Input field for the desired finish time (e.g., Sub-5h) or a toggle for "Finish with good sensations".
- **Baseline Availability**: Bento selection cards for current weekly training capacity (4-6 hours, 7-10 hours, 12+ hours).

### 3.2 Step 2: Physiological Calibration
- **Advanced Metrics Input**: Clean numerical inputs for Current Cycling FTP, 100m Swim Pace, and 1km Run Pace.
- **AI Estimation Fallback**: If the athlete leaves these fields blank, the backend automatically calculates intelligent baseline estimates based on their selected race distance and baseline training hours.

### 3.3 Step 3: Virtual Garage Setup
- **Interactive Gear Inventory**: A visually rich grid of equipment badges (e.g., 🚴‍♂️ Road Bike, 🚴‍♂️ Time Trial Bike, 🩱 Wetsuit, ⭕ Carbon Wheels, ⚡ Power Meter, 🪖 Aero Helmet, 🎒 Swim Paddles, 🎒 Swim Fins).
- **Selection Mechanism**: Clicking a badge toggles its active state, adding the item to the user's `virtual_garage` array in their profile.

## 4. AI Gear Match Loop & Marketplace Integration

### 4.1 Daily Workout Card (`DailyWorkoutCard`)
- **Real-Time Gear Evaluation**: When rendering the upcoming workout, the component compares `session.gear_needed` against `profile.virtual_garage`.
- **Proactive Warning Banner**: If a required item (e.g., 'Palas de Natación') is missing from the virtual garage, an elegant orange warning banner appears: `⚠️ Material Faltante para Mañana: Palas de Natación`.
- **Action Trigger**: The banner includes an interactive button: **"🔍 Buscar Chollos con IA"** (`/marketplace?category=accesorios&search=Palas de Natación`).

### 4.2 Intelligent Marketplace (`MarketplaceAggregatorGrid`)
- **Contextual AI Banner**: When navigating to the marketplace with missing gear parameters, the top AI Gear Match banner highlights the specific items needed for the athlete's training week.
- **Automated Discount Sorting**: The marketplace grid automatically defaults its sort state to `discount` (highest percentage discount first), ensuring the athlete sees the most lucrative certified second-hand deals immediately.

## 5. Error Handling & Edge Cases
- **Missing Session Gear Data**: If `gear_needed` is null or empty for a session, the system assumes standard basic equipment (bike/running shoes) and suppresses missing gear warnings.
- **Empty Virtual Garage**: If the user skips Step 3 of onboarding, `virtual_garage` defaults to an empty array `{}`, prompting gear warnings only when specialized equipment (paddles, fins, power meters) is explicitly required by a workout.
- **Database Fallbacks**: All database migrations will utilize `IF NOT EXISTS` clauses to ensure idempotent execution without risking existing user data.
