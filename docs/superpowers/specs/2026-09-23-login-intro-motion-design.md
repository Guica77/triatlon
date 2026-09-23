# Login intro motion improvement

## Goal

Keep TriWaveX's full onboarding/login brand intro while making the wait feel deliberate, responsive, and polished rather than stalled.

## Direction selected

Use a refined version of visual option B. Keep the current sequence and all three intro phrases, the oversized TriWaveX wordmark, its scale-down/lift motion, and the current rule that reveals login controls after the brand intro. Improve pacing and continuous feedback so the user does not experience long, visually inert gaps. Do not overlap the login form with the final wordmark lift.

## Experience

- Retain the existing brand story, phrase order, and wordmark scale/lift; do not skip, remove, or replace any part of the intro.
- Shorten excessive dwell between phrases while keeping each phrase readable. Tune durations on-device/simulator rather than blindly replacing all current timing with one constant.
- Improve visual continuity between phrase changes and the wordmark lift with restrained, purposeful progress feedback tied to intro stages and smoother stage transitions.
- Keep the current staged reveal order for role selector, sign-in fields, and actions. Do not reveal the form during the final wordmark lift.
- Keep the intro interruptible by lifecycle cancellation and respect Reduce Motion with shorter, low-motion transitions.
- Avoid introducing a fake network/loading state: progress feedback represents only the local intro sequence.
- Preserve existing auth behavior, roles, registration routes, social sign-in, persistence, and accessibility labels.

## Implementation boundaries

Scope is limited to the SwiftUI login intro and its local animation state in `ios/TriWaveX/RootView.swift` (plus focused tests if the current test structure can verify the sequencing). No authentication/API changes, copy changes, or onboarding-flow changes are included.

## Validation

- Build the iOS app for Simulator.
- Run relevant native tests; if Xcode's test runner hangs, record that as unverified rather than passing.
- Verify first-run and returning-user intro paths, including Reduce Motion and lifecycle cancellation.
- Confirm no controls flash from an older intro state and no auth fields or buttons become unreachable.
- Re-run the existing web lint/type/test checks only if implementation touches shared code (expected not to).

## Acceptance criteria

1. All original intro phrases and the full TriWaveX wordmark scale/lift sequence remain in the same order.
2. Phrase holds remain readable but no longer create multi-second visually inert gaps.
3. Subtle progress feedback and smoother transitions make the full intro feel continuous.
4. Login controls retain their existing after-intro reveal order; no early form overlap is introduced.
5. Reduced-motion and cancellation paths remain correct, and auth functionality is unchanged.
6. Simulator build succeeds; native test status is reported honestly.
