-- Harden App Store reconciliation without rewriting deployed migrations.
-- Every accepted provider event updates the entitlement and profile in one transaction.
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
set search_path = public, pg_temp
as $$
declare
  current_entitlement public.billing_entitlements%rowtype;
  known_transaction public.billing_provider_transactions%rowtype;
  transaction_exists boolean;
  terminal_event boolean;
  existing_transaction_user uuid;
begin
  if p_user_id is null
    or p_provider_reference is null
    or p_provider_transaction_reference is null
    or p_provider_signed_date is null
    or p_provider_event_type is null
    or p_provider_product_id is null
    or p_provider_environment is null then
    raise exception 'incomplete_app_store_event';
  end if;
  if p_plan not in ('athlete', 'coach') then raise exception 'invalid_app_store_plan'; end if;
  if p_status not in ('active', 'past_due', 'cancelled', 'expired') then raise exception 'invalid_app_store_status'; end if;
  if p_provider_product_id <> (case p_plan
    when 'athlete' then 'com.triwavex.athlete.monthly'
    when 'coach' then 'com.triwavex.coach.monthly'
  end) then raise exception 'app_store_product_plan_mismatch'; end if;
  if p_provider_event_type not in (
    'SUBSCRIBED', 'DID_RENEW', 'DID_FAIL_TO_RENEW', 'GRACE_PERIOD_EXPIRED',
    'EXPIRED', 'REFUND', 'REVOKE', 'REFUND_REVERSED', 'OFFER_REDEEMED',
    'RENEWAL_EXTENSION', 'RENEWAL_EXTENDED'
  ) then raise exception 'unsupported_app_store_event'; end if;

  -- Serialize all events for a subscription, including the first event where no
  -- entitlement row exists yet. This prevents two accounts winning the race.
  perform pg_advisory_xact_lock(hashtextextended('app_store:' || p_provider_reference, 0));

  select user_id into existing_transaction_user
  from public.billing_provider_transactions
  where provider = 'app_store'
    and transaction_reference = p_provider_transaction_reference;
  if existing_transaction_user is not null and existing_transaction_user <> p_user_id then
    raise exception 'provider_transaction_owned';
  end if;

  select * into known_transaction
  from public.billing_provider_transactions
  where provider = 'app_store'
    and transaction_reference = p_provider_transaction_reference
  for update;
  transaction_exists := found;

  select * into current_entitlement
  from public.billing_entitlements
  where user_id = p_user_id
  for update;
  if found and current_entitlement.provider_reference is not null
    and current_entitlement.provider_reference <> p_provider_reference then
    raise exception 'provider_subscription_owned';
  end if;

  if current_entitlement.user_id is not null and current_entitlement.source <> 'app_store'
    and current_entitlement.status in ('active', 'trialing', 'past_due') then
    raise exception 'active_entitlement_conflict';
  end if;

  if transaction_exists then
    if known_transaction.original_transaction_reference <> p_provider_reference then
      raise exception 'provider_transaction_conflict';
    end if;
    if known_transaction.provider_signed_date = p_provider_signed_date
      and known_transaction.event_type = p_provider_event_type then
      return query select true, true, coalesce(current_entitlement.status, p_status), p_user_id;
      return;
    end if;
    if known_transaction.provider_signed_date >= p_provider_signed_date then
      return query select false, false, coalesce(current_entitlement.status, p_status), p_user_id;
      return;
    end if;
  end if;

  if current_entitlement.user_id is not null then
    if current_entitlement.provider_signed_date > p_provider_signed_date then
      insert into public.billing_provider_transactions(
        provider, transaction_reference, original_transaction_reference,
        user_id, provider_signed_date, event_type
      ) values (
        'app_store', p_provider_transaction_reference, p_provider_reference,
        p_user_id, p_provider_signed_date, p_provider_event_type
      ) on conflict (provider, transaction_reference) do nothing;
      return query select false, false, current_entitlement.status, p_user_id;
      return;
    end if;

    if current_entitlement.provider_signed_date = p_provider_signed_date then
      if current_entitlement.provider_transaction_reference = p_provider_transaction_reference
        and current_entitlement.provider_event_type = p_provider_event_type then
        return query select true, true, current_entitlement.status, p_user_id;
      end if;
      return query select false, false, current_entitlement.status, p_user_id;
      return;
    end if;

    terminal_event := current_entitlement.provider_event_type in ('REFUND', 'REVOKE', 'EXPIRED', 'GRACE_PERIOD_EXPIRED');
    if terminal_event and p_provider_event_type in ('SUBSCRIBED', 'DID_RENEW', 'OFFER_REDEEMED', 'RENEWAL_EXTENSION', 'RENEWAL_EXTENDED') then
      return query select false, false, current_entitlement.status, p_user_id;
      return;
    end if;

    if p_provider_event_type = 'REFUND_REVERSED'
      and (p_provider_expires_at is null or p_provider_expires_at <= now()) then
      return query select false, false, current_entitlement.status, p_user_id;
      return;
    end if;
  end if;

  insert into public.billing_provider_transactions(
    provider, transaction_reference, original_transaction_reference,
    user_id, provider_signed_date, event_type
  ) values (
    'app_store', p_provider_transaction_reference, p_provider_reference,
    p_user_id, p_provider_signed_date, p_provider_event_type
  ) on conflict (provider, transaction_reference) do nothing;

  if current_entitlement.user_id is null then
    insert into public.billing_entitlements(
      user_id, plan, source, status, trial_ends_at, period_ends_at,
      provider_reference, provider_transaction_reference, provider_customer_reference,
      provider_signed_date, provider_environment, provider_product_id,
      provider_expires_at, provider_revocation_at, provider_event_type,
      provider_grace_period_ends_at, updated_at
    ) values (
      p_user_id, p_plan, 'app_store', p_status, null, p_period_ends_at,
      p_provider_reference, p_provider_transaction_reference, p_provider_customer_reference,
      p_provider_signed_date, p_provider_environment, p_provider_product_id,
      p_provider_expires_at, p_provider_revocation_at, p_provider_event_type,
      p_provider_grace_period_ends_at, now()
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
    if not found then raise exception 'entitlement_update_cardinality'; end if;
  end if;

  update public.profiles
  set subscription_status = p_status,
      active_plan_id = case
        when p_status = 'active' and p_plan = 'athlete' and p_active_plan_id is not null
          then p_active_plan_id
        when p_status <> 'active' and p_plan = 'athlete'
          then null
        else active_plan_id
      end
  where id = p_user_id;
  if not found then raise exception 'profile_update_cardinality'; end if;

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
