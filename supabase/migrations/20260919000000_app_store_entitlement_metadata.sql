alter table public.billing_entitlements add column if not exists provider_signed_date timestamptz;
alter table public.billing_entitlements add column if not exists provider_environment text;
alter table public.billing_entitlements add column if not exists provider_product_id text;
alter table public.billing_entitlements add column if not exists provider_expires_at timestamptz;
alter table public.billing_entitlements add column if not exists provider_revocation_at timestamptz;

create index if not exists billing_entitlements_product_idx
  on public.billing_entitlements(provider_product_id);
