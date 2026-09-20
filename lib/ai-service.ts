/**
 * AI Service — Central facade for all LLM operations.
 *
 * DESIGN:
 * - Default: Google Gemini (FREE tier — 60 req/min, ~1500 req/day)
 * - Optional: Groq as a low-latency fallback when GROQ_API_KEY is set
 * - Optional: Anthropic Claude if ANTHROPIC_API_KEY is set
 * - Graceful fallback to rule-based logic when no API is available
 * - All user-facing text in Spanish
 */

import { GoogleGenerativeAI, type EmbedContentRequest } from '@google/generative-ai';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================
// Types
// ============================================================

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type AIProviderId =
  | 'gemini'
  | 'groq'
  | 'aion'
  | 'mistral'
  | 'zai'
  | 'huggingface'
  | 'kilo'
  | 'llm7'
  | 'modelscope'
  | 'nvidia'
  | 'ollama'
  | 'openrouter'
  | 'ovhcloud'
  | 'siliconflow'
  | 'cohere'
  | 'cloudflare'
  | 'anthropic'
  | 'fallback';

export interface AIServiceResult {
  content: string;
  success: boolean;
  source: AIProviderId;
  error?: string;
}

export interface AIStreamCallbacks {
  onToken: (token: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

type AIRequestOptions = { temperature?: number; maxTokens?: number };

type OpenAICompatibleProvider = {
  id: Exclude<AIProviderId, 'gemini' | 'cohere' | 'cloudflare' | 'anthropic' | 'fallback'>;
  label: string;
  url: string;
  keyEnv?: string;
  modelEnv: string;
  defaultModel: string;
  anonymous?: boolean;
};

type NativeProviderId = 'cohere' | 'cloudflare';

type NativeProvider = {
  id: NativeProviderId;
  label: string;
  keyEnv: string;
  modelEnv: string;
  defaultModel: string;
};

// ============================================================
// Provider registry
// ============================================================

let geminiClient: GoogleGenerativeAI | null = null;
let anthropicClient: Anthropic | null = null;

const OPENAI_COMPATIBLE_PROVIDERS: OpenAICompatibleProvider[] = [
  { id: 'groq', label: 'Groq', url: 'https://api.groq.com/openai/v1/chat/completions', keyEnv: 'GROQ_API_KEY', modelEnv: 'GROQ_MODEL', defaultModel: 'llama-3.3-70b-versatile' },
  { id: 'aion', label: 'Aion Labs', url: 'https://api.aionlabs.ai/v1/chat/completions', keyEnv: 'AION_API_KEY', modelEnv: 'AION_MODEL', defaultModel: 'aion-labs/aion-2.0' },
  { id: 'mistral', label: 'Mistral', url: 'https://api.mistral.ai/v1/chat/completions', keyEnv: 'MISTRAL_API_KEY', modelEnv: 'MISTRAL_MODEL', defaultModel: 'mistral-small-latest' },
  { id: 'zai', label: 'Z AI', url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', keyEnv: 'ZAI_API_KEY', modelEnv: 'ZAI_MODEL', defaultModel: 'GLM-4.5-Flash' },
  { id: 'huggingface', label: 'Hugging Face', url: 'https://router.huggingface.co/v1/chat/completions', keyEnv: 'HUGGINGFACE_API_KEY', modelEnv: 'HUGGINGFACE_MODEL', defaultModel: 'meta-llama/Llama-3.1-8B-Instruct' },
  { id: 'kilo', label: 'Kilo Code', url: 'https://api.kilo.ai/api/gateway/v1/chat/completions', keyEnv: 'KILO_API_KEY', modelEnv: 'KILO_MODEL', defaultModel: 'openrouter/free', anonymous: true },
  { id: 'llm7', label: 'LLM7', url: 'https://api.llm7.io/v1/chat/completions', keyEnv: 'LLM7_API_KEY', modelEnv: 'LLM7_MODEL', defaultModel: 'gpt-oss:20b', anonymous: true },
  { id: 'modelscope', label: 'ModelScope', url: 'https://api-inference.modelscope.cn/v1/chat/completions', keyEnv: 'MODELSCOPE_API_KEY', modelEnv: 'MODELSCOPE_MODEL', defaultModel: 'Qwen/Qwen3.5-35B-A3B' },
  { id: 'nvidia', label: 'NVIDIA NIM', url: 'https://integrate.api.nvidia.com/v1/chat/completions', keyEnv: 'NVIDIA_API_KEY', modelEnv: 'NVIDIA_MODEL', defaultModel: 'openai/gpt-oss-20b' },
  { id: 'ollama', label: 'Ollama Cloud', url: 'https://ollama.com/v1/chat/completions', keyEnv: 'OLLAMA_API_KEY', modelEnv: 'OLLAMA_MODEL', defaultModel: 'gpt-oss:20b' },
  { id: 'openrouter', label: 'OpenRouter', url: 'https://openrouter.ai/api/v1/chat/completions', keyEnv: 'OPENROUTER_API_KEY', modelEnv: 'OPENROUTER_MODEL', defaultModel: 'openai/gpt-oss-20b:free' },
  { id: 'ovhcloud', label: 'OVHcloud AI', url: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions', keyEnv: 'OVHCLOUD_API_KEY', modelEnv: 'OVHCLOUD_MODEL', defaultModel: 'openai/gpt-oss-20b', anonymous: true },
  { id: 'siliconflow', label: 'SiliconFlow', url: 'https://api.siliconflow.cn/v1/chat/completions', keyEnv: 'SILICONFLOW_API_KEY', modelEnv: 'SILICONFLOW_MODEL', defaultModel: 'Qwen/Qwen3-8B' },
];

const NATIVE_PROVIDERS: NativeProvider[] = [
  { id: 'cohere', label: 'Cohere', keyEnv: 'COHERE_API_KEY', modelEnv: 'COHERE_MODEL', defaultModel: 'command-r' },
  { id: 'cloudflare', label: 'Cloudflare Workers AI', keyEnv: 'CLOUDFLARE_API_TOKEN', modelEnv: 'CLOUDFLARE_MODEL', defaultModel: '@cf/meta/llama-3.1-8b-instruct' },
];

const providerCooldownUntil = new Map<AIProviderId, number>();
const PROVIDER_COOLDOWN_MS = 30_000;
const REQUEST_TIMEOUT_MS = 30_000;

function configuredValue(value: string | undefined): string | null {
  if (!value || value.startsWith('tu-') || value.includes('opcional') || value.includes('PENDIENTE')) return null;
  return value;
}

function getProviderKey(provider: OpenAICompatibleProvider): string | null {
  return provider.keyEnv ? configuredValue(process.env[provider.keyEnv]) : null;
}

function getNativeProviderKey(provider: NativeProvider): string | null {
  return configuredValue(process.env[provider.keyEnv]);
}

function getNativeProviderAccountId(provider: NativeProvider): string | null {
  return provider.id === 'cloudflare' ? configuredValue(process.env.CLOUDFLARE_ACCOUNT_ID) : null;
}

function isProviderAvailable(provider: OpenAICompatibleProvider): boolean {
  return Boolean(getProviderKey(provider) || (provider.anonymous && process.env.AI_ENABLE_ANONYMOUS_GATEWAYS === 'true'));
}

function isNativeProviderAvailable(provider: NativeProvider): boolean {
  return Boolean(getNativeProviderKey(provider) && (provider.id !== 'cloudflare' || getNativeProviderAccountId(provider)));
}

function getActiveNativeProviders(): NativeProvider[] {
  return NATIVE_PROVIDERS.filter(provider => isNativeProviderAvailable(provider) && !isProviderCoolingDown(provider.id));
}

function isProviderCoolingDown(id: AIProviderId): boolean {
  return (providerCooldownUntil.get(id) || 0) > Date.now();
}

function markProviderFailure(id: AIProviderId): void {
  providerCooldownUntil.set(id, Date.now() + PROVIDER_COOLDOWN_MS);
}

function markProviderSuccess(id: AIProviderId): void {
  providerCooldownUntil.delete(id);
}

function getActiveOpenAIProviders(): OpenAICompatibleProvider[] {
  return OPENAI_COMPATIBLE_PROVIDERS.filter(provider => isProviderAvailable(provider) && !isProviderCoolingDown(provider.id));
}

function providerHeaders(provider: OpenAICompatibleProvider, apiKey: string | null): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  if (provider.id === 'openrouter') {
    headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_SITE_URL || 'https://triwavex.com';
    headers['X-Title'] = 'TriWaveX';
  }
  return headers;
}

function openAIRequestBody(
  provider: OpenAICompatibleProvider,
  systemPrompt: string,
  messages: AIChatMessage[],
  options?: AIRequestOptions,
  stream = false,
) {
  return {
    model: configuredValue(process.env[provider.modelEnv]) || provider.defaultModel,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens || 1024,
    stream,
  };
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function requestOpenAICompatible(
  provider: OpenAICompatibleProvider,
  systemPrompt: string,
  messages: AIChatMessage[],
  options?: AIRequestOptions,
): Promise<string | null> {
  const response = await fetchWithTimeout(provider.url, {
    method: 'POST',
    headers: providerHeaders(provider, getProviderKey(provider)),
    body: JSON.stringify(openAIRequestBody(provider, systemPrompt, messages, options)),
  });
  if (!response.ok) throw new Error(`${provider.label} API responded with ${response.status}`);
  const data = await response.json() as { choices?: Array<{ message?: { content?: string | null } }> };
  return data.choices?.[0]?.message?.content || null;
}

function nativeModel(provider: NativeProvider): string {
  return configuredValue(process.env[provider.modelEnv]) || provider.defaultModel;
}

function cohereRequestBody(
  systemPrompt: string,
  messages: AIChatMessage[],
  options?: AIRequestOptions,
  stream = false,
) {
  return {
    model: nativeModel(NATIVE_PROVIDERS[0]),
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens || 1024,
    stream,
  };
}

function cloudflareRequestBody(
  systemPrompt: string,
  messages: AIChatMessage[],
  options?: AIRequestOptions,
  stream = false,
) {
  const prompt = [
    `System: ${systemPrompt}`,
    ...messages.map(message => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${message.content}`),
    'Assistant:',
  ].join('\n\n');
  return {
    prompt,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens || 1024,
    stream,
  };
}

function cloudflareUrl(provider: NativeProvider): string {
  const accountId = getNativeProviderAccountId(provider);
  if (!accountId) throw new Error('Cloudflare account ID is not configured');
  return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${encodeURIComponent(nativeModel(provider))}`;
}

async function requestNativeProvider(
  provider: NativeProvider,
  systemPrompt: string,
  messages: AIChatMessage[],
  options?: AIRequestOptions,
): Promise<string | null> {
  const apiKey = getNativeProviderKey(provider);
  if (!apiKey) return null;
  const isCloudflare = provider.id === 'cloudflare';
  const response = await fetchWithTimeout(isCloudflare ? cloudflareUrl(provider) : 'https://api.cohere.com/v2/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(isCloudflare
      ? cloudflareRequestBody(systemPrompt, messages, options)
      : cohereRequestBody(systemPrompt, messages, options)),
  });
  if (!response.ok) throw new Error(`${provider.label} API responded with ${response.status}`);

  const data = await response.json() as {
    message?: { content?: Array<{ type?: string; text?: string }> | string };
    result?: { response?: string };
  };
  if (isCloudflare) return data.result?.response || null;
  const content = data.message?.content;
  return typeof content === 'string'
    ? content
    : content?.filter(block => block.type === 'text').map(block => block.text || '').join('') || null;
}

function nativeSseText(provider: NativeProvider, eventName: string | undefined, data: unknown): string {
  if (!data || typeof data !== 'object') return typeof data === 'string' && provider.id === 'cloudflare' ? data : '';
  const value = data as Record<string, unknown>;
  if (provider.id === 'cloudflare') {
    if (typeof value.response === 'string') return value.response;
    if (typeof value.text === 'string') return value.text;
    return '';
  }
  const delta = value.delta;
  if (delta && typeof delta === 'object') {
    const message = (delta as Record<string, unknown>).message;
    if (message && typeof message === 'object') {
      const content = (message as Record<string, unknown>).content;
      if (content && typeof content === 'object' && typeof (content as Record<string, unknown>).text === 'string') {
        return (content as Record<string, unknown>).text as string;
      }
    }
  }
  if (eventName === 'content-delta' && typeof value.text === 'string') return value.text;
  return '';
}

async function streamNativeProvider(
  provider: NativeProvider,
  systemPrompt: string,
  messages: AIChatMessage[],
  options: AIRequestOptions | undefined,
  onToken: (token: string) => void,
): Promise<boolean> {
  const apiKey = getNativeProviderKey(provider);
  if (!apiKey) return false;
  const isCloudflare = provider.id === 'cloudflare';
  const response = await fetchWithTimeout(isCloudflare ? cloudflareUrl(provider) : 'https://api.cohere.com/v2/chat', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(isCloudflare
      ? cloudflareRequestBody(systemPrompt, messages, options, true)
      : cohereRequestBody(systemPrompt, messages, options, true)),
  });
  if (!response.ok || !response.body) throw new Error(`${provider.label} API responded with ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let emitted = false;
  const consumeFrame = (frame: string) => {
    let eventName: string | undefined;
    const dataLines: string[] = [];
    for (const line of frame.split(/\r?\n/)) {
      if (line.startsWith('event:')) eventName = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
    }
    if (!dataLines.length) return;
    const raw = dataLines.join('\n');
    if (raw === '[DONE]') return;
    let data: unknown = raw;
    try { data = JSON.parse(raw); } catch { /* Preserve plain-text provider chunks. */ }
    const text = nativeSseText(provider, eventName, data);
    if (text) { emitted = true; onToken(text); }
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const frames = buffer.split(/\r?\n\r?\n/);
    buffer = frames.pop() || '';
    frames.forEach(consumeFrame);
    if (done) break;
  }
  if (buffer) consumeFrame(buffer);
  return emitted;
}

function isOpenAIStreamChunk(value: unknown): value is { choices: Array<{ delta?: { content?: string | null } }> } {
  if (!value || typeof value !== 'object') return false;
  return Array.isArray((value as { choices?: unknown }).choices);
}

async function streamOpenAICompatible(
  provider: OpenAICompatibleProvider,
  systemPrompt: string,
  messages: AIChatMessage[],
  options: AIRequestOptions | undefined,
  onToken: (token: string) => void,
): Promise<boolean> {
  const response = await fetchWithTimeout(provider.url, {
    method: 'POST',
    headers: providerHeaders(provider, getProviderKey(provider)),
    body: JSON.stringify(openAIRequestBody(provider, systemPrompt, messages, options, true)),
  });
  if (!response.ok || !response.body) throw new Error(`${provider.label} API responded with ${response.status}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let emitted = false;
  const consumeLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed === 'data: [DONE]' || !trimmed.startsWith('data:')) return;
    try {
      const chunk: unknown = JSON.parse(trimmed.slice(5).trim());
      if (!isOpenAIStreamChunk(chunk)) return;
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) { emitted = true; onToken(text); }
    } catch {
      // Ignore non-JSON SSE frames such as provider comments.
    }
  };
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    lines.forEach(consumeLine);
    if (done) break;
  }
  if (buffer) consumeLine(buffer);
  return emitted;
}

