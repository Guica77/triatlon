import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, POST } from '@/app/api/native/athlete/race-discount/route'

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profile: vi.fn(),
  requestRecord: vi.fn(),
  insert: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mocks.getUser },
    from: (table: string) => {
      if (table === 'profiles') return chain(mocks.profile)
      if (table === 'athlete_race_discount_requests') return chain(mocks.requestRecord, mocks.insert)
      throw new Error(`unexpected table ${table}`)
    },
    storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove }) },
  }),
}))

function chain(single: () => unknown, insert?: (value: unknown) => unknown) {
  const query: Record<string, any> = {}
  for (const key of ['select', 'eq', 'order', 'limit']) query[key] = vi.fn(() => query)
  query.maybeSingle = vi.fn(single)
  if (insert) query.insert = vi.fn(insert)
  return query
}

const nativeHeaders = { 'x-triwavex-native': '1' }
const request = (headers: Record<string, string> = {}) => new Request('https://triwavex.test/api/native/athlete/race-discount', {
  headers: { ...nativeHeaders, ...headers },
})

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getUser.mockResolvedValue({ data: { user: { id: '11111111-1111-4111-8111-111111111111' } }, error: null })
  mocks.profile.mockResolvedValue({ data: { role: 'athlete' }, error: null })
  mocks.requestRecord.mockResolvedValue({ data: null, error: null })
  mocks.insert.mockResolvedValue({ error: null })
  mocks.upload.mockResolvedValue({ error: null })
  mocks.remove.mockResolvedValue({ error: null })
})

describe('native race discount request', () => {
  it('requires a native same-origin authenticated athlete session', async () => {
    expect((await GET(request({ 'x-triwavex-native': '' }))).status).toBe(403)
    expect((await GET(request({ origin: 'https://attacker.test' }))).status).toBe(403)
    mocks.getUser.mockResolvedValueOnce({ data: { user: null }, error: null })
    expect((await GET(request())).status).toBe(401)
    expect(mocks.requestRecord).not.toHaveBeenCalled()
  })

  it('returns only the signed-in athlete’s own review and exposes a code only after approval', async () => {
    mocks.requestRecord.mockResolvedValueOnce({ data: {
      id: 'request-1', race_name: 'Maratón', race_date: null, status: 'pending',
      review_note: null, apple_offer_code: 'SHOULD_NOT_LEAK', created_at: '2026-09-25T10:00:00Z',
    }, error: null })
    const pending = await GET(request())
    expect(pending.status).toBe(200)
    await expect(pending.json()).resolves.toMatchObject({ request: { status: 'pending', appleOfferCode: null } })

    mocks.requestRecord.mockResolvedValueOnce({ data: {
      id: 'request-2', race_name: 'Maratón', race_date: null, status: 'approved',
      review_note: null, apple_offer_code: 'APPLE-REAL', created_at: '2026-09-25T10:00:00Z',
    }, error: null })
    const approved = await GET(request())
    await expect(approved.json()).resolves.toMatchObject({ request: { status: 'approved', appleOfferCode: 'APPLE-REAL' } })
  })

  it('rejects coaches and invalid proof instead of creating a request', async () => {
    mocks.profile.mockResolvedValueOnce({ data: { role: 'coach' }, error: null })
    const form = new FormData()
    form.set('raceName', 'Trail')
    form.set('proof', new File([new Uint8Array([1, 2, 3])], 'proof.jpg', { type: 'image/jpeg' }))
    const coachResponse = await POST(new Request('https://triwavex.test/api/native/athlete/race-discount', {
      method: 'POST', headers: nativeHeaders, body: form,
    }))
    expect(coachResponse.status).toBe(403)
    expect(mocks.upload).not.toHaveBeenCalled()

    const badForm = new FormData()
    badForm.set('raceName', 'Trail')
    badForm.set('proof', new File([new Uint8Array([1, 2, 3])], 'proof.jpg', { type: 'image/jpeg' }))
    expect((await POST(new Request('https://triwavex.test/api/native/athlete/race-discount', {
      method: 'POST', headers: nativeHeaders, body: badForm,
    }))).status).toBe(400)
  })

  it('stores a valid proof privately and creates only a pending request without a code', async () => {
    const form = new FormData()
    form.set('raceName', '  Trail   Pirineos  ')
    form.set('raceDate', '2026-10-10')
    form.set('proof', new File([new Uint8Array([0xff, 0xd8, 0xff, 0x01])], 'entry.jpg', { type: 'image/jpeg' }))
    const response = await POST(new Request('https://triwavex.test/api/native/athlete/race-discount', {
      method: 'POST', headers: nativeHeaders, body: form,
    }))
    expect(response.status).toBe(201)
    expect(mocks.upload).toHaveBeenCalledWith(expect.stringMatching(/^11111111-1111-4111-8111-111111111111\/.+\.jpg$/), expect.any(Uint8Array), expect.objectContaining({ contentType: 'image/jpeg', upsert: false }))
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ race_name: 'Trail Pirineos', status: 'pending' }))
    expect(mocks.insert.mock.calls[0][0]).not.toHaveProperty('apple_offer_code')
  })
})
