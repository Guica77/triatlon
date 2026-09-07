import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'
const C = '33333333-3333-4333-8333-333333333333'
let db: PGlite
async function asUser(id: string, sql: string) {
  await db.exec(`BEGIN; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${id}',true);`)
  try { return await db.query(sql) } finally { await db.exec('ROLLBACK') }
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO authenticated, anon, service_role;
  `)
  await db.exec(readFileSync('supabase/migrations/20260516000000_initial_schema.sql','utf8').replace('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',''))
  await db.exec(`
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'athlete', ADD COLUMN subscription_status text DEFAULT 'free',
      ADD COLUMN coach_id uuid, ADD COLUMN invite_code text, ADD COLUMN email text,
      ADD COLUMN garmin_auth_tokens jsonb, ADD COLUMN strava_auth_tokens jsonb,
      ADD COLUMN garmin_connected boolean DEFAULT false, ADD COLUMN strava_connected boolean DEFAULT false,
      ADD COLUMN external_athlete_id text;
    ALTER TABLE training_sessions ADD COLUMN structured_blocks jsonb DEFAULT '[]';
    CREATE TABLE coach_athletes(id uuid DEFAULT gen_random_uuid() PRIMARY KEY, coach_id uuid, athlete_id uuid,
      status text DEFAULT 'active', group_id uuid, UNIQUE(coach_id, athlete_id));
    ALTER TABLE coach_athletes ENABLE ROW LEVEL SECURITY;
    CREATE TABLE coach_groups(id uuid PRIMARY KEY, coach_id uuid);
    CREATE TABLE chat_messages(id uuid DEFAULT gen_random_uuid() PRIMARY KEY, sender_id uuid, receiver_id uuid, message text);
    ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
    CREATE POLICY legacy_messages ON chat_messages FOR ALL USING (sender_id=auth.uid() OR receiver_id=auth.uid()) WITH CHECK (sender_id=auth.uid());
    CREATE TABLE user_biometrics(user_id uuid, hrv integer);
    ALTER TABLE user_biometrics ENABLE ROW LEVEL SECURITY;
    CREATE TABLE user_connected_devices(id uuid DEFAULT gen_random_uuid(), user_id uuid, provider text,
      access_token text, refresh_token text, expires_at timestamptz, scopes text[], created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(), UNIQUE(user_id,provider));
    ALTER TABLE user_connected_devices ENABLE ROW LEVEL SECURITY;
    CREATE POLICY device_owner ON user_connected_devices FOR ALL USING (user_id = auth.uid());
    GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
    INSERT INTO auth.users VALUES ('${A}'),('${B}'),('${C}');
    INSERT INTO profiles(id,first_name,role,invite_code,garmin_auth_tokens) VALUES
      ('${A}','Athlete A','athlete',null,'{"password":"test-only"}'),
      ('${B}','Athlete B','athlete',null,null),('${C}','Coach','coach','INVITE-C',null);
    INSERT INTO user_connected_devices(user_id,provider,access_token,refresh_token,expires_at) VALUES
      ('${A}','strava','private-access','private-refresh',now()+interval '1 hour');
  `)
  await db.exec(readFileSync('supabase/migrations/20260907000000_release_security.sql','utf8'))
  await db.exec(readFileSync('supabase/migrations/20260907010000_chat_safety.sql','utf8'))
}, 30_000)
afterAll(async () => { await db?.close() })

describe('release migration on an isolated PostgreSQL engine', () => {
  it('allows an athlete to see only their own profile', async () => {
    expect((await asUser(A, 'SELECT id FROM profiles')).rows).toEqual([{ id:A }])
  })
  it('removes legacy passwords and denies token reads even to the owner', async () => {
    expect((await asUser(A, 'SELECT garmin_auth_tokens FROM profiles')).rows).toEqual([{garmin_auth_tokens:null}])
    await expect(asUser(A, 'SELECT access_token FROM user_connected_devices')).rejects.toThrow()
    expect((await asUser(A, 'SELECT provider FROM user_connected_devices')).rows).toEqual([{ provider:'strava' }])
  })
  it('rejects role, subscription and coach changes through direct SQL', async () => {
    for (const field of ["role='owner'", "subscription_status='pro'", `coach_id='${C}'`])
      await expect(asUser(A, `UPDATE profiles SET ${field} WHERE id='${A}'`)).rejects.toThrow()
  })
  it('rejects a coach granting themselves access', async () => {
    await expect(asUser(C, `INSERT INTO coach_athletes(coach_id,athlete_id) VALUES ('${C}','${A}')`)).rejects.toThrow()
    expect((await asUser(C, `SELECT id FROM profiles WHERE id='${A}'`)).rows).toEqual([])
  })
  it('allows an explicit invitation acceptance only for the authenticated athlete', async () => {
    await db.exec(`BEGIN; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claim.sub','${A}',true); SELECT accept_coach_invite('INVITE-C'); COMMIT;`)
    expect((await asUser(C, `SELECT id FROM profiles WHERE id='${A}'`)).rows).toEqual([{id:A}])
    expect((await asUser(C, `SELECT id FROM profiles WHERE id='${B}'`)).rows).toEqual([])
    await expect(asUser(C, "SELECT accept_coach_invite('INVITE-C')")).rejects.toThrow()
  })
  it('leaves shared global templates immutable', async () => {
    await db.exec("INSERT INTO training_plans(id,name,distance,duration_weeks,level) VALUES ('test','Test','sprint',1,'test'); INSERT INTO training_sessions(plan_id,week_number,day_name,sport_type,description) VALUES ('test',1,'Lunes','carrera','Shared')")
    await asUser(A, "UPDATE training_sessions SET description='Hacked'")
    expect((await db.query('SELECT description FROM training_sessions')).rows).toEqual([{description:'Shared'}])
  })
  it('limits AI calls atomically and prevents users resetting quota', async () => {
    for(let n=0;n<30;n++) expect((await db.query<{take_ai_request_slot:boolean}>(`SELECT take_ai_request_slot('${A}')`)).rows[0].take_ai_request_slot).toBe(true)
    expect((await db.query<{take_ai_request_slot:boolean}>(`SELECT take_ai_request_slot('${A}')`)).rows[0].take_ai_request_slot).toBe(false)
    await expect(asUser(A,'DELETE FROM ai_request_limits')).rejects.toThrow()
    await expect(asUser(A,`SELECT take_ai_request_slot('${A}')`)).rejects.toThrow()
  })
})

it('blocks unrelated messages and enforces recipient blocks', async () => {
  await expect(asUser(B, `INSERT INTO chat_messages(sender_id,receiver_id,message) VALUES ('${B}','${C}','Hola')`)).rejects.toThrow()
  await asUser(A, `INSERT INTO chat_messages(sender_id,receiver_id,message) VALUES ('${A}','${C}','Hola')`)
  await db.exec(`INSERT INTO chat_blocks(blocker_id,blocked_id) VALUES ('${C}','${A}')`)
  await expect(asUser(A, `INSERT INTO chat_messages(sender_id,receiver_id,message) VALUES ('${A}','${C}','Hola')`)).rejects.toThrow()
  expect((await asUser(B, `SELECT chat_is_blocked('${A}','${C}') blocked`)).rows).toEqual([{blocked:false}])
})
