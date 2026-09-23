begin;

-- Public AI RPCs perform health-data mutations. Keep them available to signed-in
-- users (their bodies enforce auth.uid() ownership/coach relationship checks),
-- but never expose these SECURITY DEFINER entry points to unauthenticated callers.
revoke execute on function public.apply_ai_recommendation(uuid) from public, anon;
revoke execute on function public.confirm_athlete_ai_memory(uuid) from public, anon;
revoke execute on function public.deactivate_athlete_ai_memory(uuid) from public, anon;
revoke execute on function public.decide_ai_recommendation(uuid, text) from public, anon;
revoke execute on function public.is_authorized_ai_actor(uuid) from public, anon;
revoke execute on function public.is_authorized_ai_athlete(uuid) from public, anon;
revoke execute on function public.propose_ai_recommendation(uuid, text, text, text, jsonb) from public, anon;
revoke execute on function public.propose_athlete_ai_memory(uuid, text, text, text) from public, anon;
revoke execute on function public.record_ai_recommendation_result(uuid, text, text) from public, anon;
revoke execute on function public.review_athlete_ai_memory(uuid) from public, anon;

grant execute on function public.apply_ai_recommendation(uuid) to authenticated, service_role;
grant execute on function public.confirm_athlete_ai_memory(uuid) to authenticated, service_role;
grant execute on function public.deactivate_athlete_ai_memory(uuid) to authenticated, service_role;
grant execute on function public.decide_ai_recommendation(uuid, text) to authenticated, service_role;
grant execute on function public.is_authorized_ai_actor(uuid) to authenticated, service_role;
grant execute on function public.is_authorized_ai_athlete(uuid) to authenticated, service_role;
grant execute on function public.propose_ai_recommendation(uuid, text, text, text, jsonb) to authenticated, service_role;
grant execute on function public.propose_athlete_ai_memory(uuid, text, text, text) to authenticated, service_role;
grant execute on function public.record_ai_recommendation_result(uuid, text, text) to authenticated, service_role;
grant execute on function public.review_athlete_ai_memory(uuid) to authenticated, service_role;

-- Trigger functions are not API RPCs. Their existing triggers continue to call
-- them without granting direct Data API execution to app roles.
revoke execute on function public.clear_removed_coach() from public, anon, authenticated;
revoke execute on function public.protect_shared_session() from public, anon, authenticated;

-- lookup_coach_invite intentionally remains public for the unauthenticated
-- invite landing screen; it only returns a coach's public display identity.

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$function$;

commit;
