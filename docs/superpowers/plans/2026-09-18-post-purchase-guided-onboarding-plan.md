# Post-Purchase Guided Onboarding Implementation Plan

## Goal

Ship a three-step, role-specific SwiftUI guide that starts only after a verified App Store purchase, addresses the user by given name, persists completion, and leaves contextual first-use tips for advanced areas.

## 1. Model and Persistence

- Add a focused guided-onboarding model with role, versioned progress, safe name normalization, step definitions, skip/resume, and completion.
- Store progress in account-scoped `UserDefaults` keys initially; keep the model isolated so backend synchronization can replace the storage implementation without changing UI.
- Cover the pure state transitions and name normalization with Swift tests where the current project setup permits; otherwise validate through deterministic debug previews and build checks.

## 2. SwiftUI Presentation

- Add a reusable native overlay with material card, three-capsule progress, Skip/Continue controls, animated touch cursor, spotlight treatment, accessibility focus, and Reduce Motion fallback.
- Keep demonstrations non-consequential: tab highlighting and navigation are allowed; sending, purchasing, editing, and workout completion require real user input.

## 3. Payment and Registration Handoff

- Return the normalized given name and role from native registration.
- Distinguish verified purchase completion from “activate later.”
- Route verified athlete and coach purchases into the product with a pending tour context; do not launch the tour after cancellation, failure, or deferred activation.

## 4. Product Integration

- Present athlete and coach step definitions from `ProductView`.
- Athlete: Today/current session, Plan plus support, then first-session mission.
- Coach: athletes, invite, then plan review plus Chat.
- Add contextual first-use tip state for devices/health, injuries/recovery, and plan/subscription, with replay entry from Profile help.

## 5. Verification

- Build Debug and Release for iOS Simulator.
- Verify light/dark mode, compact iPhone, large Dynamic Type, VoiceOver labels, and Reduce Motion behavior.
- Confirm the tour is absent after skip/completion, survives relaunch, and never appears after an unverified or deferred payment.
- Confirm existing login, registration, payment, navigation, plan, progress, chat, and profile routes still build and remain reachable.
