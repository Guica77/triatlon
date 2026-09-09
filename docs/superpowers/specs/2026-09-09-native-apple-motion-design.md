# Native Apple-style controls and motion

## Goal

Give the TriWaveX iOS shell a coherent, native SwiftUI interaction language while retaining its aqua, lime, coral, and deep-navy brand palette.

## Shared controls

* Primary actions use a full-width capsule with the contextual TriWaveX color, a subtle lift, highlight, and a brief scale response while pressed.
* Secondary actions use the same dimensions and corner language, with translucent material, a thin border, and no competing saturated fill.
* Destructive and unavailable actions retain semantic colors and disabled clarity; motion never becomes the only status signal.
* A single SwiftUI `ButtonStyle` supplies press feedback so login, retry, navigation, and future native controls do not drift visually.

## Selection and navigation

* The athlete/coach selector uses one shared sliding capsule with a spring tuned for quick, controlled response.
* The native bottom navigation uses the same active capsule and tactile style rather than independent button treatments.
* Selected states retain their existing aqua/lime brand meanings and include accessibility selection traits.

## Screen state motion

* Loading surfaces crossfade in and out; retry/error surfaces use a short opacity/scale transition rather than a hard visual replacement.
* Alerts and native Strava status messages use the system presentation, with the shared buttons inside the app retaining their tactile feedback.
* Motion uses short durations and no continuous decorative animation.

## Accessibility and safety

* `accessibilityReduceMotion` replaces spring and scale movement with opacity-only or no animation.
* Controls retain at least 44 pt touch targets and readable semantic text.
* The implementation remains entirely in SwiftUI. Web pages rendered by `WKWebView` are not altered by this change.

## Verification

* Build the iOS simulator target.
* Check primary, secondary, disabled, error, and selected controls in login and authenticated navigation.
* Check with Reduce Motion enabled.
* Confirm the web appearance and navigation remain unaffected.
