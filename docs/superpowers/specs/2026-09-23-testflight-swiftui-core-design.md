# TriWaveX iOS: SwiftUI core and TestFlight readiness

Date: 2026-09-23

## Decision

Proceed with a phased, native-first SwiftUI release path. Keep existing native screens and backend services; do not rewrite stable screens or build a second data layer. Replace the WebKit-backed athlete home/training dashboard and coach dashboard with native screens backed by authenticated server APIs. Retire remaining `WKWebView` routes incrementally after the native equivalents pass regression checks.

“Publicaciones para mejorar la app” is interpreted as private, user-submitted product feedback in More, consistent with the previously discussed Feedback destination. It is not a public community feed.

## Current state observed

- Native SwiftUI exists for authentication, athlete onboarding, checkout, plan, progress, chat, More/profile, account controls and some device connections.
- `ProductView` still routes the athlete `/dashboard` and coach `/coach/dashboard` through `ProductWebView`. The most important day-to-day training surfaces are therefore not fully native.
- The native “Subir carga” sheet allows scope/progression selection but has no save/apply action or persistence.
- StoreKit offer-code redemption exists. Campaign activation and real eligibility/pricing remain dependent on App Store Connect configuration.
- Race-proof submission and manual review currently exist in the web app; the native app does not yet connect that flow to the purchase experience. Native referral attribution and fulfillment are also not complete.
- Release configuration currently reports version `0.1.0` / build `3`. Release compilation has succeeded, but Simulator services were unavailable, so XCTest/UI tests and a device run have not been verified.

## Goals

1. Make the SwiftUI app's main athlete and coach experiences native, coherent and backed by real, role-authorized data.
2. Preserve the current visual language and already-native flows while fixing incomplete actions, loading/empty/error states, accessibility and navigation.
3. Make purchase, race-proof discount, referral and support behavior explicit and truthful. Never display a discount as active until the corresponding Apple offer is configured and validated.
4. Establish a release gate that distinguishes local build success from a signed, installable, sandbox-tested TestFlight build.

## Phased scope

### Phase 1 — native core and correctness

- Keep and audit the existing native login, role-specific coach/athlete entry, onboarding, consent, checkout, Plan, Progress, Chat and More screens.
- Complete the requested Google sign-in path alongside Apple and email, with explicit role routing and no account-linking surprise; provide support, restore, cancel-subscription and refund guidance without implying the app can grant an Apple refund itself.
- Replace athlete Today/dashboard with SwiftUI for today's session, week preview, completion/progress and clear links into session detail. Preserve the current API and database as the source of truth; add narrowly scoped authenticated endpoints only where the existing API does not support the screen.
- Replace the coach dashboard with SwiftUI for the coach's active athletes, actionable pending items, and navigation into athlete plans/conversation. Do not duplicate or silently weaken server authorization.
- Finish load-adjustment preference as an account-persisted preference. It may influence future generated proposals; it must not silently rewrite active workouts. Show a preview and explicit confirmation before an athlete-owned plan changes. A coach-managed plan requires coach approval, and the athlete receives a clear status/update.
- Keep More's private feedback form, verify its authenticated persistence and success/failure states, and make its privacy copy accurate. Do not create a public feed in this phase.
- Add or finish the native race-proof request and referral journeys using server-side validation and private storage. Race proof remains pending until manually approved; approval must bind to a real, eligible App Store Connect offer/code. Referral attribution records the referring account and redemption outcome. Explain that a transferable Apple offer code cannot be cryptographically restricted to a named human by the client UI.
- Explain AI data handling before the first relevant AI action: what user-specific information is sent, to which configured provider, for what purpose, and the available non-AI alternative. The app must not imply data stays on-device if it leaves the device.

### Phase 2 — remaining embedded routes

- Inventory every remaining `WKWebView` destination and migrate only after its native replacement has feature parity and test coverage.
- Remove the web container and related bridge paths when no supported app route depends on them. This is not a prerequisite to claim that the Phase 1 core itself is native, but any remaining web route must be disclosed during internal TestFlight review.

## Data flow and boundaries

- SwiftUI views call small, typed client/model boundaries; views do not issue direct database writes.
- Existing authenticated server routes remain the policy boundary. Any new route validates session, role, input shape, origin/native marker and ownership; storage remains private and downloads use short-lived authorization.
- Supabase schema changes require a migration, RLS review, relevant Supabase documentation check and database verification. No service-role credential enters the iOS client.
- StoreKit owns purchase and offer redemption. Server verification associates verified transactions with the TriWaveX account; local promo strings never change a price.
- Network operations expose loading, empty, recoverable error and success states; retry must be safe for duplicate submissions and purchase callbacks.

## Release verification / go-no-go

Required before calling the app ready for TestFlight:

1. Swift Release build and project tests pass; Simulator tests run on an available iOS runtime.
2. Install and manually walk first-run and returning-user paths on a physical iPhone, including Apple sign-in, email login, coach role, onboarding resume, consent, checkout cancellation/retry/restore, plan, workout, More/feedback and logout/account deletion.
3. StoreKit sandbox verifies each configured subscription and offer path, including cancellation, restore and unlinked/expired code messaging. App Store Connect products and offers are confirmed by the owner; the build must not suggest unconfigured discounts are live.
4. Verify privacy manifest, permission prompts, privacy policy URL/content, support URL/contact, bundle identity/version/build, icon, signing team/profile, export compliance answers, beta description and reviewer test account in App Store Connect.
5. Upload an archived, correctly signed build and confirm it appears in TestFlight processing; only then call it uploaded/ready. External testing additionally depends on Apple's beta review.

Known environmental boundary: this workspace currently cannot reach CoreSimulatorService. If that remains true, report native simulator/UI verification as blocked and require a device run rather than treating compilation as behavioral proof.

## Acceptance criteria

- The athlete and coach primary home screens render in SwiftUI and use live, authorized app data; they contain no hard-coded preview plans or silent fallback that looks like success.
- Load preference survives relaunch/account sign-in and has a safe, reviewable application path.
- Apple/Google/email login and onboarding exits preserve a coherent destination and recoverable state; AI and health consent are separate, explicit and revocable where applicable.
- Feedback, race requests and referral results have a clear user-visible status and admin/Apple dependencies are represented honestly.
- No critical screen has a dead control, stale placeholder, unbounded loading state, silent API failure, or misleading price/discount claim.
- Automated checks, simulator/device checks and App Store Connect release checks are recorded separately; no claim of “perfect” or “ready” is made beyond demonstrated evidence.

## Out of scope for the first implementation slice

- A public social/community posting feed.
- Rewriting every web-based coach management/reporting tool before the primary coach dashboard has been validated.
- Guaranteeing an Apple offer code cannot be forwarded; the app can make codes unique, private-by-default, attributable and one-time where Apple's offer configuration supports it, but must not claim identity-bound redemption without platform support.
- Activating or creating App Store Connect products/offers without the app owner's review of their commercial terms.
