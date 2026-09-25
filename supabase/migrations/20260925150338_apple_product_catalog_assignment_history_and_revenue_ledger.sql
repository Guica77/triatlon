-- Server-owned Apple SKU catalog. Only enabled products can grant access.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table private.apple_subscription_products (
  product_id text primary key,
  plan text not null check (plan in ('athlete', 'coach')),
  coach_capacity integer,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  check ((plan = 'athlete' and coach_capacity is null) or
         (plan = 'coach' and coach_capacity >= 10 and (coach_capacity - 10) % 5 = 0)),
  check ((plan = 'coach') = (coach_capacity is not null)),
  check ((plan = 'athlete' and product_id = 'com.triwavex.athlete.monthly') or
         (plan = 'coach' and ((coach_capacity = 10 and product_id = 'com.triwavex.coach.monthly') or
          (coach_capacity > 10 and product_id = 'com.triwavex.coach.monthly.' || coach_capacity::text))))
);
alter table private.apple_subscription_products enable row level security;
revoke all on private.apple_subscription_products from public, anon, authenticated;
grant select, insert, update, delete on private.apple_subscription_products to service_role;

insert into private.apple_subscription_products(product_id, plan, coach_capacity, enabled)
values ('com.triwavex.athlete.monthly', 'athlete', null, true),
       ('com.triwavex.coach.monthly', 'coach', 10, true)
on conflict (product_id) do update
set plan = excluded.plan, coach_capacity = excluded.coach_capacity, enabled = excluded.enabled;

create or replace function public.get_native_apple_product_catalog()
returns table(product_id text, plan text, coach_capacity integer)
language sql security definer set search_path = ''
as $$
  select p.product_id, p.plan, p.coach_capacity
  from private.apple_subscription_products p
  where p.enabled
  order by p.plan, p.coach_capacity nulls first, p.product_id;
$$;
revoke all on function public.get_native_apple_product_catalog() from public, anon, authenticated;
grant execute on function public.get_native_apple_product_catalog() to service_role;

-- The owner enables a tier only after creating/configuring its matching SKU in
-- App Store Connect. StoreKit must still return the SKU before the app displays it.
create or replace function public.configure_native_apple_coach_product(
  p_capacity integer,
  p_enabled boolean
)
returns text language plpgsql security definer set search_path = '' as $$
declare configured_product_id text;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required' using errcode = '42501'; end if;
  if p_capacity is null or p_capacity < 15 or (p_capacity - 10) % 5 <> 0 then
    raise exception 'invalid_coach_capacity';
  end if;
  insert into private.apple_subscription_products(product_id, plan, coach_capacity, enabled)
  values ('com.triwavex.coach.monthly.' || p_capacity::text, 'coach', p_capacity, p_enabled)
  on conflict (product_id) do update set enabled = excluded.enabled
    where private.apple_subscription_products.plan = 'coach'
      and private.apple_subscription_products.coach_capacity = excluded.coach_capacity
  returning product_id into configured_product_id;
  if configured_product_id is null then raise exception 'apple_product_catalog_conflict'; end if;
  return configured_product_id;
end;
$$;
revoke all on function public.configure_native_apple_coach_product(integer,boolean) from public, anon, authenticated;
grant execute on function public.configure_native_apple_coach_product(integer,boolean) to service_role;

-- Timestamps are intervals, so delayed Apple notifications use the coach assigned
-- at the start of the paid period, not whichever coach is assigned today.
create table private.coach_assignment_tracking (
  athlete_id uuid primary key,
  tracked_from timestamptz not null
);
create table private.coach_assignment_history (
  id bigint generated always as identity primary key,
  athlete_id uuid not null,
  coach_id uuid not null,
  valid_from timestamptz not null,
  valid_to timestamptz,
  source text not null check (source in ('relationship_created_at', 'migration_snapshot', 'profile_change')),
  created_at timestamptz not null default now(),
  check (valid_to is null or valid_to > valid_from)
);
create unique index coach_assignment_one_open_period_per_athlete_idx
  on private.coach_assignment_history(athlete_id) where valid_to is null;
create index coach_assignment_period_lookup_idx
  on private.coach_assignment_history(athlete_id, valid_from, valid_to);
alter table private.coach_assignment_tracking enable row level security;
alter table private.coach_assignment_history enable row level security;
revoke all on private.coach_assignment_tracking, private.coach_assignment_history from public, anon, authenticated;
grant select, insert, update, delete on private.coach_assignment_tracking, private.coach_assignment_history to service_role;
grant usage, select on sequence private.coach_assignment_history_id_seq to service_role;

create or replace function private.protect_coach_assignment_interval()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('coach-history:' || new.athlete_id::text, 0));
  if exists (
    select 1 from private.coach_assignment_history h
    where h.athlete_id = new.athlete_id and h.id <> coalesce(new.id, 0)
      and pg_catalog.tstzrange(h.valid_from, coalesce(h.valid_to, 'infinity'::timestamptz), '[)')
        && pg_catalog.tstzrange(new.valid_from, coalesce(new.valid_to, 'infinity'::timestamptz), '[)')
  ) then raise exception 'coach_assignment_period_overlap'; end if;
  return new;
end;
$$;
revoke all on function private.protect_coach_assignment_interval() from public, anon, authenticated;
create trigger protect_coach_assignment_intervals
before insert or update on private.coach_assignment_history
for each row execute function private.protect_coach_assignment_interval();

-- Backfill only relationships with a unique active link that agrees with profiles.
insert into private.coach_assignment_tracking(athlete_id, tracked_from)
select p.id, min(ca.created_at)
from public.profiles p
join public.coach_athletes ca on ca.athlete_id = p.id and ca.status = 'active' and ca.coach_id = p.coach_id
where p.role = 'athlete' and p.coach_id is not null
  and (select count(*) from public.coach_athletes x where x.athlete_id = p.id and x.status = 'active') = 1
