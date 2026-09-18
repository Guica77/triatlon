create table if not exists public.billing_webhook_events (
  provider text not null check (provider in ('stripe','app_store')),
  event_id text not null,
  event_type text not null,
  processed_at timestamptz not null default now(),
  primary key (provider, event_id)
);
alter table public.billing_webhook_events enable row level security;
revoke all on public.billing_webhook_events from anon, authenticated;
grant all on public.billing_webhook_events to service_role;

alter table public.billing_entitlements add column if not exists provider_customer_reference text;
alter table public.billing_entitlements add column if not exists provider_transaction_reference text;
create index if not exists billing_entitlements_customer_idx on public.billing_entitlements(provider_customer_reference);
create index if not exists billing_entitlements_transaction_idx on public.billing_entitlements(provider_transaction_reference);
