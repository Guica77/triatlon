# Live Owner Operations Dashboard

Date: 2026-09-02
Status: approved for implementation

## Goal

Turn the existing `/admin` business page into a private, live owner operations portal. It must show trustworthy business and product health, capture real operating costs, centralize product feedback, expose integration capacity, and provide a safe document-ingestion workflow for the athlete AI RAG.

The portal must never present an estimate as an observed fact. Every metric is labelled as real, calculated, manually supplied, or unavailable.

## Information architecture

The selected design is **A: Operations center**. A persistent owner-only sidebar provides these sections:

1. **Overview** — essential KPIs, trends, live status, and actionable alerts.
2. **Business** — acquisition, activation, DAU/WAU/MAU, subscriptions, revenue, churn, retention, and coach utilization.
3. **Costs** — monthly costs by category and provider, margin, burn, and cost per active user.
4. **Feedback** — product feedback and coach suggestions as a unified operational inbox.
5. **AI Knowledge** — upload, process, inspect, test, activate, and deactivate RAG documents.
6. **Integrations** — Strava occupancy plus the health and last successful activity of supported external services.

The overview stays concise. Detailed tables and controls live in their corresponding section so the home view remains useful as the product grows.

## Data truth and metric definitions

### Users and engagement

- Total users comes from `profiles`.
- New users is based on `profiles.created_at`.
- DAU, WAU, and MAU count distinct users with a qualifying product activity in the respective 1-, 7-, and 30-day windows.
- Initially, completed or created workouts and submitted feedback are qualifying events. A small `product_events` table records future sign-in and key-feature events without storing message bodies or sensitive workout data.
- Activation means completing onboarding and creating or receiving a first training plan.
- Coach utilization uses active `coach_athletes` relationships.

### Revenue, subscriptions, and churn

The current profile status cannot reconstruct historical churn. Add a subscription ledger with plan, amount, currency, status, start, renewal, cancellation, and source fields. It supports manual entries now and a future Stripe sync without changing dashboard contracts.

- MRR is the normalized monthly value of active paid subscriptions.
- ARR is `MRR * 12`.
- Conversion is paid active users divided by eligible users.
- Logo churn for a month is cancellations during that month divided by paid subscriptions active at its start.
- Revenue churn uses lost normalized MRR divided by opening MRR.
- Retention cohorts use observed product activity after signup; immature cohort cells display `—` rather than zero.
- LTV is shown only when enough observed churn history exists. CAC is shown only when acquisition costs and attributed new customers exist.

Existing simulated churn, the fixed €12.99 assumption, estimated €500 marketing spend, and fabricated silent-churn multiplier are removed. If historical events do not exist, the UI explicitly says that tracking starts from the migration date.

### Costs and profitability

Add owner-managed monthly cost entries with month, provider, category, amount, currency, recurrence, notes, and source. Initial categories are infrastructure, AI, marketing, operations, software, and other. The UI supports create, edit, and delete with confirmation.

- Total cost is the sum for the selected month.
- Gross operating margin is observed revenue minus recorded costs.
- Cost per MAU is monthly costs divided by MAU.
- AI and infrastructure costs are broken out independently.

Manual values carry a visible `Manual` badge. Provider API synchronization is deferred, but the source model supports `manual`, `stripe`, `vercel`, `supabase`, and `ai_provider`.

## Live behavior

A small client boundary subscribes to relevant Supabase Realtime table changes. Events are debounced and trigger a server refresh so calculations remain server-side and secrets never reach the browser. A 60-second fallback refresh handles missed events, reconnection, or providers that cannot emit database events.

The header shows `Live`, `Reconnecting`, or `Updated N seconds ago`. Filters and draft forms are client state and survive metric refreshes. Realtime subscriptions are scoped to the owner portal and are disposed on navigation.

## Feedback center

The unified inbox contains:

- `app_feedback`: rating, comment, user, usage milestone, and submission time.
- `coach_feedback`: type, message, coach, optional athlete reference, status, and submission time.

Add operational fields where missing: status (`new`, `reviewing`, `planned`, `resolved`, `archived`), priority (`low`, `normal`, `high`, `urgent`), owner notes, assignee, and update time. The inbox supports search, source/status/priority filters, detail view, and status changes.

Workout feedback is not copied into this inbox. Only aggregate RPE, pain, feeling, and adherence trends appear in business/product-health views.

Product feedback may be summarized for the owner, but it never enters shared athlete knowledge. Workout feedback stays private to the corresponding athlete and is already eligible for that athlete's AI context.

## RAG document ingestion

