# TriWaveX Post-Purchase Guided Onboarding

## Objective

After a verified App Store subscription or trial begins, introduce TriWaveX without delaying access to the product. The experience must be native SwiftUI, role-specific, understandable in under 30 seconds, and followed by contextual guidance only when the user reaches a feature for the first time.

The athlete should understand where to find today's workout, the plan, progress, and help from a coach or AI. The coach should understand where to manage athletes, invite the first athlete, review plans, and communicate.

## Product Principles

- Teach by demonstrating one useful action, then let the user perform it.
- Keep the initial tour to three steps and 20–30 seconds.
- Never block normal navigation after the user skips or finishes the tour.
- Use short, role-specific copy; never show a manual or a dense feature list.
- Preserve the user's progress locally and on the account so the tour does not restart across devices.
- Use progressive disclosure: secondary features explain themselves on first use.
- Do not execute payments, send invitations or messages, or change workouts on the user's behalf.
- Address the user naturally by their given name without repeating it in every step.

## Personalization

The coordinator receives the authenticated profile's given name before presenting the first step. The opening and closing copy use the normalized name, for example: “Guillermo, aquí empieza tu día” and “Guillermo, ya estás listo.” Intermediate instructions remain concise and do not repeat the name mechanically.

Names are trimmed and validated for display length. If the name is missing, still loading, implausibly long, or contains only symbols, the tour uses a natural role-neutral greeting without a placeholder. The tour never blocks while waiting for a name and does not infer a name from the email address. VoiceOver reads the personalized sentence once without adding the name to every control label.

## Entry Conditions

The tour starts only after StoreKit returns a verified transaction and the server has acknowledged the user's entitlement. It also starts after a restored purchase if the account has never completed the tour.

The tour must not start when:

- payment is pending, cancelled, unverified, or failed;
- the user has already completed or skipped the current tour version;
- the app is launched only to complete an authentication callback;
- required account data has not loaded.

If entitlement acknowledgement is temporarily unavailable, the app enters normally and offers the tour later from a non-blocking card. Payment success is never discarded because the tour failed.

## Athlete Flow

The initial tour has three steps:

1. **Today:** an animated touch cursor highlights the Today tab and the current workout card. Copy: “Aquí empieza cada día.” The demonstration opens the workout preview but does not start or complete it.
2. **Your support:** the cursor briefly traces the Plan and Chat tabs. Copy: “Consulta tu semana y pide ayuda cuando la necesites.” This is one continuous demonstration, not two additional pages.
3. **First mission:** the user receives a small mission card: “Abre tu primera sesión.” The primary action enters the real workout. Copy closes with “Ya estás listo.”

The onboarding does not wait for a real workout to finish. When the first workout is later marked complete, a separate one-time celebration reinforces progress and introduces the Progress section.

## Coach Flow

The initial tour has three steps:

1. **Your athletes:** the animated cursor highlights the athlete area. Copy: “Tu equipo, en un solo lugar.”
2. **Invite:** the cursor highlights the invite action. Copy: “Empieza invitando a tu primer atleta.” The user must choose to send or copy the real invitation.
3. **Manage:** the cursor briefly traces plan review and Chat. Copy: “Revisa, adapta y acompaña.” The closing action is “Preparar mi equipo.”

If the coach postpones the invitation, the app still finishes the tour and keeps a dismissible mission card on the dashboard.

## Native Visual Language

All screens and overlays are SwiftUI. The implementation uses system materials, Dynamic Type, SF Symbols, semantic colors, native buttons, and the project's existing motion and spacing tokens.

The guide cursor represents touch on iPhone rather than a desktop mouse. It is a compact white pointer or fingertip with a soft shadow and a single pulse when it reaches its target. On iPad it may use a pointer appearance. The cursor never obscures labels or sits over the tab bar longer than the demonstration.

Each step consists of:

- a dimmed scrim;
- a rounded spotlight cutout around the target;
- the animated cursor path;
- one title and one sentence;
- Skip and Continue controls;
- a visible progress indicator using three small capsules.

Animations use short spring or ease-in-out transitions. With Reduce Motion enabled, the cursor jumps between targets and uses opacity instead of movement. Haptics are subtle and disabled when the device settings require it.

## Architecture

### `GuidedOnboardingCoordinator`

