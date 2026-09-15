import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET, PATCH, POST, PUT } from '@/app/api/native/athlete/plan/route'

const { getUser, from } = vi.hoisted(() => ({ getUser: vi.fn(), from: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ auth: { getUser }, from }) }))

beforeEach(() => {
  vi.clearAllMocks()
  getUser.mockResolvedValue({ data: { user: null }, error: null })
})

const getRequest = (headers: Record<string, string> = {}) => new Request('https://triwavex.test/api/native/athlete/plan', {
  headers: { 'x-triwavex-native': '1', ...headers },
})
const patchRequest = (body: object, headers: Record<string, string> = {}) => new Request('https://triwavex.test/api/native/athlete/plan', {
  method: 'PATCH', body: JSON.stringify(body), headers: { 'x-triwavex-native': '1', 'content-type': 'application/json', ...headers },
})
const postRequest = (body: object) => new Request('https://triwavex.test/api/native/athlete/plan', {
  method: 'POST', body: JSON.stringify(body), headers: { 'x-triwavex-native': '1', 'content-type': 'application/json' },
})
const putRequest = (body: object) => new Request('https://triwavex.test/api/native/athlete/plan', {
  method: 'PUT', body: JSON.stringify(body), headers: { 'x-triwavex-native': '1', 'content-type': 'application/json' },
})

describe('/api/native/athlete/plan security', () => {
  it('rejects browser and cross-origin reads before authentication', async () => {
    expect((await GET(getRequest({ 'x-triwavex-native': '' }))).status).toBe(403)
    expect((await GET(getRequest({ origin: 'https://attacker.test' }))).status).toBe(403)
    expect(getUser).not.toHaveBeenCalled()
  })

  it('requires a valid session for reads', async () => {
    const response = await GET(getRequest())
    expect(response.status).toBe(401)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(from).not.toHaveBeenCalled()
  })

  it('rejects writes without JSON, native header, or same origin', async () => {
    expect((await PATCH(patchRequest({ workoutId: 'one', date: '2026-09-16' }, { 'content-type': 'text/plain' }))).status).toBe(403)
    expect((await PATCH(patchRequest({ workoutId: 'one', date: '2026-09-16' }, { origin: 'https://attacker.test' }))).status).toBe(403)
    expect(getUser).not.toHaveBeenCalled()
  })

  it('validates a change before opening the session', async () => {
    expect((await PATCH(patchRequest({ workoutId: 'one', date: 'tomorrow' }))).status).toBe(400)
    expect((await PATCH(patchRequest({ workoutId: 'one', date: '2026-09-16' }))).status).toBe(400)
    expect((await PATCH(patchRequest({ workoutId: 'one', status: 'deleted' }))).status).toBe(400)
    expect(getUser).not.toHaveBeenCalled()
  })

  it('validates preview and confirmation contracts before authentication', async () => {
    expect((await POST(postRequest({ workoutId: 'not-a-uuid', targetDate: '2026-09-16', targetSlot: 'morning', idempotencyKey: 'bad' }))).status).toBe(400)
    expect((await PUT(putRequest({ proposalId: 'not-a-uuid', action: 'confirm' }))).status).toBe(400)
    expect((await PUT(putRequest({ proposalId: '123e4567-e89b-42d3-a456-426614174000', action: 'delete' }))).status).toBe(400)
    expect(getUser).not.toHaveBeenCalled()
  })
})