The AI Knowledge section accepts `.txt`, `.md`, `.pdf`, and `.docx` files up to 10 MB, plus direct pasted text. The owner supplies title, category, sport type, and source. Allowed sport types are running, cycling, swimming, triathlon, strength, recovery, nutrition, or general.

Server-side ingestion performs:

1. Validate owner authorization, type, and size.
2. Store the original in a private `rag-documents` bucket for audit and reprocessing.
3. Extract text and normalize whitespace.
4. Reject empty or unusable documents.
5. Split text at paragraph boundaries into chunks of 800–1,600 characters, targeting 1,200 characters and carrying the final 200 characters into the next chunk. No chunk may exceed the existing 4,000-character database constraint.
6. Generate a 768-dimensional Gemini embedding for each chunk with bounded concurrency and retries.
7. Persist the document and chunks as inactive while processing.
8. Activate the document and its chunks only after all chunks succeed.

Processing status is `queued`, `processing`, `ready`, or `failed`, with progress and a sanitized error message. A failed upload never becomes searchable. Retrying replaces the failed processing result without duplicating active chunks.

The section lists documents, source, sport, chunk count, status, and update date. The owner can inspect chunks, deactivate/reactivate a ready document, reprocess it, or delete it with confirmation. Deleting a document also removes its private original and chunks.

### RAG test console

An owner-only test box accepts a question and optional sport filter. It embeds the question, calls `match_ai_knowledge_chunks`, and displays the top retrieved chunks with similarity, document title, and source. It does not generate an athlete-facing answer and never includes private athlete memories.

## Integrations

The first integration card is Strava:

- connected athletes recorded by the application;
- configured capacity, initially supplied as an owner setting with value 10;
- occupancy percentage and remaining places;
- warning at 70%, critical at 90%, full at 100%;
- last successful synchronization and recent integration errors available from sanitized operational events.

Strava does not provide the developer athlete-capacity value through the normal athlete API, so capacity is a manual owner setting until an authoritative provider endpoint exists. The UI states this clearly.

Additional cards show Supabase, Gemini/Anthropic, email, and push-notification configuration and recent health. They expose presence/status only, never secret values.

## Architecture and security

- Server Components load metric snapshots and detailed lists.
- Focused Server Actions handle cost, feedback, integration-setting, and knowledge-document mutations.
- A route handler accepts multipart document uploads and runs extraction/embedding on the server.
- Shared metric functions are pure and independently tested.
- Service-role credentials remain server-only.
- All owner tables use RLS based on `profiles.role = 'owner'`.
- The existing email-substring admin promotion is removed. Access requires an existing owner role and no request may silently promote a user.
- File names are sanitized, MIME type and actual parser compatibility are validated, and user-supplied text is treated as data rather than instructions.
- Feedback summaries and RAG documents remain separate data domains.

## Error and empty states

- A section failure does not take down the entire portal; it displays a local retry state.
- Empty historical metrics explain when collection began.
- Live disconnection retains the last valid snapshot and shows a stale-data warning.
- Cost mutations use optimistic feedback only after server validation.
- Upload errors identify file, size, extraction, or embedding failure without leaking provider responses or secrets.
- Long ingestion jobs show progress and may safely resume or retry.

## Testing and verification

- Unit tests cover churn, MRR, cohort maturity, cost, margin, and integration-capacity calculations.
- Authorization tests ensure non-owners cannot read or mutate owner data or upload documents.
- Ingestion tests cover supported formats, invalid/oversized files, chunk boundaries, partial embedding failure, retry, and activation atomicity.
- Feedback tests cover unified mapping, filters, and state transitions.
- Realtime tests verify debounce, reconnect state, and cleanup.
- RAG retrieval tests confirm uploaded knowledge can be found and that one athlete's private feedback is never returned for another athlete.
- Existing tests, TypeScript, lint, and production build must pass before merge.
- A production-like manual pass verifies desktop/mobile layout, keyboard access, upload progress, empty/error states, and live refresh.

## Delivery sequence

1. Secure owner access and create the metric/event, cost, feedback-operation, integration-setting, and ingestion schema.
2. Replace simulated metrics with observed calculations and build the shared portal shell.
3. Add live refresh and overview/business views.
4. Add cost management and profitability.
5. Add the unified feedback inbox and aggregate workout-feedback health.
6. Add document upload, processing, management, and RAG retrieval testing.
7. Add integration capacity/health cards, verify end to end, and deploy.

## Explicitly deferred

- Automatic billing/provider invoice imports.
- Predictive churn scoring.
- Automatic publication of product feedback into shared RAG knowledge.
- Background processing infrastructure beyond the bounded document sizes defined here.
- Capacity increases or account changes in third-party developer portals.
