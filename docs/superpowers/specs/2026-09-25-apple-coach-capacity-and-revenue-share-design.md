# Apple coach capacity and coach revenue share

**Date:** 25 September 2026  
**Status:** Design approved in chat; awaiting owner review of this written specification.

## Objective

Make coach capacity pricing grow by five-athlete blocks without a hard-coded business ceiling, and record the agreed 50/50 share of an athlete's Apple subscription proceeds when that athlete has an assigned coach. Apple remains the iPhone payment processor and remits all proceeds to TriWaveX. Coaches can see the balance attributed to them, but this phase does not initiate coach payouts.

## Approved business rules

- Coach plan: €29.99/month for capacity up to 10 active athletes.
- Each additional block of up to five active athletes adds €2.99/month. For `b` extra blocks, capacity is `10 + 5b` and the target Euro storefront price is `€29.99 + €2.99b`.
- Examples: 10 athletes = €29.99; 15 = €32.98; 20 = €35.97; 50 = €53.91; 55 = €56.90; 60 = €59.89. Apple’s displayed price is authoritative in every storefront; do not advertise a target price Apple does not offer without owner approval.
- Capacity is based on accepted active athlete-coach links, not pending applications. The server is authoritative and must prevent concurrent acceptances from exceeding the verified purchased capacity.
- There is no hard-coded or commercial capacity limit in TriWaveX’s data model. “No limit” does not mean Apple can bill an arbitrary amount from one product: iPhone can sell only capacity tiers whose products exist, are configured, and are available in App Store Connect. Add further five-athlete tiers to the Apple catalog as needed; never imply a missing tier can be purchased. Current code only enumerates tiers up to 50, and the higher-capacity products have not been confirmed as configured in App Store Connect.
- An iPhone coach changes capacity through one Apple subscription tier, not separately stacked monthly add-ons. StoreKit displays Apple’s localized price and renewal confirmation. Unknown/unavailable products are not purchasable and do not grant capacity.
- An athlete’s monthly subscription is a separate charge from the coach’s capacity subscription. The coach’s capacity fee is never included in, or deducted from, the athlete revenue share.
- For each successfully paid athlete subscription period, allocate 50% of the net Apple proceeds attributable to that charge to the coach assigned at the beginning of that period; the other 50% belongs to TriWaveX. Coach reassignment during a period affects the next period only. If no coach is assigned at the start of a period, no coach share is accrued for that charge.
- A free trial has no proceeds and creates no share. A discounted paid renewal shares 50% of its actual net proceeds. Refunds, reversals, and chargebacks create linked adjustments; they do not silently leave an unearned amount in a coach balance.
- Apple remits proceeds to TriWaveX’s single registered bank account. No Stripe checkout, Stripe Connect, automatic split, or automatic coach payout is part of this phase. A coach balance remains pending until a future, separately approved payout workflow exists. A payment may only be marked paid by an authorized administrator after an actual external payment has occurred.
- Coaches can see their own pending balance and period-by-period calculation history. They cannot withdraw funds, edit the ledger, or see another coach’s records.

## Apple product catalog and StoreKit

Use one auto-renewable product per coach capacity tier in the existing subscription group, preserving the existing 10-athlete product ID and current role rules. Product IDs must map on the server to exactly one coach role, integer capacity, and verified Apple product. The client must never submit a capacity that overrides this mapping.

Replace the client’s fixed `[10...50]` tier assumption with a catalog-driven list of Apple product IDs and capacities. The catalog only exposes products explicitly provisioned in App Store Connect and enabled by TriWaveX. The app loads those products from StoreKit and shows only valid returned products with `Product.displayPrice`. Adding a tier requires App Store Connect product setup, localized metadata, a verified price, correct subscription level, sandbox validation, and an enabled catalog entry. Do not silently round or change the €2.99 step if Apple lacks the requested Euro price point.

The backend capacity representation is an integer with no product rule limiting it to 50. The product mapping is deliberately separate from capacity enforcement so more Apple tiers can be added without weakening authorization. A capacity decrease does not remove existing athlete links; if the roster exceeds the new tier, preserve links and block new acceptances until the coach upgrades or frees capacity.

