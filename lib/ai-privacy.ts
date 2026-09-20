import { createAdminClient } from '@/lib/supabase/admin'

const PROVIDER_ENV_LABELS: Array<[string, string]> = [
  ['GEMINI_API_KEY', 'Google Gemini'],
  ['GOOGLE_GENAI_API_KEY', 'Google Gemini'],
  ['GROQ_API_KEY', 'Groq'],
  ['AION_API_KEY', 'Aion Labs'],
  ['MISTRAL_API_KEY', 'Mistral AI'],
  ['ZAI_API_KEY', 'Z AI'],
  ['HUGGINGFACE_API_KEY', 'Hugging Face'],
  ['MODELSCOPE_API_KEY', 'ModelScope'],
  ['NVIDIA_API_KEY', 'NVIDIA NIM'],
  ['OLLAMA_API_KEY', 'Ollama Cloud'],
  ['OPENROUTER_API_KEY', 'OpenRouter'],
  ['SILICONFLOW_API_KEY', 'SiliconFlow'],
  ['OVHCLOUD_API_KEY', 'OVHcloud AI Endpoints'],
  ['KILO_API_KEY', 'Kilo Code'],
  ['LLM7_API_KEY', 'LLM7.io'],
  ['COHERE_API_KEY', 'Cohere'],
  ['CLOUDFLARE_API_TOKEN', 'Cloudflare Workers AI'],
]

export function aiDisclosure() {
  const providers = [...new Set(PROVIDER_ENV_LABELS
    .filter(([env]) => process.env[env] && !process.env[env]?.includes('opcional'))
    .map(([, label]) => label))]
  if (process.env.AI_ENABLE_ANONYMOUS_GATEWAYS === 'true') {
    providers.push('Gateways anónimos (Kilo Code, LLM7.io u OVHcloud)')
  }
  if (process.env.ANTHROPIC_API_KEY) providers.push('Anthropic Claude')
  return { providers, version: `2026-09-19:${providers.join(',')}` }
}

export async function authorizeAIRequest(actorId: string, athleteId: string) {
  try {
  const { version, providers } = aiDisclosure()
  if (!providers.length) return { allowed: false, code: 'AI_UNAVAILABLE' }
  const db = createAdminClient() as any
  const ids = [...new Set([actorId, athleteId])]
  const { data, error } = await db.from('ai_consents').select('user_id, version, granted').in('user_id', ids)
  if (error || !ids.every(id => data?.some((row: any) => row.user_id === id && row.version === version && row.granted === true))) {
    return { allowed: false, code: 'AI_CONSENT_REQUIRED' }
  }
  const slot = await db.rpc('take_ai_request_slot', { target: actorId })
  if (slot.error || slot.data !== true) return { allowed: false, code: 'AI_RATE_LIMIT' }
  return { allowed: true, code: 'OK' }
  } catch { return { allowed: false, code: 'AI_UNAVAILABLE' } }
}