group by p.id
on conflict (athlete_id) do nothing;
insert into private.coach_assignment_tracking(athlete_id, tracked_from)
select p.id, now() from public.profiles p where p.role = 'athlete'
on conflict (athlete_id) do nothing;
insert into private.coach_assignment_history(athlete_id, coach_id, valid_from, source)
select p.id, p.coach_id, t.tracked_from,
       case when exists (select 1 from public.coach_athletes ca where ca.athlete_id = p.id and ca.coach_id = p.coach_id and ca.status = 'active')
            then 'relationship_created_at' else 'migration_snapshot' end
from public.profiles p join private.coach_assignment_tracking t on t.athlete_id = p.id
where p.role = 'athlete' and p.coach_id is not null
  and (select count(*) from public.coach_athletes x where x.athlete_id = p.id and x.coach_id = p.coach_id and x.status = 'active') = 1
  and (select count(*) from public.coach_athletes x where x.athlete_id = p.id and x.status = 'active') = 1
on conflict do nothing;

create or replace function private.track_athlete_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.role = 'athlete' then
    insert into private.coach_assignment_tracking(athlete_id, tracked_from)
    values (new.id, pg_catalog.now()) on conflict (athlete_id) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function private.track_athlete_profile() from public, anon, authenticated;
drop trigger if exists track_athlete_profile_for_coach_history on public.profiles;
create trigger track_athlete_profile_for_coach_history after insert on public.profiles
for each row execute function private.track_athlete_profile();

create or replace function private.record_coach_assignment_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  changed_at timestamptz := pg_catalog.clock_timestamp();
  current_history_coach uuid;
begin
  if new.role <> 'athlete' or old.coach_id is not distinct from new.coach_id then return new; end if;
  select coach_id into current_history_coach from private.coach_assignment_history
  where athlete_id = new.id and valid_to is null;
  if current_history_coach is not distinct from new.coach_id then return new; end if;
  insert into private.coach_assignment_tracking(athlete_id, tracked_from)
  values (new.id, changed_at) on conflict (athlete_id) do nothing;
  update private.coach_assignment_history set valid_to = changed_at
  where athlete_id = new.id and valid_to is null;
  if new.coach_id is not null then
    insert into private.coach_assignment_history(athlete_id, coach_id, valid_from, source)
    values (new.id, new.coach_id, changed_at, 'profile_change');
  end if;
  return new;
end;
$$;
revoke all on function private.record_coach_assignment_change() from public, anon, authenticated;
drop trigger if exists record_coach_assignment_history on public.profiles;
create trigger record_coach_assignment_history after update of coach_id on public.profiles
for each row execute function private.record_coach_assignment_change();

-- Also observe direct server-side relationship changes (including a reactivated
-- existing link). Profile changes remain a fallback for legacy assignment writers.
create or replace function private.record_coach_relationship_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  target_athlete uuid;
  target_coach uuid;
  was_active boolean := false;
  is_active boolean := false;
  changed_at timestamptz := pg_catalog.clock_timestamp();
begin
  if tg_op <> 'INSERT' then
    target_athlete := old.athlete_id;
    target_coach := old.coach_id;
    was_active := old.status = 'active';
  end if;
  if tg_op <> 'DELETE' then
    target_athlete := new.athlete_id;
    target_coach := new.coach_id;
    is_active := new.status = 'active';
  end if;
  if tg_op = 'UPDATE' and (old.athlete_id is distinct from new.athlete_id or old.coach_id is distinct from new.coach_id) then
    if was_active then
      update private.coach_assignment_history set valid_to = changed_at
      where athlete_id = old.athlete_id and coach_id = old.coach_id and valid_to is null;
    end if;
    was_active := false;
  end if;
  if was_active and not is_active then
    update private.coach_assignment_history set valid_to = changed_at
    where athlete_id = target_athlete and coach_id = target_coach and valid_to is null;
  elsif is_active and not was_active then
    insert into private.coach_assignment_tracking(athlete_id, tracked_from)
    values (target_athlete, changed_at) on conflict (athlete_id) do nothing;
    if not exists (select 1 from private.coach_assignment_history h
      where h.athlete_id = target_athlete and h.coach_id = target_coach and h.valid_to is null) then
      update private.coach_assignment_history set valid_to = changed_at
      where athlete_id = target_athlete and valid_to is null;
      insert into private.coach_assignment_history(athlete_id, coach_id, valid_from, source)
      values (target_athlete, target_coach, changed_at, 'profile_change');
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.record_coach_relationship_change() from public, anon, authenticated;
drop trigger if exists record_coach_relationship_history on public.coach_athletes;
create trigger record_coach_relationship_history after insert or update or delete on public.coach_athletes
for each row execute function private.record_coach_relationship_change();

-- Keep signed customer price as a matching weight only: Apple reports the final
-- net proceeds separately, by fiscal period and reporting cohort.
create table private.apple_subscription_periods (
  transaction_id text primary key,
  original_transaction_id text not null,
  athlete_id uuid not null,
  product_id text not null references private.apple_subscription_products(product_id),
  period_started_at timestamptz not null,
  period_ends_at timestamptz,
  customer_price_milli bigint,
  customer_currency text,
  storefront text,
  offer_type integer,
  coach_id_at_period_start uuid,
  attribution_status text not null check (attribution_status in ('awaiting_apple_report', 'no_coach', 'no_proceeds', 'history_gap', 'ambiguous')),
  event_type text not null,
  created_at timestamptz not null default now(),
  check (customer_price_milli is null or customer_price_milli >= 0),
  check (customer_currency is null or customer_currency ~ '^[A-Z]{3}$'),
  check (period_ends_at is null or period_ends_at > period_started_at)
);
create index apple_subscription_period_identity_idx
  on private.apple_subscription_periods(original_transaction_id, period_started_at);