Apple documents multiseat auto-renewable subscriptions as not yet available to App Store customers at the time of this design, and StoreKit’s ordinary `quantity(_:)` applies to consumables and non-renewing subscriptions rather than auto-renewable subscriptions. Therefore the first implementation must not assume either feature can deliver arbitrary coach capacity. Re-evaluate the catalog model when Apple makes multiseat purchases generally available and validate that its group-access semantics fit coach-to-athlete capacity before adopting it.

## Athlete revenue-share ledger

### Attribution

When the server validates an athlete’s Apple transaction, it resolves the TriWaveX user from the signed transaction’s app account token when present, or from a securely verified server-side association to the original transaction where Apple’s flow does not provide that token. It then records an immutable billing-period attribution snapshot:

- original Apple transaction and renewal-period identifiers;
- athlete account and verified athlete product;
- coach ID assigned at the beginning of that paid period, or no coach;
- StoreKit transaction price, currency, storefront, offer, and period dates when available;
- idempotency key and processing/reconciliation state.

The app cannot write the coach attribution, share percentage, Apple net proceeds, or ledger status. A renewal creates a new attribution snapshot using the coach assignment at that renewal period’s start; it does not rewrite a previous period.

### Net proceeds and reconciliation

Apple’s proceeds are customer price less applicable taxes and Apple commission, with final payments also affected by territory, exchange rates, and adjustments. Apple’s proceeds reporting is finalized by fiscal month and may be paid up to 45 days after that month ends. The exact incoming Apple net amount is not split between TriWaveX and coaches by Apple.

Store signed transactions and App Store Server Notifications establish verified paid events and period attribution. Reconcile them against Apple’s final financial reports. Where a report only gives an aggregate net for a product/storefront/reporting period, allocate that finalized net proportionally across the matching successful transactions using their customer-price weights; retain the source report, cohort, method, and arithmetic for audit. If a report cannot be matched reliably to a cohort, keep the amount unreconciled and do not guess or mark it payable. Apply the 50/50 split only after the net pool has been reconciled. The total attributed coach shares must never exceed 50% of the matched net proceeds.

Ledger records are append-only: reconciliation creates finalized earnings, and a refund or correction creates a compensating adjustment linked to the original entry. Reprocessing the same Apple event or report is idempotent. A coach-facing total distinguishes “pendiente de conciliación de Apple” from “neto conciliado pendiente de liquidación”; neither label implies money has already been sent to the coach.

### Visibility and operations

Provide a coach-only earnings view with:

- pending amount awaiting Apple’s final report;
- reconciled amount pending future settlement;
- period-by-period entries showing the associated athlete subscription period, attribution coach, the basis used for the net calculation, and adjustments;
- a clear explanation that Apple pays TriWaveX first and this version does not provide withdrawals or a payout date.

Only an authorized administrator can inspect the full ledger and record a real, manual payment later. That action requires a payment date and reference and creates an audit event; it cannot alter the original Apple earning. A future automated payout provider or bank-payment integration requires a separate design and approval.

## Security and privacy

- Verify Apple signed transactions and notification signatures on the server; fail closed on unknown product IDs, mismatched account tokens, invalid signatures, or unsupported roles.
- Keep Apple API credentials server-side only. Never expose service-role credentials or Apple private keys in the app or browser.
- Apply row-level security to ledger tables. Coaches can read only ledger rows attributed to their own coach ID; athletes cannot read coach earnings; administrator access is narrowly authorized. Client roles cannot insert, update, or delete earnings, reconciliation, or payout records.
- Store only the data necessary to verify, reconcile, display, and audit the share. Do not expose another athlete’s identity or payment details in coach earnings history.
- Reassignment, cancellation, refund, appeal, and support records must preserve historical attribution and the original Apple transaction link.

## Store presentation and discounts

Before a coach confirms an upgrade, show the selected capacity, Apple’s exact localized monthly price, what is included, and any renewal timing provided by Apple. If the required Apple product is unavailable, explain that the tier is not currently purchasable rather than displaying a calculated but unconfigured price.

Discount offers apply only to Apple products with offers explicitly configured in App Store Connect. Adding a capacity product does not automatically create offer codes or make existing internal campaign rows redeemable for it. Keep campaign administration distinct from Apple’s actual offer availability.

The athlete-facing store does not disclose the internal 50/50 accounting split. It describes only the athlete’s own price, renewal, and service.