An `@MainActor @Observable` model owns the role, current step, tour version, completion state, and presentation state. It exposes explicit events such as `start`, `advance`, `skip`, `finish`, and `featureDiscovered`.

### `GuidedOnboardingOverlay`

A reusable SwiftUI overlay renders the scrim, spotlight, cursor, copy, controls, and accessibility representation. Screens register targets by stable identifiers and report their frames through a SwiftUI preference key. The overlay never searches the UIKit view hierarchy or depends on fragile screen coordinates.

### Role Definitions

Athlete and coach tours are data definitions containing step identifiers, target identifiers, copy, permitted demonstration action, and completion action. The overlay renderer is shared; business logic remains in the real destination screen.

### `OnboardingProgressStore`

Progress is stored immediately on device for responsiveness and synchronized to the existing backend account. The stored record contains role, tour version, completed step identifiers, skipped/completed state, and the contextual tips already seen. No health, workout, or payment data is duplicated in this record.

### StoreKit Handoff

`NativeSubscriptionStoreView` finishes payment only after a verified transaction. Its success callback requests entitlement acknowledgement and then hands a `postPurchaseTour` destination to the root flow. This replaces a blind transition directly into the product while preserving the existing payment error handling.

## Progressive Guidance

After the short tour, first-use tips appear only in context:

- Athlete: editing a plan, recording recovery, completing a workout, viewing progress, connecting a device, and contacting a coach or AI.
- Coach: reviewing an athlete, adapting a plan, responding in Chat, monitoring progress, and managing capacity.
- Devices and health: on the first visit to Profile, explain where supported Apple Health and external-provider connections are managed.
- Injuries and recovery: when the user first records readiness or a limitation, explain that TriWaveX can adapt training load but does not replace medical advice.
- Plan and subscription: on the first relevant visit, explain where goals, plan changes, purchase restoration, and subscription management live.

Only one tip may be visible at a time. A dismissed tip does not immediately reappear. Every tip is reachable later from Profile > Help > Discover TriWaveX.

## Accessibility

- VoiceOver describes the highlighted control, purpose, and available action without narrating cursor movement.
- The real target remains reachable and receives accessibility focus.
- Text supports Dynamic Type without clipping.
- Color is never the only progress indicator.
- Reduce Motion and Reduce Transparency are respected.
- The tour supports interruption, backgrounding, and resumption at the last stable step.

## Error and Interruption Handling

- If a target has not loaded, show a normal loading state and wait for its registered anchor; after a timeout, skip that demonstration and continue with an accessible explanation.
- If network data fails, dismiss the overlay and expose the screen's normal retry state.
- If the app closes mid-tour, resume at the last completed step, not mid-animation.
- If the role changes or is corrected, discard incompatible local progress and load the matching server state.
- If an invitation or workout action fails, keep the user on the real screen with its standard error message; the tour does not claim success.

## Analytics and Privacy

Record only lifecycle events: tour offered, started, step completed, skipped, finished, contextual tip viewed, and first mission completed. Include role and tour version, but no workout contents, injury information, chat text, athlete identity, email, or payment credentials.

Success metrics are completion rate, time to first useful action, first workout opened/completed for athletes, and first invitation initiated/accepted for coaches. The tour must not optimize for completion at the cost of real product use.

## Testing and Acceptance

### Unit Tests

- correct role definition and step order;
- persistence and version migration;
- skip, resume, and completion transitions;
- payment states never launch the tour before verified entitlement;
- contextual tips appear once.

### UI Tests

- athlete purchase success through first mission;
- coach purchase success through invitation;
- restored purchase for a new and an existing account;
- target unavailable, offline, background/resume, and relaunch behavior;
- Dynamic Type, VoiceOver, light/dark mode, and Reduce Motion;
- compact iPhone and iPad layouts.

### Acceptance Criteria

- The initial flow contains exactly three steps per role and can be skipped immediately.
- A normal path takes no more than 30 seconds before the main app is fully usable.
- No web view is used for the guide UI.
- No simulated gesture performs a consequential action.
- The app never repeats a completed version of the tour.
- App Store Release builds contain the production guide but no debug capture automation.

## Out of Scope

- A long full-app video inside the onboarding.
- A conversational AI onboarding assistant.
- Redesigning the underlying workout, plan, chat, progress, athlete, or payment screens.
- Automatically sending coach invitations or completing workouts.