create index apple_subscription_period_coach_status_idx
  on private.apple_subscription_periods(coach_id_at_period_start, attribution_status, period_started_at desc);

create table private.apple_financial_report_imports (
  id uuid primary key default gen_random_uuid(),
  report_reference text not null,
  fiscal_period text not null check (fiscal_period ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  entry_type text not null check (entry_type in ('sale', 'return')),
  transaction_date date not null,
  product_id text not null,
  storefront text not null,
  customer_currency text not null check (customer_currency ~ '^[A-Z]{3}$'),
  customer_price_milli bigint not null check (customer_price_milli > 0),
  report_units integer not null check (report_units > 0),
  proceeds_currency text not null check (proceeds_currency ~ '^[A-Z]{3}$'),
  finalized_proceeds numeric(20, 4) not null,
  report_sha256 text not null check (report_sha256 ~ '^[0-9a-f]{64}$'),
  imported_by uuid not null,
  imported_at timestamptz not null default now(),
  check ((entry_type = 'sale' and finalized_proceeds >= 0) or (entry_type = 'return' and finalized_proceeds <= 0)),
  unique (report_reference, entry_type, transaction_date, product_id, storefront, customer_currency, customer_price_milli)
);
create table private.coach_revenue_ledger (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references private.apple_financial_report_imports(id),
  transaction_id text not null references private.apple_subscription_periods(transaction_id),
  coach_id uuid not null,
  allocated_net_proceeds numeric(20, 8) not null,
  share_amount numeric(20, 8) not null,
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  adjustment_event_id text,
  created_at timestamptz not null default now(),
  unique (report_id, transaction_id, adjustment_event_id)
);
create unique index coach_revenue_ledger_sale_transaction_idx
  on private.coach_revenue_ledger(transaction_id) where adjustment_event_id is null;
create index coach_revenue_ledger_coach_created_idx
  on private.coach_revenue_ledger(coach_id, created_at desc);
create table private.apple_subscription_adjustments (
  event_id text primary key,
  transaction_id text not null references private.apple_subscription_periods(transaction_id),
  event_type text not null check (event_type in ('REFUND', 'REVOKE', 'REFUND_REVERSED')),
  event_signed_at timestamptz not null,
  revocation_percentage_milli integer check (revocation_percentage_milli between 0 and 100000),
  created_at timestamptz not null default now()
);
alter table private.coach_revenue_ledger
  add constraint coach_revenue_ledger_adjustment_event_fk
  foreign key (adjustment_event_id) references private.apple_subscription_adjustments(event_id);
create unique index coach_revenue_ledger_adjustment_event_idx
  on private.coach_revenue_ledger(adjustment_event_id) where adjustment_event_id is not null;
alter table private.apple_subscription_periods enable row level security;
alter table private.apple_financial_report_imports enable row level security;
alter table private.coach_revenue_ledger enable row level security;
alter table private.apple_subscription_adjustments enable row level security;
revoke all on private.apple_subscription_periods, private.apple_financial_report_imports,
  private.coach_revenue_ledger, private.apple_subscription_adjustments from public, anon, authenticated;
grant select, insert, update, delete on private.apple_subscription_periods,
  private.apple_financial_report_imports, private.coach_revenue_ledger,
  private.apple_subscription_adjustments to service_role;

create or replace function private.reject_immutable_accounting_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  raise exception 'accounting_records_are_append_only' using errcode = '55000';
end;
$$;
revoke all on function private.reject_immutable_accounting_change() from public, anon, authenticated;
create trigger apple_subscription_periods_append_only
before update or delete on private.apple_subscription_periods
for each row execute function private.reject_immutable_accounting_change();
create trigger coach_revenue_ledger_append_only
before update or delete on private.coach_revenue_ledger
for each row execute function private.reject_immutable_accounting_change();
create trigger apple_financial_report_imports_append_only
before update or delete on private.apple_financial_report_imports
for each row execute function private.reject_immutable_accounting_change();

-- Each report cohort is an explicit owner-reviewed match. A cohort is only
-- available when Apple's transaction date, SKU, storefront, customer currency,
-- customer price, and unit count match the signed transaction-period records.
create or replace function public.get_pending_apple_report_cohorts()
returns table(
  entry_type text,
  transaction_date date,
  product_id text,
  storefront text,
  customer_currency text,
  customer_price_milli bigint,
  units bigint,
  transaction_ids jsonb
)
language sql security definer set search_path = '' as $$
  select 'sale'::text, p.period_started_at::date, p.product_id, p.storefront, p.customer_currency,
    p.customer_price_milli, count(*)::bigint,
    jsonb_agg(p.transaction_id order by p.transaction_id)
  from private.apple_subscription_periods p
  where p.attribution_status = 'awaiting_apple_report'
    and p.coach_id_at_period_start is not null
    and p.storefront is not null and p.customer_currency is not null
    and p.customer_price_milli > 0
    and not exists (select 1 from private.coach_revenue_ledger l where l.transaction_id = p.transaction_id and l.adjustment_event_id is null)
  group by p.period_started_at::date, p.product_id, p.storefront, p.customer_currency, p.customer_price_milli
  union all
  select 'return'::text, p.period_started_at::date, p.product_id, p.storefront, p.customer_currency,
    p.customer_price_milli, count(*)::bigint,
    jsonb_agg(a.event_id order by a.event_id)
  from private.apple_subscription_adjustments a
  join private.apple_subscription_periods p on p.transaction_id = a.transaction_id
  where a.event_type in ('REFUND', 'REVOKE')
    and p.coach_id_at_period_start is not null
    and p.storefront is not null and p.customer_currency is not null
    and p.customer_price_milli > 0
    and not exists (select 1 from private.coach_revenue_ledger l where l.adjustment_event_id = a.event_id)
    and (select count(*) from private.apple_subscription_adjustments other
      where other.transaction_id = a.transaction_id and other.event_type in ('REFUND','REVOKE')
        and not exists (select 1 from private.coach_revenue_ledger l where l.adjustment_event_id = other.event_id)) = 1
  group by p.period_started_at::date, p.product_id, p.storefront, p.customer_currency, p.customer_price_milli
  order by 2, 1, 3, 4, 5, 6;
$$;
revoke all on function public.get_pending_apple_report_cohorts() from public, anon, authenticated;
grant execute on function public.get_pending_apple_report_cohorts() to service_role;

create or replace function public.reconcile_apple_report_cohort(
  p_report_reference text,
  p_fiscal_period text,
  p_transaction_date date,
  p_product_id text,
  p_storefront text,
  p_customer_currency text,
  p_customer_price_milli bigint,
  p_report_units integer,
  p_proceeds_currency text,
  p_finalized_proceeds numeric,
  p_report_sha256 text,
  p_imported_by uuid,
  p_transaction_ids text[],
  p_entry_type text default 'sale'
)
returns text language plpgsql security definer set search_path = '' as $$
declare
  report_id uuid;
  existing_report_id uuid;
  report_hash text;
  report_amount numeric;
  candidate_count integer;
  price_weight_total numeric;
  allocated_total numeric := 0;
  allocation numeric;
  transaction_row record;
  processed integer := 0;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required' using errcode = '42501'; end if;
  if p_report_reference is null or length(p_report_reference) not between 1 and 200
    or p_fiscal_period is null or p_fiscal_period !~ '^\d{4}-(0[1-9]|1[0-2])$'
    or p_transaction_date is null or p_product_id is null or p_storefront is null
    or p_customer_currency is null or p_customer_currency !~ '^[A-Z]{3}$'
    or p_customer_price_milli is null or p_customer_price_milli <= 0
    or p_proceeds_currency is null or p_proceeds_currency !~ '^[A-Z]{3}$'
    or p_finalized_proceeds is null or p_entry_type is null or p_entry_type not in ('sale','return')
    or (p_entry_type = 'sale' and p_finalized_proceeds < 0)
    or (p_entry_type = 'return' and p_finalized_proceeds > 0)
    or p_report_sha256 is null or p_report_sha256 !~ '^[0-9a-f]{64}$' or p_imported_by is null
    or p_report_units is null or p_report_units <= 0 or p_report_units > 1000
    or p_transaction_ids is null or cardinality(p_transaction_ids) <> p_report_units
    or (select count(distinct ids.transaction_id) from unnest(p_transaction_ids) as ids(transaction_id)) <> p_report_units then
    raise exception 'invalid_apple_report_cohort';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'apple-report-cohort:' || p_transaction_date::text || ':' || p_product_id || ':' || p_storefront || ':' ||
      p_customer_currency || ':' || p_customer_price_milli::text, 0));

  select i.id, i.report_sha256, i.finalized_proceeds into existing_report_id, report_hash, report_amount
  from private.apple_financial_report_imports i
  where i.report_reference = p_report_reference and i.entry_type = p_entry_type and i.transaction_date = p_transaction_date
    and i.product_id = p_product_id and i.storefront = p_storefront
    and i.customer_currency = p_customer_currency and i.customer_price_milli = p_customer_price_milli;
  if found then
    if report_hash <> p_report_sha256 or report_amount <> p_finalized_proceeds then
      raise exception 'apple_report_reference_conflict';
    end if;
    if (select count(*) from private.coach_revenue_ledger l where l.report_id = existing_report_id) = p_report_units then
      return 'duplicate';
    end if;
    raise exception 'apple_report_import_incomplete';
  end if;

  if p_entry_type = 'sale' then
    select count(*)::integer, coalesce(sum(p.customer_price_milli), 0)
    into candidate_count, price_weight_total
    from private.apple_subscription_periods p
    where p.attribution_status = 'awaiting_apple_report'
      and p.coach_id_at_period_start is not null
      and p.period_started_at >= p_transaction_date::timestamptz
      and p.period_started_at < (p_transaction_date + 1)::timestamptz
      and p.product_id = p_product_id and p.storefront = p_storefront
      and p.customer_currency = p_customer_currency and p.customer_price_milli = p_customer_price_milli
      and not exists (select 1 from private.coach_revenue_ledger l where l.transaction_id = p.transaction_id and l.adjustment_event_id is null);
  else
    select count(*)::integer,
      coalesce(sum(p.customer_price_milli * coalesce(a.revocation_percentage_milli, 100000) / 100000.0), 0)
    into candidate_count, price_weight_total
    from private.apple_subscription_adjustments a
    join private.apple_subscription_periods p on p.transaction_id = a.transaction_id
    where a.event_type in ('REFUND','REVOKE')
      and p.coach_id_at_period_start is not null
      and p.period_started_at >= p_transaction_date::timestamptz
      and p.period_started_at < (p_transaction_date + 1)::timestamptz
      and p.product_id = p_product_id and p.storefront = p_storefront
      and p.customer_currency = p_customer_currency and p.customer_price_milli = p_customer_price_milli
      and not exists (select 1 from private.coach_revenue_ledger l where l.adjustment_event_id = a.event_id)
      and (select count(*) from private.apple_subscription_adjustments other
        where other.transaction_id = a.transaction_id and other.event_type in ('REFUND','REVOKE')
          and not exists (select 1 from private.coach_revenue_ledger l where l.adjustment_event_id = other.event_id)) = 1;
  end if;
  if candidate_count <> p_report_units or price_weight_total <= 0 then
    raise exception 'apple_report_cohort_unit_mismatch';
  end if;
  if p_entry_type = 'sale' and exists (
    select 1 from unnest(p_transaction_ids) supplied(transaction_id)
    left join private.apple_subscription_periods p on p.transaction_id = supplied.transaction_id
    where p.transaction_id is null or p.attribution_status <> 'awaiting_apple_report'
      or p.coach_id_at_period_start is null
      or p.period_started_at < p_transaction_date::timestamptz
      or p.period_started_at >= (p_transaction_date + 1)::timestamptz
      or p.product_id <> p_product_id or p.storefront <> p_storefront
      or p.customer_currency <> p_customer_currency or p.customer_price_milli <> p_customer_price_milli
      or exists (select 1 from private.coach_revenue_ledger l where l.transaction_id = p.transaction_id and l.adjustment_event_id is null)
  ) then raise exception 'apple_report_transaction_cohort_mismatch'; end if;
  if p_entry_type = 'return' and exists (
    select 1 from unnest(p_transaction_ids) supplied(event_id)
    left join private.apple_subscription_adjustments a on a.event_id = supplied.event_id
    left join private.apple_subscription_periods p on p.transaction_id = a.transaction_id
    where a.event_id is null or a.event_type not in ('REFUND','REVOKE')
      or p.coach_id_at_period_start is null
      or p.period_started_at < p_transaction_date::timestamptz
      or p.period_started_at >= (p_transaction_date + 1)::timestamptz
      or p.product_id <> p_product_id or p.storefront <> p_storefront
      or p.customer_currency <> p_customer_currency or p.customer_price_milli <> p_customer_price_milli
      or (select count(*) from private.apple_subscription_adjustments other
        where other.transaction_id = a.transaction_id and other.event_type in ('REFUND','REVOKE')
          and not exists (select 1 from private.coach_revenue_ledger l where l.adjustment_event_id = other.event_id)) <> 1
      or exists (select 1 from private.coach_revenue_ledger l where l.adjustment_event_id = a.event_id)
  ) then raise exception 'apple_report_return_cohort_mismatch'; end if;

  insert into private.apple_financial_report_imports(
    report_reference, fiscal_period, entry_type, transaction_date, product_id, storefront,
    customer_currency, customer_price_milli, report_units, proceeds_currency,
    finalized_proceeds, report_sha256, imported_by
  ) values (
    p_report_reference, p_fiscal_period, p_entry_type, p_transaction_date, p_product_id, p_storefront,
    p_customer_currency, p_customer_price_milli, p_report_units, p_proceeds_currency,
    p_finalized_proceeds, p_report_sha256, p_imported_by
  ) on conflict (report_reference, entry_type, transaction_date, product_id, storefront, customer_currency, customer_price_milli) do nothing
  returning id into report_id;
  if report_id is null then raise exception 'apple_report_import_race'; end if;

  if p_entry_type = 'sale' then
  for transaction_row in
    select p.transaction_id, p.coach_id_at_period_start, p.customer_price_milli
    from private.apple_subscription_periods p
    where p.transaction_id = any(p_transaction_ids)
    order by p.transaction_id
  loop
    processed := processed + 1;
    if processed = p_report_units then
      allocation := p_finalized_proceeds - allocated_total;
    else
      allocation := pg_catalog.round(p_finalized_proceeds * transaction_row.customer_price_milli / price_weight_total, 8);
    end if;
    allocated_total := allocated_total + allocation;
    insert into private.coach_revenue_ledger(
      report_id, transaction_id, coach_id, allocated_net_proceeds,
      share_amount, currency
    ) values (
      report_id, transaction_row.transaction_id, transaction_row.coach_id_at_period_start,
      allocation, allocation / 2, p_proceeds_currency
    );
  end loop;
  else
    for transaction_row in
      select a.event_id, a.transaction_id, p.coach_id_at_period_start,
        (p.customer_price_milli * coalesce(a.revocation_percentage_milli, 100000) / 100000.0) as weight
      from unnest(p_transaction_ids) supplied(event_id)
      join private.apple_subscription_adjustments a on a.event_id = supplied.event_id
      join private.apple_subscription_periods p on p.transaction_id = a.transaction_id
      where (select count(*) from private.apple_subscription_adjustments other
        where other.transaction_id = a.transaction_id and other.event_type in ('REFUND','REVOKE')
          and not exists (select 1 from private.coach_revenue_ledger l where l.adjustment_event_id = other.event_id)) = 1
      order by a.event_id
    loop
      processed := processed + 1;
      if processed = p_report_units then
        allocation := p_finalized_proceeds - allocated_total;
      else
        allocation := pg_catalog.round(p_finalized_proceeds * transaction_row.weight / price_weight_total, 8);
      end if;
      allocated_total := allocated_total + allocation;
      insert into private.coach_revenue_ledger(
        report_id, transaction_id, coach_id, allocated_net_proceeds,
        share_amount, currency, adjustment_event_id
      ) values (
        report_id, transaction_row.transaction_id, transaction_row.coach_id_at_period_start,
        allocation, allocation / 2, p_proceeds_currency, transaction_row.event_id
      );
    end loop;
  end if;
  if processed <> p_report_units or allocated_total <> p_finalized_proceeds then
    raise exception 'apple_report_allocation_total_mismatch';
  end if;
  return 'reconciled';