async function tryNativeProvider(
  provider: NativeProvider,
  systemPrompt: string,
  messages: AIChatMessage[],
  options?: AIRequestOptions,
): Promise<AIServiceResult | null> {
  try {
    const text = await requestNativeProvider(provider, systemPrompt, messages, options);
    if (!text) return null;
    markProviderSuccess(provider.id);
    return { content: text, success: true, source: provider.id };
  } catch (error: any) {
    markProviderFailure(provider.id);
    console.error(`[ai-service] ${provider.label} error:`, error?.message);
    return null;
  }
}

function hasConfiguredAI(): boolean {
  return getGeminiClient() !== null || getActiveOpenAIProviders().length > 0 || getActiveNativeProviders().length > 0 || getAnthropicClient() !== null;
}

async function tryOpenAICompatible(
  provider: OpenAICompatibleProvider,
  systemPrompt: string,
  messages: AIChatMessage[],
  options?: AIRequestOptions,
): Promise<AIServiceResult | null> {
  try {
    const text = await requestOpenAICompatible(provider, systemPrompt, messages, options);
    if (!text) return null;
    markProviderSuccess(provider.id);
    return { content: text, success: true, source: provider.id };
  } catch (error: any) {
    markProviderFailure(provider.id);
    console.error(`[ai-service] ${provider.label} error:`, error?.message);
    return null;
  }
}

