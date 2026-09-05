import type { ChatMessageItem } from '@/app/(app)/chat/actions'

export type PendingMessage = ChatMessageItem & { delivery: 'sending' | 'failed' }

export function mergeMessages(...groups: ChatMessageItem[][]): ChatMessageItem[] {
  const byId = new Map<string, ChatMessageItem>()
  for (const group of groups) for (const message of group) byId.set(message.id, message)
  return [...byId.values()].sort((a, b) => {
    const milliseconds = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    // Postgres retains microseconds; Date alone would reorder tied milliseconds by ID.
    const fraction = (date: string) => Number(`0.${date.match(/\.(\d+)/)?.[1] || '0'}`)
    return milliseconds || fraction(a.created_at) - fraction(b.created_at) || a.id.localeCompare(b.id)
  })
}

export function restoreOutbox(raw: string | null, userId: string): PendingMessage[] {
  try {
    const rows = JSON.parse(raw || '[]')
    if (!Array.isArray(rows)) return []
    return rows.filter(row => row && row.sender_id === userId && typeof row.id === 'string' &&
      typeof row.receiver_id === 'string' && typeof row.message === 'string' && typeof row.created_at === 'string')
      .map(row => ({ ...row, delivery: 'failed' }))
  } catch { return [] }
}
