# Apple coach capacity and revenue-share implementation plan

**Design:** [Apple coach capacity and coach revenue share](../specs/2026-09-25-apple-coach-capacity-and-revenue-share-design.md)
**Status:** Plan prepared after approval of the design and its dated-assignment-history amendment. No implementation has started.

## Phase 0 — Preserve local work and verify external facts

### Tasks

1. Inspect the current diffs in `ios/TriWaveX/SubscriptionStore.swift`, `StoreKitTesting.storekit`, and related Xcode files before touching them. Preserve all pre-existing user edits; do not reset, checkout, or stage unrelated files.
2. Re-read the current coach-capacity migration, Apple product mapping/reconciliation helpers, native transaction endpoint, App Store notification endpoint, and every coach connect/disconnect path.
3. Before any Supabase schema or function change, check the current Supabase changelog and current docs for Postgres migrations, RLS, grants, and function security. Check the installed CLI version and discover supported migration commands with `--help`; create migration files with `supabase migration new`.
4. Verify App Store Connect product IDs, availability, subscription levels, and current states. Do not create products, change prices, or alter offers as part of local implementation.
5. Verify Apple’s finalized financial-report fields and available import path. If an Apple report cannot be matched reliably to its product/storefront/offer cohort, define that cohort as unreconciled rather than estimating a coach balance.

### Exit criteria

- A short evidence note records the ASC products that actually exist, current store display prices, and whether financial-report cohort data supports the approved allocation method.
- Existing local edits and baseline test state are known.

## Phase 1 — Remove the fixed 50-seat assumption safely

### Tasks

1. Add a server-owned Apple product catalog mapping each configured product identifier to one role and, for coach products, one capacity. Keep the catalog inaccessible to direct client writes and ensure product IDs are unique.
2. Replace capacity/role regex lists in `lib/apple-event.ts`, `supabase/migrations/20260923122020_coach_capacity_tiers_and_seat_enforcement.sql`, and all entitlement reconciliation paths with lookups against the verified catalog. Unknown IDs fail closed.
3. Make the coach-capacity acceptance function read the server-verified entitlement/catalog capacity, not an app-submitted capacity. Preserve its serialized, atomic last-seat check and no-eviction downgrade behavior.
4. Add an authenticated native catalog endpoint exposing only enabled App Store product IDs and capacities. Return no locally calculated price as purchasable when StoreKit does not return the product.
5. Update `ios/TriWaveX/SubscriptionStore.swift` to load product IDs from the catalog, sort by capacity/Apple price, show only StoreKit-returned products, and use `Product.displayPrice` for localized recurring prices. Remove the fixed 10–50 picker ceiling without implying a missing tier is purchasable.
6. Keep subscription tiers in the existing group and preserve the base 10-athlete product. Confirm Apple product level/upgrade behavior before enabling tier changes.

### Verification

- Formula tests for 10, 15, 20, 50, 55, 60, and a larger capacity; use integer/decimal-safe pricing arithmetic and reject overflow or non-five-seat tier mappings.
- API and SQL tests prove the client cannot forge capacity, an unknown SKU grants no access, disabled products are hidden, and enabled StoreKit products map to exactly one server role/capacity.
- Concurrent acceptance tests prove only one request can claim the last available seat; pending requests do not count; downgrades preserve current athletes and block new accepts until under limit.
- StoreKit tests prove absent product IDs show an honest unavailable state and returned tiers use Apple’s localized display price.

### External gate

The current code expects capacity products through 50, but App Store Connect previously showed only the base athlete and coach products. The owner must create, localize, price, rank, and submit coach-tier products in App Store Connect before those tiers can be tested or sold. Further tiers above 50 are added in Apple as demand requires. This phase does not claim arbitrary-capacity billing through one Apple product; reevaluate Apple multiseat only after general App Store availability and a fit review.

## Phase 2 — Preserve coach assignment history and attribute Apple periods

### Tasks

