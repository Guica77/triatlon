# TestFlight SwiftUI core implementation plan

## Phase 0 — documentation discovery and current-state verification

Documentation discovery was performed directly in this turn. Subagent delegation was unavailable under the active collaboration policy, so no discovery conclusions are delegated.

### Allowed APIs and patterns

- Apple Sign in button: `SignInWithAppleButton` in SwiftUI and existing nonce/token handshake in `ios/TriWaveX/SessionModel.swift`. Follow [Apple's Sign in with Apple button docs](https://developer.apple.com/documentation/signinwithapple/displaying-sign-in-with-apple-buttons-in-your-app).
- Google iOS login: Google Sign-In SDK `GIDSignIn.sharedInstance.signIn(withPresenting:completion:)` and SwiftUI `GoogleSignInButton`; send the ID token to the trusted backend for validation. Do not use email/profile/user ID as proof of identity. Follow [Google's iOS integration](https://developers.google.com/identity/sign-in/ios/sign-in), [backend authentication guidance](https://developers.google.com/identity/sign-in/ios/backend-auth) and [Supabase Google provider guide](https://supabase.com/docs/guides/auth/social-login/auth-google).
- Existing server-side Supabase JS identity exchange pattern: `supabase.auth.signInWithIdToken({ provider: 'google', token })` only after configuring the provider; see [Supabase JS API](https://supabase.com/docs/reference/javascript/auth-signinwithidtoken). Preserve the project's server-cookie contract rather than installing a second direct-to-database auth client in SwiftUI.
- Existing StoreKit SwiftUI offer sheet: `.offerCodeRedemption(isPresented:onCompletion:)`, with verified transaction handling. Keep price and subscription entitlement derived from StoreKit/server-verified transactions. See [Apple's offer-code guide](https://developer.apple.com/documentation/storekit/supporting-offer-codes-in-your-app) and [`Transaction.currentEntitlements`](https://developer.apple.com/documentation/storekit/transaction/currententitlements).
- Private race-proof uploads: use a private Supabase Storage bucket and RLS ownership policies; do not use a public URL or service key in the app. See [Storage access control](https://supabase.com/docs/guides/storage/security/access-control) and [private bucket model](https://supabase.com/docs/guides/storage/buckets/fundamentals).
- TestFlight acceptance is not the same as a local build: upload a signed build, provide beta metadata, wait for processing, and account for first external-group review. See [TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/) and [upload builds](https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds).

### Existing repository patterns to follow

- App root/session restoration and first-frame selection: `ios/TriWaveX/RootView.swift:26-285`.
- Current startup splash: `ios/TriWaveX/StartupView.swift:3-59`.
- Native WebKit/native screen boundary: `ios/TriWaveX/ProductView.swift:139-199`, `:296-365`.
- Native plan networking/model pattern: `ios/TriWaveX/NativePlan.swift:6-120` and `app/api/native/athlete/plan/route.ts:29-67`.
- Authenticated profile API validation: `app/api/native/athlete/profile/route.ts:7-85`.
- Existing private feedback screen/API: `ios/TriWaveX/NativeProfile.swift:280-370` and `app/api/native/feedback/route.ts:1-44`.
- Current incomplete load sheet: `ios/TriWaveX/NativeProfile.swift:515-530`.
- Native unit test target: `ios/TriWaveXTests/SubscriptionFinishGateTests.swift`; test target declared in `ios/TriWaveX.xcodeproj/project.pbxproj:96-115`.

### Supabase changelog scan

The current changelog was checked. It reports removal of Management API `logs.all` on 2026-09-23, which is unrelated to these application auth, database, and Storage flows. Re-check the relevant Supabase documentation immediately before any schema/auth/storage changes because these products are actively updated.

### Anti-patterns to avoid

- Never trust a client-supplied discount percentage, campaign status, role, referral attribution or transaction entitlement.
- Never identify a Google user from email/profile fields; validate the ID token on the server.
- Never send a Supabase service key to iOS or make race-proof objects public.
- Never let an athlete-side load preference directly edit coach-managed workouts or mutate an existing active plan without explicit review and coach approval.
- Never reveal a cached/stale `WKWebView` screen as if it were the selected current route.
- Never claim that an offer, refund, TestFlight upload, or device test works until the corresponding Apple/backend/device state is confirmed.
- Do not stage or rewrite the pre-existing dirty worktree. Review each targeted diff first; keep `ios/build/` artifacts out of source control.

## Phase 1 — deterministic launch, login and onboarding

### Tasks

1. Model root entry states (restoring session, first-time intro, returning login, registration, checkout, authenticated route) so only one valid screen is renderable at a time.
2. Verify that returning users begin in the compact brand state, skip first-run copy, and reach login without an older splash/onboarding/login frame. Ensure session restoration wins before route reveal and a failed/slow restore lands in the intended login/error state.
3. Hide or invalidate old cached WebKit content until it is known to match the requested current route. Prefer replacing the athlete and coach home with native content in Phase 2 rather than retaining a stale overlay.
4. Audit animation timing, interruption, cancellation, reduce-motion behavior, Dynamic Type, VoiceOver labels and focus/keyboard behavior across first-run and returning-user paths.
5. Add pure state tests for entry routing and XCTest UI coverage only if the app test host supports it; otherwise record the simulator/device test blocker explicitly.

### Verification

- Add tests for first install, returning install (`triwavex.login-intro.seen.v1` true), restored authenticated session, expired/invalid session, offline restore, logout/re-login, app resume and Reduce Motion.
- Assert the previous login phrases and pre-onboarding prompts are absent from returning-user snapshots and no old web view is hit-testable during route loading.
- Run iOS Release build and `TriWaveXTests`; test on simulator and physical iPhone when CoreSimulator/device access is available.

### Anti-pattern guard

Do not “fix” a visual flash by shortening a timer only. Find the route/state that becomes visible; make entry selection deterministic and prove it with first-frame/UI checks.

## Phase 2 — native athlete Today/training core

### Tasks

1. Define a typed SwiftUI model/client from the existing plan and session API shapes; audit detail/completion/weather/health dependencies before deciding which new endpoint is truly needed.
2. Implement SwiftUI Today: current session, today's status, concise week preview, recovery context only when available, a clear no-plan state, retryable errors, and navigation to session detail/completion.
3. Replace the athlete `/dashboard` WebKit route in `ProductView`; preserve current native Plan/Progress/Chat/More navigation and avoid showing a fake preview as a real generated plan.
4. Validate all responses are authorized for the signed-in athlete and errors/empty states are truthful.

### Verification

- Model/client tests for session identity, empty plans, error status mapping, date/time zone boundaries and completed/missed states.
- API tests for anonymous, wrong-role, wrong-owner, normal athlete, no-plan and backend failure cases.
- iOS screen checks at compact/large text, dark/light appearance and Reduce Motion; VoiceOver order follows title → session → actions.

### Anti-pattern guard

Do not create a parallel database fetch layer inside a SwiftUI view; do not display hard-coded onboarding preview workouts as live plan data.

## Phase 3 — native coach home and athlete communication

### Tasks

1. Audit existing coach endpoints and role/ownership policies, pending athlete requests, plan-review actions and conversation navigation.
2. Build typed coach data models and a SwiftUI coach dashboard for assigned athletes, important pending items, and links to the athlete's plan/chat.
3. Add only missing authenticated server routes and tests. Preserve server-side authorization and avoid coupling account role to mutable client metadata.
4. Route `/coach/dashboard` to the native dashboard and verify coach onboarding/session restoration destinations.

### Verification

- Tests for cross-coach athlete access, non-coach accounts, empty roster, pending requests, network retry and revoked session.
- End-to-end coach-to-athlete test on real accounts: request, coach notice, response/plan decision and visible athlete status.

### Anti-pattern guard

Do not approximate coach alerts locally or reveal a request as accepted before the server confirms it.

## Phase 4 — persistent load preference, More and feedback

### Tasks

1. Replace the dead-end `NativeLoadAdjustmentSheet` with a saved account preference (scope and conservative progression cap), explicit explanation and preview.
2. Determine whether existing schema can hold the preference; if not, create a narrow migration, authenticated API and generated type update after checking current Supabase docs/RLS. Apply/retain RLS and verify server ownership.
3. Incorporate preference only into future training proposals. For athlete-managed plans require preview + confirmation; for coach-managed plans require coach approval and show pending/approved/rejected status to the athlete.
4. Audit the existing More feedback form and end-to-end insertion, plus support/cancellation/restore/refund guidance. Treat “publicaciones” as private product suggestions, not public posts.

### Verification

- Preference validation tests, save/fetch round-trip, relaunch/account reload and unauthorized-update tests.
- Confirm the current plan is unchanged before approval, pending coach changes cannot be confirmed by an athlete, and the athlete sees final status.
- Test feedback authenticated success, validation failure, rate/duplicate handling if applicable, server unavailable and privacy copy.

### Anti-pattern guard

Do not increase training load automatically from preference alone or remove safety limits. Do not send feedback/health context to an AI provider unless the user was informed and the action is covered by consent.

## Phase 5 — checkout, race discount, referral and AI consent

### Tasks

1. Audit dirty StoreKit, Apple transaction verification, discount admin and race-proof changes before editing. Preserve their existing work.
2. Keep StoreKit as the only price authority. Make offer-code entry discoverable in the native checkout and validate purchase, cancellation, restore, expired code and account-association results.
3. Connect native race-proof form to the existing private request/review workflow. Enforce file type/size/content validation, owner-only read, pending state, manual approval and one-use Apple offer issuance. Approved code appears only to the same account and is clearly time-limited/statused.
4. Complete referral code creation/attribution and reward eligibility server-side. Record referring account and new account, award only at the agreed first paid subscription event, prevent self-referral/duplicate reward and make each month's private campaign name/code traceable in admin.
5. Add explicit in-app AI data-sharing explanation immediately before first relevant AI request; it must identify actual configured provider/data/purpose and allow declining AI. Do not cache or reuse personalized health/training answers across users.

### Verification

- StoreKit sandbox tests and Apple server transaction tests for purchase, first paid renewal/start, offer redemption, restore, cancellation, refund status and duplicate notifications.
- Race-proof security tests for role, ownership, private upload/download, duplicate pending submissions, invalid file, manual approve/reject and no offer configured.
- Referral anti-abuse tests for self-referral, duplicate identities, same/different Apple account, redemption attribution and payout idempotency.
- AI tests prove the consent gate precedes outbound request, provider disclosure comes from active config, decline makes no request and personalized output is never cross-user cached.

### External inputs that cannot be fabricated

- App Store Connect: actual product IDs, localized prices, offer types, durations, eligibility and one-time codes.
- Google Cloud/Supabase Auth: iOS OAuth client ID, web client ID/client secret and allowed URL scheme/redirect values; store only the client-side identifier where required, server secret stays in server config.
- Supabase: migrations must be deployed to the intended project and security/auth settings confirmed there.
- Legal: controller identity/contact, actual processors/regions/retention and support/refund terms must match production practice.

### Anti-pattern guard

Never turn “25%/50%/100%” into arithmetic price manipulation in the app. The visible price and eligible offer come from App Store Connect/StoreKit. Never mark race proof as approved based solely on upload or client state.

## Phase 6 — complete audit and TestFlight go/no-go

### Tasks

1. Run repository tests, lint and TypeScript check; native Debug/Release build and XCTest; inspect archive entitlements, privacy manifest, URL schemes, permission strings and crash logs.
2. Exercise all app role/entry routes on simulator and physical iPhone, including all first-run/returning cases above, payments in Sandbox, account deletion and support.
3. Verify App Store Connect listing and privacy declarations, beta description/feedback email, test account, app record/bundle ID, build number, signing profile, export compliance and product/offer configuration.
4. Produce signed archive; upload only after owner approval, confirm processing status, then configure internal TestFlight group. External tester rollout waits for Apple's review.
5. Report a signed checklist with pass/fail/blocker evidence. Do not call it ready if simulator/device checks, required secrets, migrations or Apple configurations remain unresolved.

### Anti-pattern guard

A successful compile is not a functional test or an App Store Connect upload. External TestFlight is not enabled merely by archiving; Apple requires processing, beta details, tester groups and possibly first-build review.

## Order and stopping rules

Start with Phase 1 and fix the launch/no-old-frame defect first. Then Phase 2 because it removes the current web dependency from the athlete's core screen. Do Phase 3–5 in bounded slices, running their tests before proceeding. Phase 6 is the final gate. If a phase depends on credentials, App Store Connect actions, un-deployed migrations, or unavailable hardware, keep safe local work moving but report the exact blocker without claiming completion.
