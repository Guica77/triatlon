/** The stream may end with an error object after partial text; never render it as advice. */
export function parseAIResponse(text: string): { content?: string; error?: string } {
  const errorStart = text.lastIndexOf('{"error":')
  if (errorStart >= 0) {
    try {
      const payload = JSON.parse(text.slice(errorStart))
      if (typeof payload.error === 'string') return { error: payload.error }
    } catch { /* Ordinary text containing braces is still a valid answer. */ }
  }
  if (!text.trim()) return { error: 'El asistente no devolvió una respuesta. Inténtalo de nuevo.' }
  return { content: text }
}
