// Read-only checks. Prints status and aggregate counts, never credentials or private rows.
import { existsSync } from 'node:fs';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const env = process.env;
const results = [];
async function check(name, task) {
  try { results.push({ name, ...(await task()) }); }
  catch (error) { results.push({ name, status: 'NETWORK_ERROR', reason: error.name }); }
}
const request = (url, init = {}) => fetch(url, { signal: AbortSignal.timeout(12000), ...init });
const tasks = [];
if (process.argv.includes('--models-only')) {
  const key = env.GEMINI_API_KEY || env.GOOGLE_GENAI_API_KEY;
  try {
    const response = await request('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', { headers: { 'x-goog-api-key': key } });
    const data = await response.json();
    console.log(JSON.stringify({ status: response.status, models: data.models?.filter(m => m.supportedGenerationMethods?.includes('generateContent')).map(m => m.name) }, null, 2));
  } catch { console.log('NETWORK_ERROR'); process.exitCode = 1; }
  process.exit();
}
if (!process.argv.includes('--ai-only') && env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
  const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, Prefer: 'count=exact' };
  for (const table of ['chat_messages', 'athlete_ai_memories', 'ai_knowledge_documents', 'ai_knowledge_chunks']) {
    tasks.push(check(table, async () => {
      const res = await request(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${table}?select=id`, { method: 'HEAD', headers });
      return { status: res.status, count: res.headers.get('content-range')?.split('/')[1] ?? null };
    }));
  }
  tasks.push(check('knowledge_vectors', async () => {
    const res = await request(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/ai_knowledge_chunks?select=id&embedding=not.is.null&active=eq.true`, { method: 'HEAD', headers });
    return { status: res.status, count: res.headers.get('content-range')?.split('/')[1] ?? null };
  }));
}
if (env.GEMINI_API_KEY || env.GOOGLE_GENAI_API_KEY) {
  const headers = { 'x-goog-api-key': env.GEMINI_API_KEY || env.GOOGLE_GENAI_API_KEY };
  for (const model of [env.GEMINI_MODEL || 'gemini-3.6-flash', env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001']) {
    tasks.push(check(`AI model: ${model}`, async () => {
      const res = await request(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}`, { headers });
      return { status: res.status };
    }));
  }
  if (process.argv.includes('--probe-ai')) {
    tasks.push(check('AI generation (synthetic prompt)', async () => {
      const model = env.GEMINI_MODEL || 'gemini-3.6-flash';
      const res = await request(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        signal: AbortSignal.timeout(45000),
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Responde solo OK.' }] }], generationConfig: { maxOutputTokens: 32 } }),
      });
      const data = await res.json();
      return { status: res.status, hasAnswer: !!data.candidates?.[0]?.content?.parts?.some(p => p.text), reason: data.error?.message?.split(headers['x-goog-api-key']).join('[redacted]') };
    }));
    tasks.push(check('AI embedding (synthetic prompt)', async () => {
      const model = env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001';
      const res = await request(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:embedContent`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { parts: [{ text: 'Prueba de recuperación de documentos.' }] }, outputDimensionality: 768 }),
      });
      const data = await res.json();
      return { status: res.status, dimensions: data.embedding?.values?.length ?? null };
    }));
  }
}
if (!process.argv.includes('--ai-only') && env.STRAVA_CLIENT_ID && env.STRAVA_CLIENT_SECRET) {
  tasks.push(check('Strava subscription', async () => {
    const query = new URLSearchParams({ client_id: env.STRAVA_CLIENT_ID, client_secret: env.STRAVA_CLIENT_SECRET });
    const res = await request(`https://www.strava.com/api/v3/push_subscriptions?${query}`);
    if (!res.ok) return { status: res.status };
    const data = await res.json();
    return { status: res.status, subscriptions: Array.isArray(data) ? data.length : null };
  }));
}
await Promise.all(tasks);
console.log(JSON.stringify(results, null, 2));
if (results.some(result => result.status !== 200)) process.exitCode = 1;