end;
$$;
revoke all on function public.reconcile_apple_report_cohort(text,text,date,text,text,text,bigint,integer,text,numeric,text,uuid,text[],text) from public, anon, authenticated;
grant execute on function public.reconcile_apple_report_cohort(text,text,date,text,text,text,bigint,integer,text,numeric,text,uuid,text[],text) to service_role;
create trigger apple_subscription_adjustments_append_only
before update or delete on private.apple_subscription_adjustments
for each row execute function private.reject_immutable_accounting_change();

create or replace function public.record_apple_subscription_period(
  p_transaction_id text,
  p_original_transaction_id text,
  p_athlete_id uuid,
  p_product_id text,
  p_period_started_at timestamptz,
  p_period_ends_at timestamptz,
  p_customer_price_milli bigint,
  p_customer_currency text,
  p_storefront text,
  p_offer_type integer,
  p_event_type text,
  p_event_signed_at timestamptz,
  p_revocation_percentage_milli integer default null
)
returns text language plpgsql security definer set search_path = '' as $$
declare
  tracking_started_at timestamptz;
  assigned_coach uuid;
  assignment_count integer;
  assignment_status text;
  final_status text;
begin
  if auth.role() <> 'service_role' then raise exception 'service_role_required' using errcode = '42501'; end if;
  if p_transaction_id is null or p_original_transaction_id is null or p_athlete_id is null
    or p_product_id is null or p_period_started_at is null or p_event_type is null
    or p_event_signed_at is null then raise exception 'incomplete_apple_period'; end if;
  if not exists (select 1 from private.apple_subscription_products
    where product_id = p_product_id and enabled and plan = 'athlete') then
    raise exception 'unknown_or_disabled_apple_athlete_product';
  end if;
  if p_customer_price_milli is not null and p_customer_price_milli < 0 then raise exception 'invalid_apple_price'; end if;
  if p_customer_currency is not null and p_customer_currency !~ '^[A-Z]{3}$' then raise exception 'invalid_apple_currency'; end if;
  if p_event_type not in ('SUBSCRIBED','DID_RENEW','OFFER_REDEEMED','REFUND','REVOKE','REFUND_REVERSED','RENEWAL_EXTENSION','RENEWAL_EXTENDED') then
    return 'ignored_event';
  end if;

  select tracked_from into tracking_started_at
  from private.coach_assignment_tracking where athlete_id = p_athlete_id;
  select count(*), (pg_catalog.array_agg(coach_id))[1] into assignment_count, assigned_coach
  from private.coach_assignment_history
  where athlete_id = p_athlete_id and valid_from <= p_period_started_at
    and (valid_to is null or p_period_started_at < valid_to);
  if assignment_count > 1 then
    assignment_status := 'ambiguous';
  elsif assignment_count = 1 then
    assignment_status := 'awaiting_apple_report';
  elsif tracking_started_at is null or p_period_started_at < tracking_started_at then
    assignment_status := 'history_gap';
  else
    assignment_status := 'no_coach';
  end if;

  final_status := case
    when assignment_status = 'no_coach' then 'no_coach'
    when p_customer_price_milli = 0 then 'no_proceeds'
    when assignment_status <> 'awaiting_apple_report' then assignment_status
    else 'awaiting_apple_report'
  end;
  insert into private.apple_subscription_periods(
    transaction_id, original_transaction_id, athlete_id, product_id, period_started_at,
    period_ends_at, customer_price_milli, customer_currency, storefront, offer_type,
    coach_id_at_period_start, attribution_status, event_type
  ) values (
    p_transaction_id, p_original_transaction_id, p_athlete_id, p_product_id, p_period_started_at,
    p_period_ends_at, p_customer_price_milli, p_customer_currency, p_storefront, p_offer_type,
    assigned_coach, final_status, p_event_type
  ) on conflict (transaction_id) do nothing;

  if exists (select 1 from private.apple_subscription_periods where transaction_id = p_transaction_id and (
      athlete_id <> p_athlete_id or original_transaction_id <> p_original_transaction_id
      or product_id <> p_product_id or period_started_at <> p_period_started_at
  )) then raise exception 'apple_transaction_period_conflict'; end if;
  if p_event_type in ('REFUND', 'REVOKE', 'REFUND_REVERSED') then
    insert into private.apple_subscription_adjustments(event_id, transaction_id, event_type, event_signed_at, revocation_percentage_milli)
    values (p_transaction_id || ':' || p_event_type || ':' || p_event_signed_at::text, p_transaction_id, p_event_type, p_event_signed_at, p_revocation_percentage_milli)
    on conflict (event_id) do nothing;
    return 'adjustment_recorded';
  end if;
  return final_status;