function getConfiguredFallbackError(): string {
  return hasConfiguredAI()
    ? 'No se pudo completar la respuesta de la IA.'
    : 'No hay API de IA configurada. Usando modo offline.';
}

function getGeminiClient(): GoogleGenerativeAI | null {
  if (geminiClient) return geminiClient;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey || apiKey === '' || apiKey === 'tu-gemini-api-key') {
    return null;
  }

  try {
    geminiClient = new GoogleGenerativeAI(apiKey);
    return geminiClient;
  } catch {
    return null;
  }
}

function getAnthropicClient(): Anthropic | null {
  if (anthropicClient) return anthropicClient;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === '' || apiKey.startsWith('sk-ant-...')) {
    return null;
  }

  try {
    anthropicClient = new Anthropic({ apiKey });
    return anthropicClient;
  } catch {
    return null;
  }
}

export function isAIAvailable(): boolean {
  return hasConfiguredAI();
}

export async function generateAIEmbedding(value: string): Promise<number[] | null> {
  const text = value.trim().slice(0, 4000)
  if (!text) return null

  const gemini = getGeminiClient()
  if (!gemini) return null

  try {
    const model = gemini.getGenerativeModel({
      model: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
    })
    const request: EmbedContentRequest & { outputDimensionality: number } = {
      content: { role: 'user', parts: [{ text }] },
      outputDimensionality: 768,
    }
    const result = await model.embedContent(request)
    const embedding = result.embedding.values
    if (embedding.length !== 768 || embedding.some(value => !Number.isFinite(value))) return null
    const norm = Math.hypot(...embedding)
    return norm > 0 ? embedding.map(value => value / norm) : null
  } catch (error: any) {
    console.error('[ai-service] Embedding error:', error?.message)
    return null
  }
}

