-- Native StoreKit products are listed only from this server-owned catalogue.
-- Coach tiers are pre-registered through 50 seats but stay disabled until the
-- matching product has been created and priced in App Store Connect.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table if not exists private.apple_subscription_products (
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

insert into private.apple_subscription_products(product_id, plan, coach_capacity, enabled)
select 'com.triwavex.coach.monthly.' || capacity::text, 'coach', capacity, false
from generate_series(15, 50, 5) as tiers(capacity)
on conflict (product_id) do nothing;

create or replace function public.get_native_apple_product_catalog()
returns table(product_id text, plan text, coach_capacity integer)
language sql stable security invoker set search_path = ''
as $$
  select p.product_id, p.plan, p.coach_capacity
  from private.apple_subscription_products p
  where p.enabled
  order by p.plan, p.coach_capacity nulls first, p.product_id;
$$;
revoke all on function public.get_native_apple_product_catalog() from public, anon, authenticated;
grant execute on function public.get_native_apple_product_catalog() to service_role;

-- An admin may enable a product only after it is independently configured in ASC.
-- StoreKit still verifies that Apple returns the identifier before the app offers it.
create or replace function public.configure_native_apple_coach_product(
  p_capacity integer,
  p_enabled boolean
)
returns text language plpgsql security invoker set search_path = '' as $$
declare configured_product_id text;
begin
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
revoke all on function public.configure_native_apple_coach_product(integer, boolean) from public, anon, authenticated;
grant execute on function public.configure_native_apple_coach_product(integer, boolean) to service_role;
