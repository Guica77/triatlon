# Native Strava connection design

## Goal

Let an authenticated TriWaveX iOS user connect Strava through Apple's secure authentication session, return to the installed TriWaveX app, and see a clear connected state in Settings. The web connection remains available independently.

## Chosen flow

1. The native Settings experience exposes a `Conectar con Strava` control.
2. The iOS client requests a short-lived, one-use authorization URL from the TriWaveX server using its authenticated native session.
3. iOS opens the URL in `ASWebAuthenticationSession`; it is not rendered in `WKWebView`.
4. Strava presents its own login and consent screen, requesting only `read` and `activity:read_all`.
5. Strava redirects to the registered TriWaveX mobile callback (`triwavex://strava/callback`) with the server-issued signed state.
6. The app validates the return through the server, which exchanges the short-lived Strava code, persists encrypted connection data in the existing `user_connected_devices` row, and updates `profiles.strava_connected`.
7. The screen changes to `Strava conectado`, offers manual refresh and disconnect, and reports cancellation, expired state, unavailable integration, or connection failures without exposing secrets.

## Components and boundaries

* `SessionModel` owns the short-lived native access credential and invokes a dedicated `StravaSessionModel`; neither stores a Strava secret or long-lived Strava token on the device.
* `StravaSessionModel` owns the `ASWebAuthenticationSession`, URL validation, in-progress state, and user-facing status.
* `Native Strava API` routes issue and consume signed one-use state, exchange the code server-side, and return an explicit status payload. They do not reuse cookie-only web routes.
* `TriWaveX-Info.plist` registers the `triwavex` callback scheme and the `strava` query scheme required by Strava's iOS mobile OAuth guidance.
* The existing web `/api/auth/telemetry/*` routes and Settings card remain unchanged, so browser users retain their own working flow.

## Security and privacy

* `STRAVA_CLIENT_SECRET`, access tokens, refresh tokens, and the OAuth authorization code never enter app logs or the iOS UI.
* State is signed, short-lived, single-use, and bound to the logged-in TriWaveX user.
* Returned URLs must use the registered `triwavex` scheme, expected host/path, and contain a server-validated state before changing UI state.
* The server checks the exact scopes Strava returned; missing activity access results in a recoverable message rather than a partially connected account.
* Disconnect deletes the stored TriWaveX connection and revokes the Strava grant server-side where the current server integration supports it.

## Configuration required outside source code

* The Strava application must use TriWaveX branding, website `https://triwavex.com`, and callback domain `triwavex.com`.
* Production and staging each need their actual `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` in their host environment. No credentials are committed.
* The App Store submission must describe Strava activity import in the privacy disclosures before release.

## Verification

* Unit-test URL construction, signed-state expiry/replay rejection, and callback URL validation.
* Build the iOS target with the registered URL/query schemes.
* On a physical device, test the installed-Strava path, the browser fallback path, user cancellation, denied scope, successful connection, activity import, and disconnect.
* Verify the existing browser connection remains functional.

## Deliberate first-version limits

* This change connects and imports Strava activities; it does not add activity upload or route write permissions.
* Google native OAuth is separate work and is not changed here.