export function getAIStatus(): { available: boolean; reason: string | null; provider: string } {
  if (getGeminiClient()) {
    return { available: true, reason: null, provider: 'gemini' };
  }
  const openAIProvider = getActiveOpenAIProviders()[0] || OPENAI_COMPATIBLE_PROVIDERS.find(isProviderAvailable);
  if (openAIProvider) {
    return { available: true, reason: null, provider: openAIProvider.id };
  }
  const nativeProvider = getActiveNativeProviders()[0] || NATIVE_PROVIDERS.find(isNativeProviderAvailable);
  if (nativeProvider) {
    return { available: true, reason: null, provider: nativeProvider.id };
  }
  if (getAnthropicClient()) {
    return { available: true, reason: null, provider: 'anthropic' };
  }
  return {
    available: false,
    reason: 'No hay API key de IA configurada. Las funciones funcionan en modo offline con reglas expertas.',
    provider: 'none',
  };
}

// ============================================================
// Chat (non-streaming)
// ============================================================

export async function aiChat(
  systemPrompt: string,
  messages: AIChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<AIServiceResult> {
  // Try Gemini first (free)
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens || 1024,
        },
      });

      const result = await model.generateContent({
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
      });

      const text = result.response.text();
      if (text) {
        return { content: text, success: true, source: 'gemini' };
      }
    } catch (error: any) {
      console.error('[ai-service] Gemini error:', error?.message);
      // Fall through to Groq, Anthropic or fallback
    }
  }

  for (const provider of getActiveOpenAIProviders()) {
    const result = await tryOpenAICompatible(provider, systemPrompt, messages, options);
    if (result) return result;
  }

  for (const provider of getActiveNativeProviders()) {
    const result = await tryNativeProvider(provider, systemPrompt, messages, options);
    if (result) return result;
  }

  // Try Anthropic as secondary option
  const anthropic = getAnthropicClient();
  if (anthropic) {
    const maxRetries = 1;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await anthropic.messages.create({
          model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-20250601',
          max_tokens: options?.maxTokens || 1024,
          temperature: options?.temperature ?? 0.7,
          system: systemPrompt,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
        });

        const text = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map(block => block.text)
          .join('');

        if (text) {
          return { content: text, success: true, source: 'anthropic' };
        }
      } catch (error: any) {
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        console.error('[ai-service] Anthropic error:', error?.message);
      }
    }
  }

  return {
    content: '',
    success: false,
    source: 'fallback',
    error: getConfiguredFallbackError(),
  };
}

