# Apple coach capacity pricing and offer codes

## Approval

Approved by the product owner in chat on 2026-09-23:

- Athlete subscription remains €5.99/month.
- Coach subscription includes up to 10 active athletes for €29.99/month.
- Each additional block of up to 5 athletes adds €2.99/month, through a maximum of 50 active athletes.
- Discount campaigns 25%, 50%, and 100% cover the athlete plan and every coach capacity tier.
- Each discount lasts one monthly billing period. The 100% offer is one month free and then renews at the selected product's normal monthly price.
- Consumer purchases and offer redemption happen in the iPhone app through Apple. The web app remains a coach portal; it is not a checkout.

The owner approved the business rules and approach, not live product creation in App Store Connect. Exact Apple price points, product metadata, offer-code details, API secrets, review, and sale availability remain external release prerequisites.

## Recommended design

Represent coach capacity as a single auto-renewable subscription tier in the existing TriWaveX Access subscription group. Keep the current 10-seat product identifier for compatibility and add one monthly product per higher capacity tier. Apple charges one consolidated price per month rather than a stack of separate add-on subscriptions.

| Included active athletes | Target monthly price | Product identifier |
| ---: | ---: | --- |
| 10 | €29.99 | `com.triwavex.coach.monthly` (existing) |
| 15 | €32.98 | `com.triwavex.coach.monthly.15` |
| 20 | €35.97 | `com.triwavex.coach.monthly.20` |
| 25 | €38.96 | `com.triwavex.coach.monthly.25` |
| 30 | €41.95 | `com.triwavex.coach.monthly.30` |
| 35 | €44.94 | `com.triwavex.coach.monthly.35` |
| 40 | €47.93 | `com.triwavex.coach.monthly.40` |
| 45 | €50.92 | `com.triwavex.coach.monthly.45` |
| 50 | €53.91 | `com.triwavex.coach.monthly.50` |

The target is exactly €2.99 more for each five-seat block. Before creating or activating products, verify that App Store Connect offers the exact price in the base territory and review localized storefront prices. If Apple does not offer an exact target, stop and ask the owner to approve a revised amount; do not silently change the advertised price. The app always displays Apple's `Product.displayPrice` for the selected tier.

## Offers

Create 30 Apple offer-code offers: one 25%, one 50%, and one 100% offer for each of the 10 products (one athlete product plus nine coach-capacity products). Each offer applies for one monthly period. The 100% offer is a free month and automatically renews at the product's normal price; the Apple confirmation sheet must disclose that renewal. The 25% and 50% offer period is one month at its selected offer price, followed by the normal price. Eligibility, territories, and code redemption limits are configured in App Store Connect for each offer.

The private admin panel records internal campaigns and their matching Apple product/offer references. It must clearly distinguish internal campaign identifiers from Apple redemption codes and must not suggest that changing the panel's status creates, activates, or verifies an Apple offer. Apple remains the source of truth for availability, price, duration, eligibility, and redemption counts.

The existing `admin_discount_campaigns` table only identifies `membership`; implementation must add a product identifier (and capacity display metadata for coaches), backfill the existing draft rows to the applicable base products, and enforce one campaign mapping per Apple product and discount. The panel should prepare 30 distinct product/discount references, not six generic role-only rows. The custom Apple redemption string, where used, is a secret and must only be shown to the administrator; an internal label must never be passed to the StoreKit redemption sheet as if it were an Apple code.

The consumer redemption UI remains StoreKit's Apple offer-code sheet. The server verifies Apple's signed transaction; for an external offer-code redemption that lacks an app account token, it associates the original transaction with the authenticated TriWaveX account using App Store Server API. Missing credentials or Apple errors fail closed without granting entitlement.

## Entitlement and capacity enforcement