end;
$$;
revoke all on function public.record_apple_subscription_period(text,text,uuid,text,timestamptz,timestamptz,bigint,text,text,integer,text,timestamptz,integer) from public, anon, authenticated;
grant execute on function public.record_apple_subscription_period(text,text,uuid,text,timestamptz,timestamptz,bigint,text,text,integer,text,timestamptz,integer) to service_role;

create or replace function public.get_my_coach_earnings()
returns table(pending_apple_report_count bigint, pending_refund_adjustment_count bigint, reconciled_balances jsonb, entries jsonb)
language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid();
begin
  if current_user_id is null or not exists (select 1 from public.profiles where id = current_user_id and role = 'coach') then
    raise exception 'coach_authentication_required' using errcode = '42501';
  end if;
  return query select
    (select count(*) from private.apple_subscription_periods p where p.coach_id_at_period_start = current_user_id
      and p.attribution_status = 'awaiting_apple_report'
      and not exists (select 1 from private.coach_revenue_ledger l where l.transaction_id = p.transaction_id and l.adjustment_event_id is null)),
    (select count(*) from private.apple_subscription_adjustments a
      join private.apple_subscription_periods p on p.transaction_id = a.transaction_id
      where p.coach_id_at_period_start = current_user_id
        and not exists (select 1 from private.coach_revenue_ledger l where l.adjustment_event_id = a.event_id)),
    coalesce((select jsonb_agg(jsonb_build_object('currency', balances.currency, 'amount', balances.amount) order by balances.currency)
      from (select l.currency, sum(l.share_amount)::text as amount
        from private.coach_revenue_ledger l where l.coach_id = current_user_id group by l.currency) balances), '[]'::jsonb),
    coalesce((select jsonb_agg(jsonb_build_object(
      'periodStartedAt', p.period_started_at, 'periodEndsAt', p.period_ends_at,
      'status', case when exists (select 1 from private.coach_revenue_ledger l where l.transaction_id = p.transaction_id and l.adjustment_event_id is null)
        then 'reconciled' else p.attribution_status end, 'currency', p.customer_currency,
      'amounts', coalesce((select jsonb_agg(jsonb_build_object('currency', grouped.currency, 'amount', grouped.share_amount::text) order by grouped.currency)
        from (select ledger.currency, sum(ledger.share_amount) as share_amount
          from private.coach_revenue_ledger ledger
          where ledger.transaction_id = p.transaction_id and ledger.coach_id = current_user_id
          group by ledger.currency) grouped), '[]'::jsonb)
    ) order by p.period_started_at desc) from private.apple_subscription_periods p where p.coach_id_at_period_start = current_user_id), '[]'::jsonb);