// ============================================================
// Streaming Chat
// ============================================================

export async function aiChatStreaming(
  systemPrompt: string,
  messages: AIChatMessage[],
  callbacks: AIStreamCallbacks,
  options?: { temperature?: number; maxTokens?: number }
): Promise<void> {
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const model = gemini.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens || 2048,
        },
      });

      const stream = await model.generateContentStream({
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
      });

      let fullText = '';
      for await (const chunk of stream.stream) {
        const text = chunk.text();
        if (text) {
          fullText += text;
          callbacks.onToken(text);
        }
      }
      callbacks.onDone(fullText);
      return;
    } catch (error: any) {
      console.error('[ai-service] Gemini streaming error:', error?.message);
      // Fall through to Groq, Anthropic or error
    }
  }

  for (const provider of getActiveOpenAIProviders()) {
    try {
      let fullText = '';
      const emitted = await streamOpenAICompatible(provider, systemPrompt, messages, { ...options, maxTokens: options?.maxTokens || 2048 }, text => {
        fullText += text;
        callbacks.onToken(text);
      });
      if (emitted) {
        markProviderSuccess(provider.id);
        callbacks.onDone(fullText);
        return;
      }
    } catch (error: any) {
      markProviderFailure(provider.id);
      console.error(`[ai-service] ${provider.label} streaming error:`, error?.message);
    }
  }

  for (const provider of getActiveNativeProviders()) {
    try {
      let fullText = '';
      const emitted = await streamNativeProvider(provider, systemPrompt, messages, { ...options, maxTokens: options?.maxTokens || 2048 }, text => {
        fullText += text;
        callbacks.onToken(text);
      });
      if (emitted) {
        markProviderSuccess(provider.id);
        callbacks.onDone(fullText);
        return;
      }
    } catch (error: any) {
      markProviderFailure(provider.id);
      console.error(`[ai-service] ${provider.label} streaming error:`, error?.message);
    }
  }

  // Try Anthropic streaming as fallback
  const anthropic = getAnthropicClient();
  if (anthropic) {
    try {
      const stream = await anthropic.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-20250601',
        max_tokens: options?.maxTokens || 2048,
        temperature: options?.temperature ?? 0.7,
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: true,
      });

      let fullText = '';
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          fullText += event.delta.text;
          callbacks.onToken(event.delta.text);
        }
      }
      callbacks.onDone(fullText);
      return;
    } catch (error: any) {
      console.error('[ai-service] Anthropic streaming error:', error?.message);
      callbacks.onError('Error al conectar con la IA.');
      return;
    }
  }

  callbacks.onError(getConfiguredFallbackError());
}

