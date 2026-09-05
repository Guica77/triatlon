import { describe, expect, it } from 'vitest'
import { parseAIResponse } from '@/lib/ai-response'

describe('dashboard AI responses', () => {
  it('shows ordinary text', () => expect(parseAIResponse('Tu plan de hoy.')).toEqual({ content: 'Tu plan de hoy.' }))
  it('does not show provider errors as training advice', () => {
    expect(parseAIResponse('{"error":"Proveedor no disponible"}')).toEqual({ error: 'Proveedor no disponible' })
  })
  it('rejects a partial response that ended in a stream failure', () => {
    expect(parseAIResponse('Puedes entrenar{\"error\":\"Respuesta interrumpida\"}')).toEqual({ error: 'Respuesta interrumpida' })
  })
  it('does not claim success for an empty answer', () => expect(parseAIResponse(' ').error).toBeTruthy())
  it('keeps braces in ordinary text', () => expect(parseAIResponse('Ejemplo: {descanso}.').content).toBe('Ejemplo: {descanso}.'))
})
