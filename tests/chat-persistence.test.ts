import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mergeMessages, restoreOutbox } from '@/lib/chat-messages'

const h = vi.hoisted(() => ({
  replies: [] as any[], calls: [] as any[], user: { id: 'sender' } as { id: string } | null,
  notifications: [] as Array<() => Promise<void>>,
}))
function client(): any {
  return {
    auth: { getUser: async () => ({ data: { user: h.user } }) },
    from: (table: string) => {
      const call: any = { table, filters: [] }
      h.calls.push(call)
      const query: any = {
        select: () => query,
        insert: (row: any) => { call.insert = row; return query },
        eq: (...args: any[]) => { call.filters.push(args); return query },
        in: (key: string, ids: string[]) => { call.filters.push([key, ids]); return query },
        or: (value: string) => { call.filters.push(value); return query },
        order: (...args: any[]) => { call.filters.push(args); return query },
        range: (...args: any[]) => { call.range = args; return query },
        limit: (value: number) => { call.limit = value; return query },
        single: async () => h.replies.shift(),
        maybeSingle: async () => h.replies.shift(),
        then: (resolve: any) => Promise.resolve(h.replies.shift()).then(resolve),
      }
      return query
    },
  }
}
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => client() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => client() }))
vi.mock('@/lib/notifications', () => ({ sendPushNotification: vi.fn() }))
vi.mock('next/server', () => ({ after: (callback: () => Promise<void>) => h.notifications.push(callback) }))
vi.mock('resend', () => ({ Resend: class {} }))

import { sendMessage, getMessages, getChatParticipants } from '@/app/(app)/chat/actions'
const message = { id: '12345678-1234-4234-8234-123456789abc', sender_id: 'sender', receiver_id: 'coach', message: 'Hola', created_at: '2026-09-04T10:00:00.000Z' }

describe('chat persistence', () => {
  beforeEach(() => { h.replies = []; h.calls = []; h.notifications = []; h.user = { id: 'sender' } })

  it('confirms a saved message without waiting for notification delivery', async () => {
    h.replies.push({ data: message, error: null })
    expect((await sendMessage('coach', 'Hola', message.id)).data).toEqual(message)
    expect(h.calls[0].insert.id).toBe(message.id)
    expect(h.notifications).toHaveLength(1)
    expect(h.calls).toHaveLength(1)
  })

  it('confirms a retry of an already saved message without duplicating notifications', async () => {
    h.replies.push({ error: { code: '23505' } }, { data: message })
    expect((await sendMessage('coach', 'Hola', message.id)).data).toEqual(message)
    expect(h.notifications).toHaveLength(0)
    expect(h.calls[1].filters).toContainEqual(['sender_id', 'sender'])
    expect(h.calls[1].filters).toContainEqual(['receiver_id', 'coach'])
  })

  it('does not treat a reused id with different content as saved', async () => {
    h.replies.push({ error: { code: '23505' } }, { data: message })
    expect((await sendMessage('coach', 'Otro texto', message.id)).error).toBeTruthy()
  })

  it('requires an authenticated sender', async () => {
    h.user = null
    expect((await sendMessage('coach', 'Hola', message.id)).error).toBe('No autorizado')
    expect(h.calls).toHaveLength(0)
  })

  it('loads the latest fifty with a cursor for older messages', async () => {
    const rows = Array.from({ length: 51 }, (_, i) => ({ ...message, id: String(51 - i) }))
    h.replies.push({ data: rows })
    const page = await getMessages('coach')
    expect(page.hasMore).toBe(true)
    expect(page.data).toHaveLength(50)
    expect(page.data?.[0].id).toBe('2')
    expect(h.calls[0].limit).toBe(51)
    h.replies.push({ data: [] })
    await getMessages('coach', message)
    expect(h.calls[1].filters).toContain(`created_at.lt.${message.created_at},and(created_at.eq.${message.created_at},id.lt.${message.id})`)
  })

  it('rejects malformed cursor filters', async () => {
    expect((await getMessages('coach', { id: message.id, created_at: 'x),sender_id.neq.y' })).error).toBeTruthy()
    expect(h.calls).toHaveLength(0)
  })

  it('keeps an old conversation visible after unlinking the coach', async () => {
    const oldCoach = { id: 'coach', first_name: 'Ana', last_name: null, role: 'coach', email: null }
    h.replies.push(
      { data: { role: 'athlete', coach_id: null } },
      { data: [{ sender_id: 'sender', receiver_id: 'coach' }] },
      { data: null },
      { data: [oldCoach] },
    )
    // Profile lookup limits ids to participants recovered through the user's RLS query.
    expect((await getChatParticipants()).data).toEqual([oldCoach])
  })

  it('restores interrupted sends as retryable and isolates accounts', () => {
    const raw = JSON.stringify([{ ...message, delivery: 'sending' }])
    expect(restoreOutbox(raw, 'sender')[0].delivery).toBe('failed')
    expect(restoreOutbox(raw, 'another-user')).toEqual([])
    expect(restoreOutbox('invalid', 'sender')).toEqual([])
  })

  it('merges history, realtime and pending copies by message id', () => {
    const saved = { ...message, is_read: true }
    expect(mergeMessages([message], [saved])).toEqual([saved])
  })

  it('preserves database microsecond order for pagination', () => {
    const first = { ...message, id: 'z', created_at: '2026-09-04T10:00:00.123400Z' }
    const second = { ...message, id: 'a', created_at: '2026-09-04T10:00:00.123500Z' }
    expect(mergeMessages([second, first])).toEqual([first, second])
  })
})
