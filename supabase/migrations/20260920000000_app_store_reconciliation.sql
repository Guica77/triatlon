-- Apple billing is reconciled as one database transaction so the entitlement
-- and the profile cannot observe different versions of the same provider event.
create table if not exists public.billing_provider_transactions (
  provider text not null check (provider in ('app_store')),
  transaction_reference text not null,
  original_transaction_reference text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider_signed_date timestamptz not null,
  event_type text not null,
  created_at timestamptz not null default now(),
  primary key (provider, transaction_reference)
);

create index if not exists billing_provider_transactions_original_idx
  on public.billing_provider_transactions(provider, original_transaction_reference);

create index if not exists billing_provider_transactions_user_idx
  on public.billing_provider_transactions(user_id);

alter table public.billing_provider_transactions enable row level security;
revoke all on public.billing_provider_transactions from anon, authenticated;
grant all on public.billing_provider_transactions to service_role;

alter table public.billing_entitlements
  add column if not exists provider_event_type text;

alter table public.billing_entitlements
  add column if not exists provider_grace_period_ends_at timestamptz;

create or replace function public.reconcile_app_store_entitlement(
  p_user_id uuid,
  p_plan text,
  p_status text,
  p_period_ends_at timestamptz,
  p_provider_reference text,
  p_provider_transaction_reference text,
  p_provider_customer_reference text,
  p_provider_signed_date timestamptz,
  p_provider_environment text,
  p_provider_product_id text,
  p_provider_expires_at timestamptz,
  p_provider_revocation_at timestamptz,
  p_provider_grace_period_ends_at timestamptz,
  p_provider_event_type text,
  p_active_plan_id text default null
)
returns table(accepted boolean, duplicate boolean, status text, user_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_entitlement public.billing_entitlements%rowtype;
  known_transaction public.billing_provider_transactions%rowtype;
  current_exists boolean := false;
  conflicting_user uuid;
begin
  if p_plan not in ('athlete', 'coach') then
    raise exception 'invalid_app_store_plan';
  end if;

  if p_status not in ('active', 'past_due', 'cancelled', 'expired') then
    raise exception 'invalid_app_store_status';
  end if;

  if p_user_id is null
    or p_provider_reference is null
    or p_provider_transaction_reference is null
    or p_provider_signed_date is null
    or p_provider_event_type is null then
    raise exception 'incomplete_app_store_event';
  end if;

  select user_id into conflicting_user
  from public.billing_provider_transactions
  where provider = 'app_store'
    and original_transaction_reference = p_provider_reference
    and user_id <> p_user_id
  limit 1;
  if conflicting_user is not null then
    raise exception 'provider_subscription_owned';
  end if;

  select * into known_transaction
  from public.billing_provider_transactions
  where provider = 'app_store'
    and transaction_reference = p_provider_transaction_reference
  for update;

  if found and known_transaction.user_id <> p_user_id then
    raise exception 'provider_transaction_owned';
  end if;

  select * into current_entitlement
  from public.billing_entitlements
  where user_id = p_user_id
  for update;
  current_exists := found;

  if current_exists and current_entitlement.source <> 'app_store'
    and current_entitlement.status in ('active', 'trialing', 'past_due') then
    raise exception 'active_entitlement_conflict';
  end if;

  if current_exists and current_entitlement.provider_reference is not null
    and current_entitlement.provider_reference <> p_provider_reference then
    raise exception 'provider_subscription_owned';
  end if;

  if current_exists and current_entitlement.provider_signed_date is not null
    and current_entitlement.provider_signed_date > p_provider_signed_date then
    insert into public.billing_provider_transactions (
      provider,
      transaction_reference,
      original_transaction_reference,
      user_id,
      provider_signed_date,
      event_type
    ) values (
      'app_store',
      p_provider_transaction_reference,
      p_provider_reference,
      p_user_id,
      p_provider_signed_date,
      p_provider_event_type
    ) on conflict (provider, transaction_reference) do nothing;

    return query select false, false, current_entitlement.status, p_user_id;
    return;
  end if;

  if current_exists and current_entitlement.provider_signed_date = p_provider_signed_date
    and current_entitlement.provider_transaction_reference = p_provider_transaction_reference
    and current_entitlement.provider_event_type = p_provider_event_type then
    return query select true, true, current_entitlement.status, p_user_id;
    return;
  end if;

  if current_exists and current_entitlement.provider_signed_date = p_provider_signed_date then
    return query select false, false, current_entitlement.status, p_user_id;
    return;
  end if;

  insert into public.billing_provider_transactions (
    provider,
    transaction_reference,
    original_transaction_reference,
    user_id,
    provider_signed_date,
    event_type
  ) values (
    'app_store',
    p_provider_transaction_reference,
    p_provider_reference,
    p_user_id,
    p_provider_signed_date,
    p_provider_event_type
  ) on conflict (provider, transaction_reference) do nothing;

  if not current_exists then
    insert into public.billing_entitlements (
      user_id,
      plan,
      source,
      status,
      trial_ends_at,
      period_ends_at,
      provider_reference,
      provider_transaction_reference,
      provider_customer_reference,
      provider_signed_date,
      provider_environment,
      provider_product_id,
      provider_expires_at,
      provider_revocation_at,
      provider_event_type,
      provider_grace_period_ends_at,
      updated_at
    ) values (
      p_user_id,
      p_plan,
      'app_store',
      p_status,
      null,
      p_period_ends_at,
      p_provider_reference,
      p_provider_transaction_reference,
      p_provider_customer_reference,
      p_provider_signed_date,
      p_provider_environment,
      p_provider_product_id,
      p_provider_expires_at,
      p_provider_revocation_at,
      p_provider_event_type,
      p_provider_grace_period_ends_at,
      now()
    );
  else
    update public.billing_entitlements
    set plan = p_plan,
        source = 'app_store',
        status = p_status,
        trial_ends_at = null,
        period_ends_at = p_period_ends_at,
        provider_reference = p_provider_reference,
        provider_transaction_reference = p_provider_transaction_reference,
        provider_customer_reference = p_provider_customer_reference,
        provider_signed_date = p_provider_signed_date,
        provider_environment = p_provider_environment,
        provider_product_id = p_provider_product_id,
        provider_expires_at = p_provider_expires_at,
        provider_revocation_at = p_provider_revocation_at,
        provider_event_type = p_provider_event_type,
        provider_grace_period_ends_at = p_provider_grace_period_ends_at,
        updated_at = now()
    where user_id = p_user_id;
  end if;

  update public.profiles
  set subscription_status = p_status,
      active_plan_id = case
        when p_status = 'active' and p_plan = 'athlete' and p_active_plan_id is not null
          then p_active_plan_id
        else active_plan_id
      end
  where id = p_user_id;

  return query select true, false, p_status, p_user_id;
end;
$$;

revoke all on function public.reconcile_app_store_entitlement(
  uuid, text, text, timestamptz, text, text, text, timestamptz, text,
  text, timestamptz, timestamptz, timestamptz, text, text
) from public, anon, authenticated;
grant execute on function public.reconcile_app_store_entitlement(
  uuid, text, text, timestamptz, text, text, text, timestamptz, text,
  text, timestamptz, timestamptz, timestamptz, text, text
) to service_role;
