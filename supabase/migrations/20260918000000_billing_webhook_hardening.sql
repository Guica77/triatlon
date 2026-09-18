create table if not exists public.billing_entitlements (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('athlete','coach')),
  source text not null check (source in ('stripe','app_store')),
  status text not null check (status in ('trialing','active','past_due','cancelled','expired')),
  trial_ends_at timestamptz,
  period_ends_at timestamptz,
  provider_reference text unique,
  updated_at timestamptz not null default now()
);
alter table public.billing_entitlements enable row level security;
do $$ begin
  create policy "users read own billing entitlement" on public.billing_entitlements for select to authenticated using ((select auth.uid()) = user_id);
exception when duplicate_object then null;
end $$;

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
