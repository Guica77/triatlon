import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const ATHLETE = '11111111-1111-4111-8111-111111111111'
const COACH_A = '22222222-2222-4222-8222-222222222222'
const COACH_B = '33333333-3333-4333-8333-333333333333'
const ADMIN = '44444444-4444-4444-8444-444444444444'
let db: PGlite

const migration = (path: string) => readFileSync(path, 'utf8')

async function callPeriod(transactionID: string, startsAt: string) {
  const { rows } = await db.query<{ record_apple_subscription_period: string }>(`
    select public.record_apple_subscription_period(
      '${transactionID}', 'original-apple-chain', '${ATHLETE}',
      'com.triwavex.athlete.monthly', '${startsAt}'::timestamptz,
      '${new Date(Date.parse(startsAt) + 30 * 86_400_000).toISOString()}'::timestamptz,
      9990, 'EUR', 'ESP', null, 'DID_RENEW', '${startsAt}'::timestamptz, null
    )
  `)
  return rows[0].record_apple_subscription_period
}

async function callRefund(transactionID: string, startsAt: string) {
  const { rows } = await db.query<{ record_apple_subscription_period: string }>(`
    select public.record_apple_subscription_period(
      '${transactionID}', 'original-apple-chain', '${ATHLETE}',
      'com.triwavex.athlete.monthly', '${startsAt}'::timestamptz,
      '${new Date(Date.parse(startsAt) + 30 * 86_400_000).toISOString()}'::timestamptz,
      9990, 'EUR', 'ESP', null, 'REFUND', '2026-09-26T10:00:00Z'::timestamptz, 100000
    )
  `)
  return rows[0].record_apple_subscription_period
}