1. Add a temporal `coach_assignment_history` table with athlete, coach, `valid_from`, and nullable `valid_to`; enforce one valid current assignment per athlete and valid, non-overlapping intervals. Enable RLS and deny client mutation/read unless explicitly needed.
2. Backfill only currently active relationships whose `coach_athletes.created_at` is available. Do not reconstruct deleted historical coaches. Period starts older than provable history remain unreconciled.
3. Route every assignment, reassignment, and disconnection through an atomic database operation that updates the current relationship/profile and opens or closes the corresponding history interval. Audit every writer before relying on this table.
4. Add an immutable `coach_revenue_ledger` plus Apple-report reconciliation records. Store original and renewal transaction references, athlete, period dates, coach snapshot, product/storefront/offer/currency, customer-price weight, reconciled net, 50% share, adjustment links, source report, and state. Use uniqueness/idempotency keys for Apple transactions and imported reports.
5. Extend shared Apple reconciliation so both the native purchase route and Server Notifications V2 record billing periods idempotently. Use the signed transaction period start to query the history interval, even when Apple notifies after the athlete switches coaches. Missing/ambiguous attribution remains pending; never substitute the current coach.
6. Treat free/zero-price trials as zero share, paid offers as 50% of reconciled net, and refunds/revocations as linked negative adjustments. Do not modify historic earning rows.
7. Add a secure owner-only way to import/reconcile finalized Apple financial-report cohorts. Prefer an official, server-side Apple report integration if the needed dimensions are available; otherwise use a reviewed report import. Allocate cohort net by transaction-price weight with deterministic residual handling so allocations sum exactly to the imported net. Keep mismatches unreconciled.
8. Store currency amounts without binary floating point; calculate share at decimal precision and round only when aggregating a coach’s payable balance. Ensure all coach shares in a cohort total no more than 50% of matched net proceeds.

### Security and verification

- Follow the Supabase security checklist: RLS on public tables, no client writes to financial rows, least-privilege API paths, explicit function grants, and no casually exposed `SECURITY DEFINER` function in `public`.
- Test delayed notification after coach reassignment, mid-period switching, disconnect, no coach, old period without history, free trial, paid offer, refund, duplicate/out-of-order event, duplicate report, missing report cohort, and exact rounding reconciliation.
- Verify with local SQL queries that immutable/append-only behavior, uniqueness, interval bounds, and idempotency work; run Supabase advisors and RLS checks before migration promotion.

## Phase 3 — Coach earnings view

### Tasks

1. Add an authenticated native endpoint such as `app/api/native/coach/earnings/route.ts` that returns only the signed-in coach’s pending/reconciled totals and period entries. It must not return another athlete’s identity or payment data.
2. Add a SwiftUI earnings summary/detail to the native coach experience. Clearly distinguish “pendiente de conciliación de Apple” from “neto conciliado pendiente de liquidación.” Explain that Apple pays TriWaveX first and this version has no withdrawals or promised payout date.
3. Make ledger amounts read-only to coaches. In this release there is no bank-detail collection, Stripe Connect, or automatic payment. If an administrator records a real manual payment later, require an audited payment date/reference and append a payment event.
4. Add loading, empty, stale, unreconciled, and recoverable-error states, plus Dynamic Type and VoiceOver labels.

### Verification

- Endpoint tests for unauthenticated, athlete role, own coach, another coach, admin, and unavailable ledger cases.
- RLS tests demonstrate a coach can read only their own ledger rows and cannot write amounts, coach attribution, or status.
- SwiftUI tests/manual checks show pending versus reconciled amounts accurately and never label accrued earnings “paid.”

## Phase 4 — End-to-end release gate

### Tasks

1. Run targeted unit/API/database tests, then the full web suite, lint, TypeScript, iOS Release build, and available XCTest suite.
2. In StoreKit Sandbox/TestFlight, exercise purchase, capacity change, restore, renewal, expiry, refund/revocation, offer redemption, delayed notification, and final report reconciliation. Test on a physical iPhone when signing/device access is available.
3. Verify Apple product configuration, financial-report access, server-notification environment, and that coach-tier products are approved and available. Verify no product outside Apple’s returned catalog is sold.
4. Confirm legal/tax/accounting review for coach-earned balances and the app’s precise App Review payment classification before launch. The one-to-one real-time fitness-service exception must not be assumed to cover general app features or asynchronous coaching.
5. Report local pass/fail evidence and external blockers separately. Do not claim unlimited iPhone purchases, finalized coach earnings, or TestFlight readiness unless their respective external checks pass.

## Rollout order and stopping rules

Implement in phase order: catalog and capacity authority first; dated relationship history and ledger second; coach display third; then external Apple reconciliation and Sandbox validation. Keep access to the current verified entitlement when a report is delayed. Keep uncertain revenue unassigned/unreconciled rather than using the athlete’s current coach. Never remove active athletes after a downgrade. Preserve existing uncommitted source changes and commit only specifically requested implementation files; no push or App Store Connect mutation is implied by this plan.
