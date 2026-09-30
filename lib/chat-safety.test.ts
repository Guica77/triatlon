import { describe, expect, it } from 'vitest'
import { reportChatMessageFor, setChatBlockFor, validateReportInput } from './chat-safety'

const me = '11111111-1111-4111-8111-111111111111'
const other = '22222222-2222-4222-8222-222222222222'
const messageId = '33333333-3333-4333-8333-333333333333'

/** Minimal chainable Supabase stub: every query resolves to `result`. */
function stub(results: Record<string, any>, calls: any[] = []) {
  return {
    calls,
    from(table: string) {
      const query: any = {
        select: () => query, eq: () => query, gte: () => query,
        maybeSingle: async () => results[table],
        upsert: async (row: any) => { calls.push({ table, row }); return results[`${table}:write`] ?? { error: null } },
        delete: () => { calls.push({ table, delete: true }); return query },
        then: (resolve: any) => resolve(results[table] ?? { error: null }),
      }
      return query
    },
  }
}

describe('validateReportInput', () => {
  it('requires a real message id and a reason of at least 5 characters', () => {
    expect(validateReportInput('nope', 'direct', 'insulto grave')).toBeNull()
    expect(validateReportInput(messageId, 'direct', '  hey ')).toBeNull()
    expect(validateReportInput(messageId, 'email', 'insulto grave')).toBeNull()
    expect(validateReportInput(messageId, 'direct', '  insulto grave  ')).toEqual({ messageId, kind: 'direct', reason: 'insulto grave' })
  })
})

describe('reportChatMessageFor', () => {
  it('records the sender of a message the caller can read', async () => {
    const calls: any[] = []
    const db = stub({ chat_messages: { data: { sender_id: other }, error: null } })
    const admin = stub({ chat_reports: { count: 0, error: null } }, calls)
    await expect(reportChatMessageFor(db, admin, me, messageId, 'direct', 'Mensaje ofensivo')).resolves.toEqual({ success: true })
    expect(calls[0].row).toMatchObject({ reporter_id: me, reported_id: other, message_id: messageId, message_kind: 'direct' })
  })

  it('rejects reporting your own or an unreadable message', async () => {
    const admin = stub({ chat_reports: { count: 0, error: null } })
    await expect(reportChatMessageFor(stub({ chat_messages: { data: { sender_id: me }, error: null } }), admin, me, messageId, 'direct', 'Mensaje ofensivo')).resolves.toHaveProperty('error')
    await expect(reportChatMessageFor(stub({ chat_messages: { data: null, error: null } }), admin, me, messageId, 'direct', 'Mensaje ofensivo')).resolves.toHaveProperty('error')
  })

  it('enforces the daily limit', async () => {
    const db = stub({ chat_messages: { data: { sender_id: other }, error: null } })
    const admin = stub({ chat_reports: { count: 10, error: null } })
    await expect(reportChatMessageFor(db, admin, me, messageId, 'direct', 'Mensaje ofensivo')).resolves.toHaveProperty('error')
  })
})

describe('setChatBlockFor', () => {
  it('blocks and unblocks another user but never yourself', async () => {
    const calls: any[] = []
    const db = stub({}, calls)
    await expect(setChatBlockFor(db, me, other, true)).resolves.toEqual({ success: true })
    await expect(setChatBlockFor(db, me, other, false)).resolves.toEqual({ success: true })
    expect(calls).toEqual([{ table: 'chat_blocks', row: { blocker_id: me, blocked_id: other } }, { table: 'chat_blocks', delete: true }])
    await expect(setChatBlockFor(db, me, me, true)).resolves.toHaveProperty('error')
    await expect(setChatBlockFor(db, me, 'x', true)).resolves.toHaveProperty('error')
  })
})
