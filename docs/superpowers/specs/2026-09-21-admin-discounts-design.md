# Private admin discounts and live billing design

## Goal

Provide a private, continuously available administration entry point at
`admin.triwavex.com`. The owner can review subscription activity in real time
and manage discount campaigns for athlete and coach memberships without
exposing management controls to athletes, coaches, or ordinary staff.

## Access and deployment

- The existing Next.js administration area remains the single application and
  data source; the custom subdomain routes to it.
- Every request under the administration host and `/admin` is protected by a
  dedicated administrator login. The password is stored only as a server-side
  secret and verified with a slow password hash. It is never shipped to the
  browser or committed to source control.
- A successful login creates a secure, HTTP-only, signed, short-lived session.
  The session can be explicitly ended. Invalid or expired sessions always
  return to the login page.
- The middleware also checks the authenticated profile's administrator role
  when the owner later decides to use account-based admin access. The one
  private owner password is sufficient for the initial release.

## Live dashboard

- The existing metrics continue to read directly from Supabase.
- A discounts section is added to the private dashboard, with campaign status,
  audience, redemption count, dates, and a refresh action. The dashboard uses
  live queries or short polling so that changes made by the owner appear
  without publishing a new app version.

## Discount campaigns

Each campaign has an owner-visible title, an internal campaign code, target
membership (`athlete` or `coach`), discount level (0%, 25%, 50%, or 100%),
maximum redemptions, start and end dates, and status (draft, active, paused,
expired).

The server validates every field and records audit information: creator,
creation time, updates, redemption count, and the App Store offer reference.
Campaign codes are intentionally not public; the owner shares them manually
when needed.

## Apple subscription rule

TriWaveX subscription purchases on iPhone use StoreKit. A local coupon cannot
change an Apple subscription price. For each active campaign, the owner creates
the corresponding Apple subscription offer/offer code in App Store Connect and
records its reference in the private panel. The native app presents Apple's
secure offer-code redemption sheet; Apple determines eligibility and applies
the offer.

The panel therefore manages the campaign, records it, and links it to Apple.
It never claims a discount is active until Apple has returned a valid
transaction. This keeps trials, renewals, refunds, and entitlements accurate.

## Pricing currently configured

- Athlete membership: 5.99 EUR/month in Spain, with a seven-day free trial.
- Coach membership: 29.99 EUR/month in Spain, with a seven-day free trial.

The local StoreKit configuration mirrors these prices only for UI testing.
Production entitlements are verified by the backend using the signed StoreKit
transaction.

## Failure handling and verification

- Invalid passwords and malformed sessions disclose no account details.
- A missing Apple offer reference leaves a campaign in draft and it cannot be
  shown as redeemable.
- An expired or exhausted campaign remains visible to the owner but cannot be
  used.
- Tests cover password gate decisions, campaign validation, and protecting all
  admin routes.
- Manual verification covers subdomain access, logout, a StoreKit offer-code
  redemption attempt in Sandbox, and the live metrics refresh.
