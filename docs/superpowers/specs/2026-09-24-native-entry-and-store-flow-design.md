# TriWaveX native entry and store flow

## Goal

Make the first-run path explain TriWaveX before authentication or payment, make the athlete and coach paths equally understandable, and make Google sign-in and StoreKit failures actionable instead of appearing as generic broken screens.

## Approved flow

1. A first-time visitor sees a short SwiftUI introduction to the app before sign-in. It explains the athlete training plan, coaching relationship, progress and adjustment controls, and that subscription payment happens only after account creation and plan review.
2. The visitor chooses athlete or coach. Athletes continue through the existing pre-auth questionnaire and sample week; coaches receive a concise equivalent explanation of their workspace and athlete-capacity subscription before registration.
3. The visitor creates an account or signs in with Apple, Google, or email. Returning users with an existing session go directly to the app; returning users who open the login screen can sign in without replaying first-run education.
4. New accounts finish the relevant onboarding. The subscription screen then loads the matching StoreKit products and shows Apple's localized price and renewal terms before confirmation. Missing App Store Connect products must be clearly marked unavailable; there must be no simulated success in a production build.

## Google authentication

- Keep the iOS OAuth client ID and web OAuth client ID from the same Google Cloud project in the Xcode configuration; the reversed iOS client ID remains the URL scheme.
- Supabase's Google provider must contain the web ID first and the iOS ID second, comma-separated, and the matching web client secret.
- Supabase's current Swift/native Google instructions require `Skip nonce check`. This is a security trade-off and must be explicitly confirmed before changing the live provider setting.
- The previously displayed client secret is considered exposed. The owner must rotate it in Google Cloud and replace the Supabase value without sharing the new secret in chat or source control.
- Preserve server-side ID-token verification and provide a safe, actionable user message for provider/configuration errors without returning tokens or secrets.

## StoreKit

- The app requests `com.triwavex.athlete.monthly`, `com.triwavex.coach.monthly`, and coach capacity products `com.triwavex.coach.monthly.15` through `.50` in five-athlete steps.
- Each intended product must exist, be available for the app, and have matching subscription metadata in App Store Connect. The local `.storekit` file is only a development test fixture and does not publish products.
- Empty product results and StoreKit request failures remain visible as distinct, retryable states. A subscription is granted only after verified StoreKit transaction reconciliation succeeds.

## Verification

- UI-flow checks: first-run education precedes authentication for both roles; the athlete questionnaire remains before account creation; payment follows account setup; returning users bypass first-run education.
- Google checks: inspect the built app's resolved OAuth IDs and URL scheme; exercise the native callback; verify Supabase rejects an invalid ID token and accepts a valid one after the provider configuration is confirmed.
- StoreKit checks: exercise local transactions with the Xcode StoreKit configuration, then verify real product IDs and sandbox purchase/restore behavior using App Store Connect products. Local simulation alone is not evidence that production products are configured.
- Run iOS build/tests where the installed Xcode simulator service permits, and run the existing web test suite for shared registration/session routes.

## Boundaries

The assistant must not expose or commit OAuth secrets, claim App Store Connect products exist without checking the account, or treat a successful local StoreKit simulation as a real purchase. A physical-device and sandbox pass is required before calling the payment flow verified.
