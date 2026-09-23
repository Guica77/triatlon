-- Keep the coach entitlement locked from capacity read through athlete insert.
-- This serializes acceptance against both other seats and StoreKit renewals/tier changes.
create index if not exists coach_athletes_active_by_coach_idx
  on public.coach_athletes(coach_id, athlete_id) where status = 'active';

create or replace function public.accept_coach_invite(invite text)
returns void language plpgsql security definer set search_path = '' as $$
declare coach uuid; athlete uuid := auth.uid(); seat_limit integer; active_count integer; current_coach uuid;
begin
  if athlete is null or not exists(select 1 from public.profiles where id=athlete and role='athlete') then raise exception 'Athlete authentication required' using errcode='42501'; end if;
  select id into coach from public.lookup_coach_invite(invite);
  if coach is null or coach=athlete then raise exception 'Invalid invitation'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('coach-capacity:'||coach::text,0));
  select coach_id into current_coach from public.profiles where id=athlete for update;
  if current_coach is not null and current_coach<>coach then raise exception 'Disconnect from your current coach before joining another'; end if;
  if exists(select 1 from public.coach_athletes ca where ca.athlete_id=athlete and ca.status='active' and ca.coach_id<>coach) then
    raise exception 'Disconnect from your current coach before joining another';
  end if;

  select case
    when e.source <> 'app_store' then 10
    when e.provider_product_id='com.triwavex.coach.monthly' then 10
    when e.provider_product_id ~ '^com\.triwavex\.coach\.monthly\.(15|20|25|30|35|40|45|50)$' then regexp_replace(e.provider_product_id,'.*\.','')::integer
    else null end into seat_limit
  from public.billing_entitlements e where e.user_id=coach and e.plan='coach'
    and ((e.status='active' and (e.period_ends_at>now() or e.trial_ends_at>now()))
      or (e.status='past_due' and e.provider_grace_period_ends_at>now()))
  for update;
  if seat_limit is null then raise exception 'Coach subscription is not active'; end if;
  select count(*) into active_count from public.coach_athletes ca where ca.coach_id=coach and ca.status='active' and ca.athlete_id<>athlete;
  if active_count>=seat_limit then raise exception 'Coach athlete capacity reached'; end if;
  insert into public.coach_athletes(coach_id,athlete_id,status) values(coach,athlete,'active')
    on conflict(coach_id,athlete_id) do update set status='active';
  update public.profiles set coach_id=coach where id=athlete;
end $$;
revoke all on function public.accept_coach_invite(text) from public,anon;
grant execute on function public.accept_coach_invite(text) to authenticated;
