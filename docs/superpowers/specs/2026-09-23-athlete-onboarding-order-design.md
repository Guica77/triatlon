# Athlete onboarding order — design

## Goal

Move first-time athlete personalization before account creation so a new athlete sees value before being asked to register, while preserving the existing product, visual language, coach flow, returning-user login, and StoreKit checkout.

## Approved experience

1. A first-time athlete sees a concise welcome/value screen.
2. They choose goal, sport/modality, target race/distance (including “no date yet”), experience level, and weekly training availability.
3. The app shows a lightweight plan preview based on those preferences. This is an indicative preview, not a generated or persisted training plan.
4. The athlete creates an account using the existing supported methods (Apple and email/password); Google is included only if native Google authentication is already implemented and verified. Otherwise it remains an explicitly separate follow-up, not a fake/disabled promise.
5. After account creation and authentication, the app asks any health/injury questions with clear context and consent, then submits onboarding to the authenticated API.
6. Existing entitlement/paywall/StoreKit flow follows its current rules. Do not recreate prices, trial eligibility, restore purchases, or offer redemption as part of this change.

Returning users continue directly to the current login experience. The coach signup, onboarding, and checkout paths remain unchanged.

## Data handling

- Before account creation, store only the non-sensitive preference draft needed to resume the flow: goal, sport/modality, race/date choice, experience level, weekly availability, and current step.
- Do not persist injuries, medical details, health identifiers, or other sensitive health data in `UserDefaults`, analytics, or any pre-auth request.
- Keep the pre-account draft local to the device. Do not send it to Supabase or any API before authentication.
- After account creation, collect health/injury answers separately, with an explanation and appropriate consent, and send them only over the authenticated onboarding endpoint.
- Clear the local draft after successful onboarding, explicit cancellation/reset, and account sign-out. Define a bounded local expiry so an abandoned draft does not linger indefinitely.
- Avoid logging preference or health-answer contents. Analytics, if added later, may record only coarse step-completion events without the answers themselves.

## Scope and non-goals

This change is limited to first-time native athlete onboarding and its state handoff into existing registration, authenticated onboarding, and checkout. It does not change the web experience, coach flows, returning-user entry, subscription products, pricing, discount campaigns, AI behavior, database provider, public feedback board, analytics platform, widgets, or global privacy/security architecture. Those remain separate audit items and must not be described as completed by this change.

## Failure and recovery behavior

- Registration/authentication failure keeps the athlete on account creation and retains only the nonsensitive local draft.
- Authentication success followed by onboarding API failure allows retry without asking the athlete to repeat their preferences; sensitive answers remain in transient view state only unless an explicitly reviewed secure persistence design is added.
- Onboarding success clears the draft and navigates through the existing entitlement decision to the existing StoreKit experience.
- If the account already exists, route to the existing login path instead of silently creating a duplicate account.
- Back navigation must preserve entered non-sensitive answers and must not accidentally switch the selected role.

## Acceptance checks

- New athlete: welcome → preferences → preview → account creation → authenticated health questions → saved plan preview → existing payment decision.
- Returning athlete: existing login appears immediately; no new-athlete questions flash first.
- Coach: current coach route and payment behavior are unchanged.
- No onboarding API call or server persistence happens before authentication.
- No health/injury answer is stored in `UserDefaults`, sent to analytics, or included in unauthenticated requests.
- Registration, email confirmation, Apple authentication, retry, cancel, and duplicate-account cases recover without losing the local nonsensitive draft or entering a dead end.
- Existing StoreKit product display, trial eligibility, restore, and offer-code redemption remain unchanged and continue passing their tests.
- Build and relevant native/API tests pass; manual/simulator verification covers all three entry cases above.

## Open implementation details

Before implementation, confirm the current native Google Sign-In status and whether the existing Apple registration component can be reused after personalization without exposing an authenticated-only screen. Do not add Google auth by placeholder. Confirm existing local-draft expiry/reset conventions and the authenticated API’s handling of optional race date and deferred injury consent. Any unresolved legal wording or lawful basis for health data remains a release blocker for production, not something this UI change can certify.
