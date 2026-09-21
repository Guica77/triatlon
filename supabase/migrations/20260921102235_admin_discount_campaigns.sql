create table public.admin_discount_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  code text not null unique check (code ~ '^[A-Z0-9-]{4,32}$'),
  membership text not null check (membership in ('athlete', 'coach')),
  discount_percent smallint not null check (discount_percent in (0, 25, 50, 100)),
  max_redemptions integer not null check (max_redemptions between 1 and 100000),
  redemption_count integer not null default 0 check (redemption_count >= 0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'expired')),
  app_store_offer_reference text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or ends_at > starts_at),
  check (redemption_count <= max_redemptions)
);

create index admin_discount_campaigns_status_idx
  on public.admin_discount_campaigns (status, starts_at desc);

alter table public.admin_discount_campaigns enable row level security;

-- This table is only read and written through server-side admin actions using
-- the service-role client after the immutable ADMIN_USER_IDS check.
revoke all on table public.admin_discount_campaigns from anon, authenticated;
