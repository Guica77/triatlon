import { describe, expect, it } from 'vitest'
import { escapeIcsText } from '@/app/api/workouts/export-calendar/route'

describe('escapeIcsText', () => {
  it('escapes ICS delimiters, backslashes, and line breaks', () => {
    expect(escapeIcsText('A;B,C\\D\nE\r\nF')).toBe('A\\;B\\,C\\\\D\\nE\\nF')
  })
})
