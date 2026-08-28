# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

At the start of any task-oriented session, load the project task-observer skill before using tools or producing deliverables. Check the stable observation log for relevant OPEN observations when loading skills. The observer is consultative only: do not apply its recommendations or modify skills automatically.

## Repository scope

`triatlon-app/` is the Git repository and the authenticated product application. `triatlon-landing/` is a separate Next.js application alongside it in the parent workspace; it has its own `package.json`, lockfile, README, and `CLAUDE.md`, but is not part of this Git repository. Make sure commands and Git operations target the intended directory.

The product UI is Spanish. The app uses a dark, mobile-first training-dashboard visual system with Inter for UI text, Barlow Condensed for display numerals, and JetBrains Mono for telemetry/readouts. The sibling landing app is a separate light marketing site using the same font family trio.

## Commands

Run these from `triatlon-app/`:

```bash
npm install                 # install from package-lock.json
npm run dev                 # Next development server, normally http://localhost:3000
npm run lint                # ESLint
npx tsc --noEmit            # type-check independently of the Next build
npm test                    # all Vitest tests once
npm run build               # production build
npm start                   # serve the production build
```

There is currently one Vitest suite. Run a single file or a focused test with:

```bash
npx vitest run lib/workout-structure.test.ts
npx vitest run lib/workout-structure.test.ts -t "test name or pattern"
```

`npm run build` intentionally sets `next.config.ts` `typescript.ignoreBuildErrors` to `true`, so run `npx tsc --noEmit` when validating TypeScript changes. ESLint is configured to ignore JavaScript files and several strict React rules; do not treat a passing build as a substitute for lint and type-checking.

For the sibling marketing site, run from `triatlon-landing/`:

```bash
npm install
npm run dev
npm run lint
npm run build
npm start
```

The landing package has no test script. Its source is under `src/` rather than the app-root `app/` and `components/` layout used by the product app.

## Local environment

For the product app, start from the committed template:

```bash
cp .env.example .env.local
```

Supabase is the core local dependency. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are used by browser/server clients; `SUPABASE_SERVICE_ROLE_KEY` is server-only and is used by admin actions. The other integrations are optional by feature: Google/Gemini or Anthropic for AI, Strava for activity/OAuth telemetry, Resend for email, and VAPID variables for push notifications. `CRON_SECRET` protects scheduled endpoints when configured. Do not copy the checked-in `.env.local`/Vercel environment files into documentation or commits.

When an integration is absent, `lib/ai-service.ts` is designed to report unavailable AI and callers can use expert/rule-based fallback behavior. Do not make browser code import server-only secrets or admin clients.

## Architecture

### Next.js application layers

- `app/` is the Next 16 App Router. Route groups separate concerns without changing URLs: `(auth)` contains login/registration/reset flows, while `(app)` contains the authenticated athlete and coach product. `app/api/` contains HTTP route handlers for AI streaming, telemetry OAuth/webhooks, notifications, cron jobs, and workout exports.
- Server actions live close to the route that owns the mutation (`dashboard/actions.ts`, `settings/actions.ts`, `onboarding/actions.ts`, coach actions, telemetry actions, and auth actions). They authenticate first, mutate Supabase, then revalidate affected paths/tags. Preserve this server-action boundary rather than moving database writes into client components.
- `app/(app)/layout.tsx` supplies the authenticated shell: desktop sidebar, mobile bottom navigation, notification/toast providers, page transitions, and push-notification management. `app/layout.tsx` owns global fonts, metadata, PWA-related UI, cookie/install prompts, and lifecycle registration.
- `proxy.ts` runs the Supabase session-refresh middleware for requests. Changes to auth redirects or cookie behavior should be checked together with `lib/supabase/middleware.ts` and `app/auth/callback/route.ts`.

### Data and authentication

- `lib/supabase/server.ts` creates the typed server client using Next cookies; `lib/supabase/client.ts` creates the browser client; `lib/supabase/admin.ts` is the privileged service-role client and must stay server-only.
- `types/database.types.ts` is the generated/maintained TypeScript model for the public Supabase schema. The schema history is append-only under `supabase/migrations/`; feature work commonly spans profiles, training plans/sessions, user workouts, biometrics, race goals, feedback, coach/athlete relationships, chat, nutrition, telemetry, and push subscriptions.
- Use the authenticated user from Supabase rather than trusting an ID supplied by the client. Normal user-facing reads/writes should use the session client and RLS; use the admin client only for explicitly privileged server operations such as provisioning profiles, coach relationships, or internal jobs.
- For schema changes, add a new migration and update `types/database.types.ts` consistently. Existing migrations and RLS policies are part of the application contract; do not edit old migrations to repair a deployed schema.

### Domain modules and UI

- `components/` is presentation and interaction code grouped by product area: dashboard, analytics, coach, onboarding, settings, feedback, chat, workouts, races, admin, and shared `ui/` primitives. Keep domain calculations out of presentational components when they can live in `lib/` or a server action.
- `lib/` contains reusable domain logic and integration adapters: periodization/workout structure, training zones, recovery/PMC/race analysis, nutrition, performance prediction, exercise loading, export helpers, weather, email, notifications, and data import.
- The athlete dashboard composes planned `training_sessions` with user-specific `user_workouts`, then layers completion/feedback, biometrics, nutrition, recovery, activities, and adaptive-plan state. Workout feedback can update workout status, notify a coach, invoke the adaptive evaluation flow, and send a push notification; changes to that flow should be tested across both the database mutation and the resulting UI state.
- The coach area reads the coach/athlete/group relationships and provides calendars, workout assignment/editing, athlete detail, compliance, chat, zones, nutrition, and analytics. Authorization is enforced in server actions and database policies, not only by hiding UI routes.
- Telemetry connectors under `lib/telemetry/` and `lib/strava/` normalize Garmin/Strava data into the app’s activity/biometrics model. OAuth callbacks and inbound webhooks are under `app/api/`; external requests should retain the existing timeout/error-handling patterns.
- `lib/ai-service.ts` is the central AI facade. It prefers Gemini, can fall back to Anthropic when configured, and exposes a no-key/offline path. Keep user-facing generated text in Spanish and preserve the fallback behavior when changing prompts or providers.

### Marketing site relationship

`triatlon-landing/` is not a shared component package. Its root page renders `src/app/landing-client.tsx`, which composes the landing navbar, hero, feature bento, pricing calculator/cards, and footer. It has no Supabase dependency and should be developed, linted, built, and deployed independently from `triatlon-app/`.

## Project conventions and gotchas

- Use the `@/*` alias, which resolves to the repository root, for internal imports. Match the surrounding TypeScript/React style; existing files use both semicolons and no-semicolon formatting depending on area.
- Read the relevant Next documentation under `node_modules/next/dist/docs/` before changing framework APIs. `AGENTS.md` specifically calls out breaking changes in this Next version.
- Keep server-only code out of client modules. Files with `'use client'` should receive data/actions through props or explicitly safe client APIs; files with `'use server'` own authenticated mutations and external-secret access.
- Preserve loading, error, offline, and empty states. Route-level `loading.tsx`, `error.tsx`, `not-found.tsx`, and `offline/` are intentional parts of the UX.
- `next.config.ts` allows remote Unsplash images and currently ignores TypeScript build errors. `eslint.config.mjs` also disables several strict checks; use explicit type-checking and focused tests to catch issues those settings do not report.
- Design/spec history is under `docs/superpowers/`; `docs/arquitectura.md` describes the intended roles of `app/`, `components/`, `lib/`, migrations, scripts, docs, and types. Prefer adding implementation detail to the relevant existing design/spec when a feature is already represented there.
