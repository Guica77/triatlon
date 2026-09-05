import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({ embed: vi.fn(), model: vi.fn() }))
vi.mock('@google/generative-ai', () => ({ GoogleGenerativeAI: class {
  getGenerativeModel(options: unknown) { h.model(options); return { embedContent: h.embed } }
} }))
vi.mock('@anthropic-ai/sdk', () => ({ default: class {} }))
import { generateAIEmbedding } from '@/lib/ai-service'

describe('RAG embedding compatibility', () => {
  beforeEach(() => {
    vi.stubEnv('GEMINI_API_KEY', 'synthetic-test-key')
    vi.stubEnv('GEMINI_EMBEDDING_MODEL', '')
    h.model.mockReset()
    h.embed.mockReset().mockResolvedValue({ embedding: { values: Array(768).fill(1) } })
  })
  afterEach(() => vi.unstubAllEnvs())

  it('uses a supported model and requests the database vector size', async () => {
    const vector = await generateAIEmbedding('Prueba')
    expect(h.model).toHaveBeenCalledWith({ model: 'gemini-embedding-001' })
    expect(h.embed.mock.calls[0][0].outputDimensionality).toBe(768)
    expect(vector).toHaveLength(768)
    expect(Math.hypot(...vector!)).toBeCloseTo(1)
  })
  it('rejects incompatible dimensions', async () => {
    h.embed.mockResolvedValue({ embedding: { values: Array(3072).fill(1) } })
    expect(await generateAIEmbedding('Prueba')).toBeNull()
  })
  it('rejects zero vectors', async () => {
    h.embed.mockResolvedValue({ embedding: { values: Array(768).fill(0) } })
    expect(await generateAIEmbedding('Prueba')).toBeNull()
  })
  it('rejects non-finite vectors', async () => {
    h.embed.mockResolvedValue({ embedding: { values: Array(768).fill(NaN) } })
    expect(await generateAIEmbedding('Prueba')).toBeNull()
  })
  it('does not call the provider for empty queries', async () => {
    expect(await generateAIEmbedding('  ')).toBeNull()
    expect(h.embed).not.toHaveBeenCalled()
  })
})
