import { createAdminClient } from '@/lib/supabase/admin'

const PROVIDERS: Array<{ key: string; name: string; modelKey: string; defaultModel: string; anonymous?: boolean; accountKey?: string }> = [
  { key: 'GEMINI_API_KEY', name: 'Google Gemini', modelKey: 'GEMINI_MODEL', defaultModel: 'gemini-3.6-flash' },
  { key: 'GOOGLE_GENAI_API_KEY', name: 'Google Gemini', modelKey: 'GEMINI_MODEL', defaultModel: 'gemini-3.6-flash' },
  { key: 'GROQ_API_KEY', name: 'Groq', modelKey: 'GROQ_MODEL', defaultModel: 'llama-3.3-70b-versatile' },
  { key: 'AION_API_KEY', name: 'Aion Labs', modelKey: 'AION_MODEL', defaultModel: 'aion-labs/aion-2.0' },
  { key: 'MISTRAL_API_KEY', name: 'Mistral', modelKey: 'MISTRAL_MODEL', defaultModel: 'mistral-small-latest' },
  { key: 'ZAI_API_KEY', name: 'Z AI', modelKey: 'ZAI_MODEL', defaultModel: 'GLM-4.5-Flash' },
  { key: 'HUGGINGFACE_API_KEY', name: 'Hugging Face', modelKey: 'HUGGINGFACE_MODEL', defaultModel: 'meta-llama/Llama-3.1-8B-Instruct' },
  { key: 'MODELSCOPE_API_KEY', name: 'ModelScope', modelKey: 'MODELSCOPE_MODEL', defaultModel: 'Qwen/Qwen3.5-35B-A3B' },
  { key: 'NVIDIA_API_KEY', name: 'NVIDIA NIM', modelKey: 'NVIDIA_MODEL', defaultModel: 'openai/gpt-oss-20b' },
  { key: 'OLLAMA_API_KEY', name: 'Ollama Cloud', modelKey: 'OLLAMA_MODEL', defaultModel: 'gpt-oss:20b' },
  { key: 'OPENROUTER_API_KEY', name: 'OpenRouter', modelKey: 'OPENROUTER_MODEL', defaultModel: 'openai/gpt-oss-20b:free' },
  { key: 'SILICONFLOW_API_KEY', name: 'SiliconFlow', modelKey: 'SILICONFLOW_MODEL', defaultModel: 'Qwen/Qwen3-8B' },
  { key: 'OVHCLOUD_API_KEY', name: 'OVHcloud AI', modelKey: 'OVHCLOUD_MODEL', defaultModel: 'openai/gpt-oss-20b', anonymous: true },
  { key: 'KILO_API_KEY', name: 'Kilo Code', modelKey: 'KILO_MODEL', defaultModel: 'openrouter/free', anonymous: true },
  { key: 'LLM7_API_KEY', name: 'LLM7', modelKey: 'LLM7_MODEL', defaultModel: 'gpt-oss:20b', anonymous: true },
  { key: 'COHERE_API_KEY', name: 'Cohere', modelKey: 'COHERE_MODEL', defaultModel: 'command-r' },
  { key: 'CLOUDFLARE_API_TOKEN', name: 'Cloudflare Workers AI', modelKey: 'CLOUDFLARE_MODEL', defaultModel: '@cf/meta/llama-3.1-8b-instruct', accountKey: 'CLOUDFLARE_ACCOUNT_ID' },
  { key: 'ANTHROPIC_API_KEY', name: 'Anthropic Claude', modelKey: 'ANTHROPIC_MODEL', defaultModel: 'claude-sonnet-5-20250601' },
]

function configured(value: string | undefined): value is string {
  return Boolean(value && !value.startsWith('tu-') && !value.includes('opcional') && !value.includes('PENDIENTE') && !value.includes('...'))
}

export function aiDisclosure() {
  const available = PROVIDERS.filter(provider => {
    const hasKey = configured(process.env[provider.key])
    const anonymousEnabled = provider.anonymous && process.env.AI_ENABLE_ANONYMOUS_GATEWAYS === 'true'
    const accountReady = !provider.accountKey || configured(process.env[provider.accountKey])
    return accountReady && (hasKey || anonymousEnabled)
  })
  const models = [...new Set(available.map(provider => `${provider.name} · ${configured(process.env[provider.modelKey]) ? process.env[provider.modelKey] : provider.defaultModel}`))]
  if (configured(process.env.GEMINI_API_KEY) || configured(process.env.GOOGLE_GENAI_API_KEY)) {
    models.push(`Google Gemini · ${configured(process.env.GEMINI_EMBEDDING_MODEL) ? process.env.GEMINI_EMBEDDING_MODEL : 'gemini-embedding-001'} (indexación semántica)`)
  }
  const providers = [...new Set(available.map(provider => provider.name))]
  return { providers, models, version: `2026-09-22:${models.join(',')}` }
}

export async function hasAIConsent(actorId: string, athleteId: string) {
  try {
    const { version, providers } = aiDisclosure()
    if (!providers.length) return false
    const ids = [...new Set([actorId, athleteId])]
    const db = createAdminClient() as any
    const { data, error } = await db.from('ai_consents').select('user_id, version, granted').in('user_id', ids)
    return !error && ids.every(id => data?.some((row: any) => row.user_id === id && row.version === version && row.granted === true))
  } catch {
    return false
  }
}

export async function authorizeAIRequest(actorId: string, athleteId: string) {
  try {
  if (!aiDisclosure().providers.length) return { allowed: false, code: 'AI_UNAVAILABLE' }
  if (!await hasAIConsent(actorId, athleteId)) {
    return { allowed: false, code: 'AI_CONSENT_REQUIRED' }
  }
  const db = createAdminClient() as any
  const slot = await db.rpc('take_ai_request_slot', { target: actorId })
  if (slot.error || slot.data !== true) return { allowed: false, code: 'AI_RATE_LIMIT' }
  return { allowed: true, code: 'OK' }
  } catch { return { allowed: false, code: 'AI_UNAVAILABLE' } }
}