// ============================================================
// API Route Streaming Helper
// ============================================================

export async function aiChatStreamToResponse(
  systemPrompt: string,
  messages: AIChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<ReadableStream> {
  const encoder = new TextEncoder();
  const gemini = getGeminiClient();
  const openAIProviders = getActiveOpenAIProviders();
  const nativeProviders = getActiveNativeProviders();
  const anthropic = getAnthropicClient();

  return new ReadableStream({
    async start(controller) {
      let closed = false;
      let emittedToken = false;

      const close = () => {
        if (!closed) {
          closed = true;
          controller.close();
        }
      };

      const sendError = (message: string, fallback = false) => {
        if (closed) return;
        controller.enqueue(encoder.encode(JSON.stringify({ error: message, ...(fallback ? { fallback: true } : {}) })));
        close();
      };

      const streamAnthropic = async (): Promise<boolean> => {
        if (!anthropic) return false;

        try {
          const stream = await anthropic.messages.create({
            model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-20250601',
            max_tokens: options?.maxTokens || 2048,
            temperature: options?.temperature ?? 0.7,
            system: systemPrompt,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            stream: true,
          });

          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              emittedToken = true;
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }

          return true;
        } catch (error: any) {
          console.error('[ai-service] Anthropic streaming error:', error?.message);
          return false;
        }
      };

      const streamOpenAIProviderToController = async (provider: OpenAICompatibleProvider): Promise<boolean> => {
        try {
          const emitted = await streamOpenAICompatible(provider, systemPrompt, messages, { ...options, maxTokens: options?.maxTokens || 2048 }, text => {
            emittedToken = true;
            controller.enqueue(encoder.encode(text));
          });
          if (emitted) markProviderSuccess(provider.id);
          return emitted;
        } catch (error: any) {
          markProviderFailure(provider.id);
          console.error(`[ai-service] ${provider.label} streaming error:`, error?.message);
          return false;
        }
      };

      const streamNativeProviderToController = async (provider: NativeProvider): Promise<boolean> => {
        try {
          const emitted = await streamNativeProvider(provider, systemPrompt, messages, { ...options, maxTokens: options?.maxTokens || 2048 }, text => {
            emittedToken = true;
            controller.enqueue(encoder.encode(text));
          });
          if (emitted) markProviderSuccess(provider.id);
          return emitted;
        } catch (error: any) {
          markProviderFailure(provider.id);
          console.error(`[ai-service] ${provider.label} streaming error:`, error?.message);
          return false;
        }
      };

      if (gemini) {
        try {
          const model = gemini.getGenerativeModel({
            model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
            systemInstruction: systemPrompt,
            generationConfig: {
              temperature: options?.temperature ?? 0.7,
              maxOutputTokens: options?.maxTokens || 2048,
            },
          });

          const stream = await model.generateContentStream({
            contents: messages.map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }],
            })),
          });

          for await (const chunk of stream.stream) {
            const text = chunk.text();
            if (text) {
              emittedToken = true;
              controller.enqueue(encoder.encode(text));
            }
          }

          close();
          return;
        } catch (error: any) {
          console.error('[ai-service] Gemini streaming error:', error?.message);
          // Do not append a second answer after partial Gemini output. Retry with
          // Groq or Anthropic only when Gemini failed before emitting any visible text.
          if (emittedToken) {
            sendError('La IA interrumpió la respuesta. Inténtalo de nuevo.');
            return;
          }
        }
      }

      for (const provider of openAIProviders) {
        if (await streamOpenAIProviderToController(provider)) {
          close();
          return;
        }
        if (emittedToken) {
          sendError('La IA interrumpió la respuesta. Inténtalo de nuevo.');
          return;
        }
      }

      for (const provider of nativeProviders) {
        if (await streamNativeProviderToController(provider)) {
          close();
          return;
        }
        if (emittedToken) {
          sendError('La IA interrumpió la respuesta. Inténtalo de nuevo.');
          return;
        }
      }

      if (await streamAnthropic()) {
        close();
        return;
      }

      sendError(
        gemini || openAIProviders.length > 0 || nativeProviders.length > 0 || anthropic
          ? getConfiguredFallbackError()
          : 'No hay API de IA configurada. Usando modo offline.',
        !gemini && openAIProviders.length === 0 && nativeProviders.length === 0 && !anthropic,
      );
    },
  });
}