end;
$$;
revoke all on function public.get_my_coach_earnings() from public, anon;
grant execute on function public.get_my_coach_earnings() to authenticated;

-- Resolve Apple plan role from an enabled server catalog entry instead of a
-- compiled-in regex list. Unknown and disabled SKUs fail closed.
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
language plpgsql security definer set search_path = ''
as $$
declare
  current_entitlement public.billing_entitlements%rowtype;
  known_transaction public.billing_provider_transactions%rowtype;
  transaction_exists boolean;
  terminal_event boolean;
  existing_transaction_user uuid;
  product_plan text;
begin
  select catalog.plan into product_plan from private.apple_subscription_products catalog
  where catalog.product_id = p_provider_product_id and catalog.enabled;
  if p_user_id is null or p_provider_reference is null or p_provider_transaction_reference is null
    or p_provider_signed_date is null or p_provider_event_type is null or p_provider_product_id is null
    or p_provider_environment is null then raise exception 'incomplete_app_store_event'; end if;
  if p_plan not in ('athlete', 'coach') then raise exception 'invalid_app_store_plan'; end if;
  if p_status not in ('active', 'past_due', 'cancelled', 'expired') then raise exception 'invalid_app_store_status'; end if;
  if product_plan is null or product_plan <> p_plan then raise exception 'app_store_product_plan_mismatch'; end if;
  if p_provider_event_type not in ('SUBSCRIBED','DID_RENEW','DID_FAIL_TO_RENEW','GRACE_PERIOD_EXPIRED','EXPIRED','REFUND','REVOKE','REFUND_REVERSED','OFFER_REDEEMED','RENEWAL_EXTENSION','RENEWAL_EXTENDED') then raise exception 'unsupported_app_store_event'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('app_store:' || p_provider_reference, 0));
  select user_id into existing_transaction_user from public.billing_provider_transactions
  where provider = 'app_store' and transaction_reference = p_provider_transaction_reference;
  if existing_transaction_user is not null and existing_transaction_user <> p_user_id then raise exception 'provider_transaction_owned'; end if;
  select * into known_transaction from public.billing_provider_transactions
  where provider = 'app_store' and transaction_reference = p_provider_transaction_reference for update;
  transaction_exists := found;
  select * into current_entitlement from public.billing_entitlements where user_id = p_user_id for update;
  if found and current_entitlement.provider_reference is not null and current_entitlement.provider_reference <> p_provider_reference then raise exception 'provider_subscription_owned'; end if;
  if current_entitlement.user_id is not null and current_entitlement.source <> 'app_store' and current_entitlement.status in ('active','trialing','past_due') then raise exception 'active_entitlement_conflict'; end if;
  if transaction_exists then
    if known_transaction.original_transaction_reference <> p_provider_reference then raise exception 'provider_transaction_conflict'; end if;
    if known_transaction.provider_signed_date = p_provider_signed_date and known_transaction.event_type = p_provider_event_type then
      return query select true, true, coalesce(current_entitlement.status, p_status), p_user_id; return;
    end if;
    if known_transaction.provider_signed_date >= p_provider_signed_date then
      return query select false, false, coalesce(current_entitlement.status, p_status), p_user_id; return;
    end if;
  end if;
  if current_entitlement.user_id is not null then
    if current_entitlement.provider_signed_date > p_provider_signed_date then
      insert into public.billing_provider_transactions(provider, transaction_reference, original_transaction_reference, user_id, provider_signed_date, event_type)
      values ('app_store', p_provider_transaction_reference, p_provider_reference, p_user_id, p_provider_signed_date, p_provider_event_type)
      on conflict (provider, transaction_reference) do nothing;
      return query select false, false, current_entitlement.status, p_user_id; return;
    end if;
    if current_entitlement.provider_signed_date = p_provider_signed_date then
      if current_entitlement.provider_transaction_reference = p_provider_transaction_reference and current_entitlement.provider_event_type = p_provider_event_type then
        return query select true, true, current_entitlement.status, p_user_id;
      end if;
      return query select false, false, current_entitlement.status, p_user_id; return;
    end if;
    terminal_event := current_entitlement.provider_event_type in ('REFUND','REVOKE','EXPIRED','GRACE_PERIOD_EXPIRED');
    if terminal_event and p_provider_event_type in ('SUBSCRIBED','DID_RENEW','OFFER_REDEEMED','RENEWAL_EXTENSION','RENEWAL_EXTENDED') then
      return query select false, false, current_entitlement.status, p_user_id; return;
    end if;
    if p_provider_event_type = 'REFUND_REVERSED' and (p_provider_expires_at is null or p_provider_expires_at <= pg_catalog.now()) then
      return query select false, false, current_entitlement.status, p_user_id; return;
    end if;
  end if;
  insert into public.billing_provider_transactions(provider, transaction_reference, original_transaction_reference, user_id, provider_signed_date, event_type)
  values ('app_store', p_provider_transaction_reference, p_provider_reference, p_user_id, p_provider_signed_date, p_provider_event_type)
  on conflict (provider, transaction_reference) do nothing;
  if current_entitlement.user_id is null then
    insert into public.billing_entitlements(user_id, plan, source, status, trial_ends_at, period_ends_at, provider_reference,
      provider_transaction_reference, provider_customer_reference, provider_signed_date, provider_environment, provider_product_id,
      provider_expires_at, provider_revocation_at, provider_event_type, provider_grace_period_ends_at, updated_at)
    values (p_user_id, p_plan, 'app_store', p_status, null, p_period_ends_at, p_provider_reference,
      p_provider_transaction_reference, p_provider_customer_reference, p_provider_signed_date, p_provider_environment,
      p_provider_product_id, p_provider_expires_at, p_provider_revocation_at, p_provider_event_type,
      p_provider_grace_period_ends_at, pg_catalog.now());
  else
    update public.billing_entitlements set plan = p_plan, source = 'app_store', status = p_status, trial_ends_at = null,
      period_ends_at = p_period_ends_at, provider_reference = p_provider_reference,
      provider_transaction_reference = p_provider_transaction_reference, provider_customer_reference = p_provider_customer_reference,
      provider_signed_date = p_provider_signed_date, provider_environment = p_provider_environment,
      provider_product_id = p_provider_product_id, provider_expires_at = p_provider_expires_at,
      provider_revocation_at = p_provider_revocation_at, provider_event_type = p_provider_event_type,
      provider_grace_period_ends_at = p_provider_grace_period_ends_at, updated_at = pg_catalog.now()
    where user_id = p_user_id;
    if not found then raise exception 'entitlement_update_cardinality'; end if;
  end if;
  update public.profiles set subscription_status = p_status,
    active_plan_id = case
      when p_status = 'active' and p_plan = 'athlete' and p_active_plan_id is not null then p_active_plan_id
      when p_status <> 'active' and p_plan = 'athlete' then null
      else active_plan_id end
  where id = p_user_id;
  if not found then raise exception 'profile_update_cardinality'; end if;
  return query select true, false, p_status, p_user_id;
