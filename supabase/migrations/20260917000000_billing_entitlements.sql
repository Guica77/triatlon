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
drop policy if exists "users read own billing entitlement" on public.billing_entitlements;
create policy "users read own billing entitlement" on public.billing_entitlements for select to authenticated using ((select auth.uid()) = user_id);
