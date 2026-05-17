# Triatlon Premium App - MVP Design Spec

## 1. Context & Purpose
- **Objective:** Create a high-end, visually stunning web/mobile application for triathletes to follow their training plans.
- **Differentiator:** Unmatched UI/UX design (Sleek & Modern, Dark Mode, Glassmorphism). Unlike competitors (TriDot, TrainingPeaks) which focus on academic data overload, this app focuses on a luxurious, intuitive, and emotionally engaging user experience.
- **Target Audience:** Triathletes (Sprint, Olympic, 70.3, Ironman) looking for clear direction without cognitive overload.

## 2. Business & Service Model
- **Core Model:** Freemium / Basic vs Premium AI.
- **Basic Tier (MVP Focus):** Self-guided athletes who select a predefined plan (from our JSON templates) and follow it day by day.
- **Premium Tier (Future):** AI-Driven Coach that dynamically recalculates workloads and integrates conversational guidance.

## 3. Architecture & Stack
- **Frontend Framework:** Next.js 14+ (App Router).
- **Styling:** Tailwind CSS with a strict, custom design system (Dark mode, grayscales, neon accents).
- **Animations:** Framer Motion for micro-interactions, page transitions, and fluid success states.
- **Backend & Auth:** Supabase (PostgreSQL, Row-Level Security, Authentication).
- **Hosting:** Vercel (recommended for Next.js).

## 4. Data Modeling (Supabase MVP)
1. `profiles`: `user_id` (PK), `level`, `goal_distance`, `active_plan_id`.
2. `training_plans`: `id` (PK), `name`, `distance`, `duration_weeks`, `level`.
3. `training_sessions`: Templates of workouts linked to a plan. `plan_id`, `week`, `day`, `type` (swim, bike, run, brick), `description`, `duration_min`.
4. `user_workouts`: The instantiated calendar for an athlete. `id`, `user_id`, `session_id`, `scheduled_date`, `status` (pending, completed, missed).

## 5. User Flow & Key Views
1. **Onboarding:**
   - Ultra-minimalist flow.
   - User inputs goal (e.g., Ironman 70.3) and selects a starting plan.
2. **Dashboard ("Hoy"):**
   - Focused completely on the *next immediate action*.
   - Large, elegant cards for today's sessions (e.g., Blue for swim, Red for run).
   - Shows duration, zones, and purpose clearly.
3. **Workout Detail & Execution:**
   - Uncluttered view of the exact intervals and zones.
   - Massive, satisfying "Mark as Completed" button with a rewarding animation.
4. **Calendar View (High Level):**
   - A scrollable weekly view to see the distribution of loads, using color-coded dots or minimal progress rings.

## 6. Integrations (Post-MVP Scope)
- **Devices (Garmin, Wahoo, Coros, Apple Watch):** Will be integrated in Phase 2 via the **Strava API** (simplest aggregator) or direct OAuth to Garmin Connect / Apple HealthKit. This allows automatic marking of `user_workouts` as "Completed" with actual heart rate/power data.
- **Races (Ironman/Challenge):** Will be integrated in Phase 3 to import race dates automatically and adjust the taper weeks accordingly.

## 7. Error Handling & Edge Cases
- **Missed Workouts:** For the MVP, missed workouts simply remain marked as "missed" visually (red or grayed out). The AI reassignment is out of scope for MVP.
- **Offline States:** Minimal caching (Service Workers / PWA setup) to allow users to view today's workout even if they lose connection at the pool or track.
- **Empty States:** Beautifully designed empty states guiding the user to start a plan if they don't have an active one.