end;
$$;
revoke all on function public.reconcile_app_store_entitlement(uuid,text,text,timestamptz,text,text,text,timestamptz,text,text,timestamptz,timestamptz,timestamptz,text,text) from public, anon, authenticated;
grant execute on function public.reconcile_app_store_entitlement(uuid,text,text,timestamptz,text,text,text,timestamptz,text,text,timestamptz,timestamptz,timestamptz,text,text) to service_role;

create or replace function public.accept_coach_invite(invite text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  coach uuid;
  athlete uuid := auth.uid();
  seat_limit integer;
  active_count integer;
  current_coach uuid;
begin
  if athlete is null or not exists (select 1 from public.profiles where id = athlete and role = 'athlete') then
    raise exception 'Athlete authentication required' using errcode = '42501';
  end if;
  select id into coach from public.lookup_coach_invite(invite);
  if coach is null or coach = athlete then raise exception 'Invalid invitation'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('coach-capacity:' || coach::text, 0));
  select coach_id into current_coach from public.profiles where id = athlete for update;
  if current_coach is not null and current_coach <> coach then raise exception 'Disconnect from your current coach before joining another'; end if;
  if exists (select 1 from public.coach_athletes ca where ca.athlete_id = athlete and ca.status = 'active' and ca.coach_id <> coach) then
    raise exception 'Disconnect from your current coach before joining another';
  end if;
  select case when e.source <> 'app_store' then 10 else catalog.coach_capacity end into seat_limit
  from public.billing_entitlements e
  left join private.apple_subscription_products catalog
    on catalog.product_id = e.provider_product_id and catalog.enabled and catalog.plan = 'coach'
  where e.user_id = coach and e.plan = 'coach'
    and ((e.status = 'active' and (e.period_ends_at > pg_catalog.now() or e.trial_ends_at > pg_catalog.now()))
      or (e.status = 'past_due' and e.provider_grace_period_ends_at > pg_catalog.now()))
  for update of e;
  if seat_limit is null then raise exception 'Coach subscription is not active'; end if;
  select count(*) into active_count from public.coach_athletes ca
  where ca.coach_id = coach and ca.status = 'active' and ca.athlete_id <> athlete;
  if active_count >= seat_limit then raise exception 'Coach athlete capacity reached'; end if;
  insert into public.coach_athletes(coach_id, athlete_id, status) values (coach, athlete, 'active')
  on conflict (coach_id, athlete_id) do update set status = 'active';
  update public.profiles set coach_id = coach where id = athlete;
end;
$$;
revoke all on function public.accept_coach_invite(text) from public, anon;
grant execute on function public.accept_coach_invite(text) to authenticated;