beforeAll(async () => {
  let stage = 'initialization'
  db = new PGlite()
  try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    create function auth.role() returns text language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.role', true),'') $$;
    grant usage on schema auth to authenticated, anon, service_role;
  `)
  stage = 'initial schema'
  await db.exec(migration('supabase/migrations/20260516000000_initial_schema.sql').replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', ''))
  await db.exec(`
    alter table profiles add column role text default 'athlete', add column subscription_status text default 'free',
      add column coach_id uuid, add column invite_code text, add column email text,
      add column garmin_auth_tokens jsonb, add column strava_auth_tokens jsonb,
      add column garmin_connected boolean default false, add column strava_connected boolean default false,
      add column external_athlete_id text;
    alter table training_sessions add column structured_blocks jsonb default '[]';
    create table coach_athletes(id uuid default gen_random_uuid() primary key, coach_id uuid, athlete_id uuid,
      status text default 'active', group_id uuid, created_at timestamptz not null default now(), unique(coach_id,athlete_id));
    alter table coach_athletes enable row level security;
    create table coach_groups(id uuid primary key, coach_id uuid);
    create table chat_messages(id uuid default gen_random_uuid() primary key, sender_id uuid, receiver_id uuid, message text);
    alter table chat_messages enable row level security;
    create policy legacy_messages on chat_messages for all using (sender_id=auth.uid() or receiver_id=auth.uid()) with check (sender_id=auth.uid());
    create table user_biometrics(user_id uuid, hrv integer);
    alter table user_biometrics enable row level security;
    create table user_connected_devices(id uuid default gen_random_uuid(), user_id uuid, provider text,
      access_token text, refresh_token text, expires_at timestamptz, scopes text[], created_at timestamptz default now(),
      updated_at timestamptz default now(), unique(user_id,provider));
    alter table user_connected_devices enable row level security;
    create policy device_owner on user_connected_devices for all using (user_id = auth.uid());
    grant all on all tables in schema public to authenticated, service_role;
    insert into auth.users values ('${ATHLETE}'),('${COACH_A}'),('${COACH_B}'),('${ADMIN}');
  `)
  stage = 'release security migration'
  await db.exec(migration('supabase/migrations/20260907000000_release_security.sql'))
  stage = 'base billing migrations'
  await db.exec(migration('supabase/migrations/20260917000000_billing_entitlements.sql'))
  await db.exec(migration('supabase/migrations/20260920000000_app_store_reconciliation.sql'))
  stage = 'seed test accounts'
  await db.exec(`
    insert into profiles(id, role, first_name, invite_code) values
      ('${ATHLETE}','athlete','Athlete',null),
      ('${COACH_A}','coach','Coach A','COACH-A'),
      ('${COACH_B}','coach','Coach B','COACH-B'),
      ('${ADMIN}','coach','Admin','ADMIN');
    insert into coach_athletes(coach_id, athlete_id, status, created_at)
      values ('${COACH_A}','${ATHLETE}','active','2026-09-01T00:00:00Z');
    update profiles set coach_id='${COACH_A}' where id='${ATHLETE}';
  `)
  stage = 'Apple commerce migration'
  await db.exec(migration('supabase/migrations/20260925150338_apple_product_catalog_assignment_history_and_revenue_ledger.sql'))
  } catch (error) {
    throw new Error(`PostgreSQL fixture failed during ${stage}`, { cause: error })
  }
}, 30_000)

afterAll(async () => { await db?.close() })

describe('Apple coach capacity, assignment history and audited report reconciliation', () => {
  it('applies the migration and enables arbitrary valid Apple capacity tiers above fifty', async () => {
    await db.query("select set_config('request.jwt.claim.role','service_role',false)")
    const configured = await db.query<{ configure_native_apple_coach_product: string }>(
      'select public.configure_native_apple_coach_product(55, true)'
    )
    expect(configured.rows[0].configure_native_apple_coach_product).toBe('com.triwavex.coach.monthly.55')
    const catalog = await db.query('select * from public.get_native_apple_product_catalog() order by product_id')
    expect(catalog.rows).toContainEqual({ product_id: 'com.triwavex.coach.monthly.55', plan: 'coach', coach_capacity: 55 })
    await expect(db.query('select public.configure_native_apple_coach_product(56,true)')).rejects.toThrow()
  })

  it('keeps a delayed Apple period attributed to the coach assigned when that paid period began', async () => {
    await db.query("select set_config('request.jwt.claim.role','service_role',false)")
    expect(await callPeriod('apple-tx-before-switch', '2026-09-24T10:00:00Z')).toBe('awaiting_apple_report')
    await db.exec(`
      update coach_athletes set status='pending' where athlete_id='${ATHLETE}' and coach_id='${COACH_A}';
      update profiles set coach_id=null where id='${ATHLETE}';
      insert into coach_athletes(coach_id,athlete_id,status,created_at)
        values ('${COACH_B}','${ATHLETE}','active','2026-09-25T18:00:00Z');
      update profiles set coach_id='${COACH_B}' where id='${ATHLETE}';
    `)
    const attributed = await db.query<{ coach_id_at_period_start: string }>(
      "select coach_id_at_period_start from private.apple_subscription_periods where transaction_id='apple-tx-before-switch'"
    )
    expect(attributed.rows[0].coach_id_at_period_start).toBe(COACH_A)

    // A notification arriving now but carrying an earlier signed billing period
    // must still resolve against the closed, historical interval.
    expect(await callPeriod('apple-tx-delayed-after-switch', '2026-09-24T12:00:00Z')).toBe('awaiting_apple_report')
    const delayed = await db.query<{ coach_id_at_period_start: string }>(
      "select coach_id_at_period_start from private.apple_subscription_periods where transaction_id='apple-tx-delayed-after-switch'"
    )
    expect(delayed.rows[0].coach_id_at_period_start).toBe(COACH_A)
    const nextPeriod = await callPeriod('apple-tx-after-switch', '2026-09-26T10:00:00Z')
    expect(nextPeriod).toBe('awaiting_apple_report')
    const current = await db.query<{ coach_id_at_period_start: string }>(
      "select coach_id_at_period_start from private.apple_subscription_periods where transaction_id='apple-tx-after-switch'"
    )
    expect(current.rows[0].coach_id_at_period_start).toBe(COACH_B)
  })

  it('reconciles only an exact reviewed cohort, allocates exactly half of net proceeds and is idempotent', async () => {
    await db.query("select set_config('request.jwt.claim.role','service_role',false)")
    await callPeriod('apple-tx-financial-report', '2026-09-23T10:00:00Z')
    const args = `
      'report-september-final.txt', '2026-09', '2026-09-23', 'com.triwavex.athlete.monthly',
      'ESP', 'EUR', 9990, 1, 'EUR', 7.42, repeat('a',64), '${ADMIN}', array['apple-tx-financial-report']::text[]
    `
    const first = await db.query<{ reconcile_apple_report_cohort: string }>(`select public.reconcile_apple_report_cohort(${args})`)
    expect(first.rows[0].reconcile_apple_report_cohort).toBe('reconciled')
    const repeated = await db.query<{ reconcile_apple_report_cohort: string }>(`select public.reconcile_apple_report_cohort(${args})`)
    expect(repeated.rows[0].reconcile_apple_report_cohort).toBe('duplicate')
    const ledger = await db.query<{ total_net: string; coach_share: string }>(`
      select sum(allocated_net_proceeds)::text total_net, sum(share_amount)::text coach_share
      from private.coach_revenue_ledger l join private.apple_financial_report_imports r on r.id=l.report_id
      where r.report_reference='report-september-final.txt'
    `)
    expect(ledger.rows[0].total_net).toBe('7.42000000')
    expect(ledger.rows[0].coach_share).toBe('3.71000000')

    // A later Apple refund is matched as a separate negative report row. It
    // reduces the original coach's accrued balance and cannot be duplicated.
    await callRefund('apple-tx-financial-report', '2026-09-23T10:00:00Z')
    const adjustment = await db.query<{ event_id: string }>(`
      select event_id from private.apple_subscription_adjustments where transaction_id='apple-tx-financial-report'
    `)
    const pendingReturns = await db.query<{ entry_type: string; units: number; transaction_ids: string[] }>(
      'select * from public.get_pending_apple_report_cohorts() where entry_type = \'return\' and transaction_date = \'2026-09-23\''
    )
    expect(pendingReturns.rows).toHaveLength(1)
    expect(pendingReturns.rows[0].units).toBe(1)
    expect(pendingReturns.rows[0].transaction_ids).toEqual([adjustment.rows[0].event_id])
    const returnArgs = `
      'report-september-refunds.txt', '2026-09', '2026-09-23', 'com.triwavex.athlete.monthly',
      'ESP', 'EUR', 9990, 1, 'EUR', -4.25, repeat('c',64), '${ADMIN}', array['${adjustment.rows[0].event_id}']::text[], 'return'
    `
    const returned = await db.query<{ reconcile_apple_report_cohort: string }>(`select public.reconcile_apple_report_cohort(${returnArgs})`)
    expect(returned.rows[0].reconcile_apple_report_cohort).toBe('reconciled')
    const duplicateReturn = await db.query<{ reconcile_apple_report_cohort: string }>(`select public.reconcile_apple_report_cohort(${returnArgs})`)
    expect(duplicateReturn.rows[0].reconcile_apple_report_cohort).toBe('duplicate')
    const balanceAfterReturn = await db.query<{ total_net: string; coach_share: string }>(`
      select sum(allocated_net_proceeds)::text total_net, sum(share_amount)::text coach_share
      from private.coach_revenue_ledger where transaction_id='apple-tx-financial-report'
    `)
    expect(balanceAfterReturn.rows[0].total_net).toBe('3.17000000')
    expect(balanceAfterReturn.rows[0].coach_share).toBe('1.58500000')
    await expect(db.query(`select public.reconcile_apple_report_cohort(
      'mismatch.txt','2026-09','2026-09-23','com.triwavex.athlete.monthly','ESP','EUR',9990,2,'EUR',7.42,
      repeat('b',64),'${ADMIN}',array['apple-tx-financial-report','missing']::text[]
    )`)).rejects.toThrow()
    const immutable = await db.query<{ id: string }>("select * from private.coach_revenue_ledger")
    await expect(db.query(`delete from private.coach_revenue_ledger where id='${immutable.rows[0].id}'`)).rejects.toThrow(/accounting_records_are_append_only/)
  })

  it('serves coach balances grouped by proceeds currency and never by another user', async () => {
    await db.query(`select set_config('request.jwt.claim.sub','${COACH_A}',false)`)
    const { rows } = await db.query<{ pending_apple_report_count: number; pending_refund_adjustment_count: number; reconciled_balances: {currency:string;amount:string}[] }>(
      'select * from public.get_my_coach_earnings()'
    )
    const summary = rows[0]
    expect(summary.pending_apple_report_count).toBe(2)
    expect(summary.pending_refund_adjustment_count).toBe(0)
    expect(summary.reconciled_balances).toEqual([{ currency: 'EUR', amount: '1.58500000' }])
    await db.query(`select set_config('request.jwt.claim.sub','${COACH_B}',false)`)
    const { rows: otherRows } = await db.query<{ reconciled_balances: unknown[] }>(
      'select * from public.get_my_coach_earnings()'
    )
    expect(otherRows[0].reconciled_balances).toEqual([])
  })
})
