import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let db: PGlite

beforeAll(async () => {
  db = new PGlite()
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
  `)
  await db.exec(readFileSync('supabase/migrations/20260925175834_native_apple_product_catalog.sql', 'utf8'))
})

afterAll(async () => { await db?.close() })

describe('native Apple product catalogue migration', () => {
  it('returns only enabled App Store products to the trusted server role', async () => {
    await db.query('set role service_role')
    const { rows } = await db.query('select * from public.get_native_apple_product_catalog() order by product_id')
    expect(rows).toEqual([
      { product_id: 'com.triwavex.athlete.monthly', plan: 'athlete', coach_capacity: null },
      { product_id: 'com.triwavex.coach.monthly', plan: 'coach', coach_capacity: 10 },
    ])
    await db.query('reset role')
  })

  it('pre-registers coach products through 50 disabled, then permits provisioning later tiers on demand', async () => {
    await db.query('set role service_role')
    const before = await db.query<{ count: string }>("select count(*)::text as count from private.apple_subscription_products where plan='coach' and coach_capacity between 15 and 50 and not enabled")
    expect(before.rows[0].count).toBe('8')

    const enabled = await db.query<{ configure_native_apple_coach_product: string }>('select public.configure_native_apple_coach_product(15, true)')
    expect(enabled.rows[0].configure_native_apple_coach_product).toBe('com.triwavex.coach.monthly.15')
    const future = await db.query<{ configure_native_apple_coach_product: string }>('select public.configure_native_apple_coach_product(55, false)')
    expect(future.rows[0].configure_native_apple_coach_product).toBe('com.triwavex.coach.monthly.55')
    await expect(db.query('select public.configure_native_apple_coach_product(56, true)')).rejects.toThrow()
    await db.query('reset role')
  })

  it('does not let public roles read or configure the private product catalogue', async () => {
    await db.query('set role anon')
    await expect(db.query('select * from public.get_native_apple_product_catalog()')).rejects.toThrow()
    await db.query('reset role')
    await db.query('set role authenticated')
    await expect(db.query('select public.configure_native_apple_coach_product(15, true)')).rejects.toThrow()
    await db.query('reset role')
  })
})