## Failure behavior

- Apple product lookup failure: keep current entitlement and show a recoverable store error; do not fabricate prices or capacity.
- Unavailable next tier: explain that it is not yet configured; do not unlock additional seats based on a local selection.
- Apple verification or reconciliation failure: retain existing verified access, mark the accounting item unreconciled, and avoid claiming that a coach share is finalized.
- Downgrade below current roster: preserve active links and block additional accepts; show the required capacity and available upgrade paths.
- Refund/chargeback: write an idempotent negative adjustment against the correct coach/period. If already externally paid in a later approved workflow, record recovery as a separate balance adjustment, never by mutating the historic payment.
- Duplicate or out-of-order notifications and reports: process idempotently and retain source IDs for support audit.

## Validation plan

- Formula tests for 10, 15, 20, 50, 55, and 60 seats and a high tier beyond 50; reject invalid/non-five-block catalog capacities and integer overflow.
- Catalog tests proving only enabled, StoreKit-returned product IDs appear and server-side product mapping—not client input—grants capacity.
- Database tests for atomic acceptance at each configured tier, concurrent final-seat acceptance, pending applications not consuming a slot, downgrade over-capacity behavior, and no roster eviction.
- Revenue attribution tests: active coach at period start, reassignment mid-period, no coach, free trial, paid discount, canceled renewal, refund, chargeback, duplicate notification, and unknown transaction.
- Reconciliation tests for Apple report cohorts by fiscal month/product/storefront, proportional allocation, rounding residual handling, FX/tax/commission adjustments, idempotent imports, and a report mismatch that remains pending rather than guessing.
- RLS tests ensuring a coach sees only their own ledger and cannot write amounts or statuses; a different coach and an athlete cannot inspect earnings.
- StoreKit Sandbox tests for configured coach tiers, price display, upgrade/downgrade, restore, expiry, refund/revocation, and matching server entitlements.
- End-to-end test that Apple’s net is reconciled to TriWaveX, coach balance is displayed as pending (not paid), and no automatic transfer is emitted.

## Scope and prerequisites

Included: product catalog/data model, unbounded server capacity model, Apple-backed capacity mapping, verified transaction attribution, append-only revenue-share ledger, coach-only pending-balance/history view, and reconciliation tooling/statuses needed to avoid claiming false payouts.

Not included: Stripe checkout or Connect, automatic coach payouts, collection of coach banking details, creating products/offers in App Store Connect, tax/legal advice, web checkout changes, or claiming that unlimited Apple seat purchases are available before Apple provides a compatible supported capability. Before commercial release, the owner must configure/submit the necessary Apple products and confirm the legal, tax, and contractual treatment of coach-earned balances. Review the precise App Store payment classification of the service before submission; Apple’s person-to-person exception is specifically for real-time one-to-one services, not every digital subscription.

## Relevant current repository state

- `ios/TriWaveX/SubscriptionStore.swift` currently loads athlete plus coach products through the 50-athlete tier and derives capacity from the product ID.
- `docs/superpowers/specs/2026-09-23-apple-coach-capacity-and-offers-design.md` encodes a maximum of 50 and assumes products/offers per capacity tier. This design supersedes its 50-seat cap and needs a follow-up update during implementation; existing discount campaigns remain limited to configured Apple products.
- At design time, App Store Connect had the base athlete and coach subscriptions in “Prepare for Submission”; higher coach-capacity products were absent. No Apple product or payment configuration is changed by this specification.

## Primary platform references

- Apple, [Manage purchase options for an auto-renewable subscription](https://developer.apple.com/help/app-store-connect/manage-subscriptions/manage-purchase-options-for-auto-renewable-subscriptions/).
- Apple, [StoreKit `quantity(_:)`](https://developer.apple.com/documentation/storekit/product/purchaseoption/quantity%28_%3A%29).
- Apple, [Overview of receiving payments](https://developer.apple.com/help/app-store-connect/getting-paid/overview-of-receiving-payments/).
- Apple, [View payments and proceeds](https://developer.apple.com/help/app-store-connect/getting-paid/view-payments-and-proceeds).
- Apple, [App Review Guidelines, section 3.1.3(d)](https://developer.apple.com/app-store/review/guidelines/uk/).
