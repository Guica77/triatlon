# Google Sign-In for the iOS app

The native SwiftUI button is implemented, and the app sends Google's ID token to the server for Supabase verification. Do not put a Google web-client secret in the iOS app.

## Google Cloud

1. In the Google Cloud project used for TriWaveX, configure the OAuth consent screen and create an **iOS OAuth client** for bundle ID `com.guillermohaya.triwavex`.
2. Create it in the same Google Cloud project as the Web OAuth client currently configured in Supabase. Copy its client ID and reversed client ID. They are public app identifiers, not secrets.
3. If the consent screen remains in Testing, add the intended tester accounts before trying the flow.

## Supabase Auth

1. In Authentication → Sign In / Providers → Google, enable Google.
2. Keep the **Web OAuth client ID and secret** in Supabase for the existing web OAuth flow. Add the iOS client ID to the provider's accepted client-ID/audience list, keeping the web client ID first if Supabase shows one comma-separated field. Confirm that the web ID and secret belong to the same Google Cloud project as the iOS client.
3. Keep the secret only in Supabase. The iOS flow calls `signInWithIdToken`; Supabase verifies the token and the server establishes the app session.

## Xcode

In the TriWaveX target's Build Settings, set these values for both Debug and Release:

- `GOOGLE_IOS_CLIENT_ID`: the iOS OAuth client ID from Google Cloud.
- `GOOGLE_IOS_REVERSED_CLIENT_ID`: the matching reversed client ID from Google Cloud.
- `GOOGLE_SERVER_CLIENT_ID`: the Web OAuth client ID already configured in Supabase. The Google SDK uses it as the audience for the ID token sent to the backend; it is not a secret.

The URL scheme is already wired to the second setting. Then run the app on an iPhone and verify athlete login, coach login, new-account onboarding, returning-account role protection, cancellation, and sign-out. Do not submit until this device test succeeds.

## References

- [Google Sign-In iOS integration](https://developers.google.com/identity/sign-in/ios/sign-in)
- [Google Sign-In project setup](https://developers.google.com/identity/sign-in/ios/start-integrating)
- [Supabase Google provider setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