- Map each verified Apple product identifier to exactly one server-owned role and capacity. Never accept a capacity supplied by the client.
- Athlete product grants the athlete plan. A coach product grants the coach plan and its encoded capacity.
- Count active, accepted `coach_athletes` links. Pending applications do not consume a seat; a coach cannot accept a request if doing so would exceed the purchased tier.
- Enforce the count and acceptance atomically in the database so simultaneous accepts cannot overbook the last seat.
- A lower-tier subscription never silently removes athletes. Existing links remain intact; if an account is above its new limit, block new accepts until it has capacity again or upgrades. At 50, block further accepts.
- The iPhone purchase/offer confirmation always shows the exact Apple price and monthly renewal terms before payment. The web portal does not initiate or collect payments.
- Keep each tier in the existing TriWaveX Access subscription group for this first release. The role in the signed-in profile must match the signed Apple product; switching between athlete and coach through Apple's subscription-management screen is not supported by this capacity change and must not unlock the other role.

## Failure behavior and operations

- Unknown or mismatched Apple product IDs, invalid signatures, mismatched account tokens, and unsupported tiers grant no entitlement.
- If Apple product metadata is unavailable, show a clear unavailable state rather than a guessed price.
- If offer-code account association fails, retain the existing access state and show support guidance; never tell the user a purchase succeeded until server reconciliation succeeds.
- Keep Apple Server Notifications V2 as the source for renewal, expiry, refunds, and revocation. The database entitlement stores the verified product ID; capacity is derived from that product mapping.
- Keep the App Store Connect API `.p8` key only in server-side secrets; never use the Sign in with Apple key for this API and never place a private key in the app bundle or repository.

## App Store Connect setup

1. In the existing subscription group, create the eight new monthly coach tiers, set user-facing names that disclose capacity, and rank tiers by capacity. Keep the existing 10-athlete product identifier and price.
2. Verify €2.99 cumulative increments using App Store Connect's available price points; stop for approval if any target price is unavailable.
3. For each of the ten products, create 25%, 50%, and 100% one-month offers, select territories and eligibility, and set the free-month offer to renew at the standard price. Prevent accidental stacking with the existing seven-day introductory trial unless the owner explicitly chooses to allow stacking.
4. Create the corresponding Apple offer codes with redemption limits and expiry appropriate to each campaign. Record references in the private panel.
5. Configure a separate App Store Connect API key for the `Set App Account Token` server operation. Keep its issuer ID, key ID, and encoded private key in the production secret manager.
6. Test products and offers in sandbox. App Store's live offer codes require the app to reach **Ready for Sale**; do not call this live-ready before Apple has approved the required products and version.

## Validation plan

- Unit tests for all ten product mappings, roles, seat capacities, and unknown products.
- Server tests proving a signed product grants only its encoded capacity and that client-submitted capacity cannot override Apple data.
- Database tests for atomic acceptance at limits 10/15/20/25/30/35/40/45/50, concurrent last-seat requests, pending requests, and downgrade over-capacity behavior.
- StoreKit tests for each tier's displayed price, purchase, upgrade/downgrade, restore, offer redemption, renewal, expiration, refund, and revocation.
- Admin tests showing 30 distinct product/discount campaign records, preventing duplicate mappings and making internal status/reference semantics explicit.
- End-to-end sandbox tests for one valid code per offer type, expired/ineligible code, wrong product, wrong account, App Store Server API failure, and post-offer renewal at standard price.

## Alternatives considered

1. **Capacity tiers in one subscription group (selected):** one monthly charge, straightforward customer-facing price, natural Apple upgrade/downgrade handling; requires nine coach products and per-product offers.
2. **One separate add-on subscription per block:** fewer capacity tiers, but multiple monthly charges and multiple subscriptions to manage/cancel; rejected as harder to understand.
3. **Keep only the ten-seat subscription:** simplest but fails the agreed per-five-athlete pricing requirement; rejected.

## Scope exclusions

- No web checkout or Stripe seat billing.
- No automatic App Store Connect API creation of subscription products or offers in this implementation; the owner will create/approve them in App Store Connect.
- No more than 50 active athletes per coach until a separate capacity expansion is approved.
- No discount activation based solely on the private panel.
