create table public.athlete_race_discount_requests (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  race_name text not null check (char_length(race_name) between 2 and 120),
  race_date date,
  proof_object_path text not null unique,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text check (review_note is null or char_length(review_note) <= 500),
  apple_offer_code text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (proof_object_path ~ ('^' || athlete_id::text || '/[0-9a-f-]{36}\.(jpg|png|pdf)$')),
  check ((status = 'pending' and reviewed_at is null and reviewed_by is null and apple_offer_code is null)
    or (status = 'rejected' and reviewed_at is not null and reviewed_by is not null and apple_offer_code is null)
    or (status = 'approved' and reviewed_at is not null and reviewed_by is not null and apple_offer_code is not null))
);

create unique index athlete_race_discount_one_pending_idx
  on public.athlete_race_discount_requests (athlete_id)
  where status = 'pending';

create unique index athlete_race_discount_offer_code_idx
  on public.athlete_race_discount_requests (lower(apple_offer_code))
  where apple_offer_code is not null;

create index athlete_race_discount_queue_idx
  on public.athlete_race_discount_requests (status, created_at desc);

alter table public.athlete_race_discount_requests enable row level security;
revoke all on table public.athlete_race_discount_requests from anon, authenticated;
grant select, insert on table public.athlete_race_discount_requests to authenticated;

create policy "Athletes can view their own race discount requests"
  on public.athlete_race_discount_requests
  for select to authenticated
  using ((select auth.uid()) = athlete_id);

create policy "Athletes can submit their own race discount proof"
  on public.athlete_race_discount_requests
  for insert to authenticated
  with check (
    (select auth.uid()) = athlete_id
    and status = 'pending'
    and reviewed_by is null
    and reviewed_at is null
    and apple_offer_code is null
    and exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'athlete'
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'race-registration-proofs',
  'race-registration-proofs',
  false,
  4194304,
  array['image/jpeg', 'image/png', 'application/pdf']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Athletes can upload their own race proof"
  on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'race-registration-proofs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Athletes can read their own race proof"
  on storage.objects
  for select to authenticated
  using (
    bucket_id = 'race-registration-proofs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Athletes can delete their own race proof"
  on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'race-registration-proofs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
