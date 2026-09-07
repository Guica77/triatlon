import { readFileSync, existsSync } from 'node:fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { compileMethodologyPack } from './training-methodology-pack.mjs';

const pack = compileMethodologyPack(readFileSync(new URL('../knowledge/training-methodology/source.txt', import.meta.url), 'utf8'));
const apply = process.argv.includes('--apply');
console.log(JSON.stringify({mode:apply?'apply':'dry-run',documentId:pack.document.id,sha256:pack.sha256,chunks:pack.chunks.length}));
if (!apply) process.exit(0);
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const base=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
const aiKey=process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
if (!base || !key || !aiKey) throw new Error('Missing server database or embedding configuration');
const headers={apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'};
async function db(path,method='GET',body) {
  const response=await fetch(`${base}/rest/v1/${path}`,{method,headers:{...headers,Prefer:'resolution=merge-duplicates,return=representation'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error(`Database ${method} failed (${response.status})`);
  return response.status===204?null:response.json();
}
try {
const stored=await db(`ai_knowledge_documents?id=eq.${pack.document.id}&select=id,active`);
const existing=await db(`ai_knowledge_chunks?document_id=eq.${pack.document.id}&select=id,content,active,embedding`);
if(stored[0]?.active && existing.length===pack.chunks.length && pack.chunks.every(chunk=>existing.some(row=>row.id===chunk.id && row.content===chunk.content && row.active && row.embedding))) {
  console.log(JSON.stringify({status:'already-imported',chunks:existing.length}));process.exit(0);
}
const model=new GoogleGenerativeAI(aiKey).getGenerativeModel({model:process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001'},{timeout:30000});
const chunks=[];
// Compute and validate every vector before activating any part of a new document.
for(let offset=0;offset<pack.chunks.length;offset+=10) {
  const batch=pack.chunks.slice(offset,offset+10);
  const result=await model.batchEmbedContents({requests:batch.map(chunk=>({content:{role:'user',parts:[{text:chunk.content}]},outputDimensionality:768}))});
  if(result.embeddings?.length!==batch.length)throw new Error('Incomplete embedding batch');
  batch.forEach((chunk,index)=>{
    const vector=result.embeddings[index].values;
    if(vector.length!==768 || !vector.every(Number.isFinite) || Math.hypot(...vector)===0)throw new Error('Invalid embedding');
    const norm=Math.hypot(...vector);
    chunks.push({...chunk,active:false,embedding:vector.map(value=>value/norm)});
  });
  console.log(JSON.stringify({embedded:chunks.length,total:pack.chunks.length}));
}
// Content-addressed document IDs prevent overwriting unrelated knowledge or versions.
await db('ai_knowledge_documents?on_conflict=id','POST',{...pack.document,active:false});
for(let offset=0;offset<chunks.length;offset+=20)await db('ai_knowledge_chunks?on_conflict=id','POST',chunks.slice(offset,offset+20));
const staged=await db(`ai_knowledge_chunks?document_id=eq.${pack.document.id}&select=id,content,embedding`);
if(staged.length!==chunks.length || !chunks.every(chunk=>staged.some(row=>row.id===chunk.id && row.content===chunk.content && row.embedding)))throw new Error('Staged knowledge verification failed; document remains inactive');
await db(`ai_knowledge_chunks?document_id=eq.${pack.document.id}`,'PATCH',{active:true});
await db(`ai_knowledge_documents?id=eq.${pack.document.id}`,'PATCH',{active:true});
// Prove that the existing retrieval RPC can find an actual imported vector.
const hits=await db('rpc/match_ai_knowledge_chunks','POST',{query_embedding:chunks[0].embedding,match_sport_type:null,match_threshold:0.99,match_count:6});
if(!hits.some(hit=>hit.id===chunks[0].id))throw new Error('Document stored but vector retrieval verification failed');
console.log(JSON.stringify({status:'imported-and-retrievable',documentId:pack.document.id,chunks:chunks.length,dimensions:768}));

} catch(error) {
  // Provider exceptions can contain credential-bearing URLs; never print them.
  console.error(JSON.stringify({status:'failed',type:error?.name || 'Error',httpStatus:error?.status || null}));
  process.exitCode=1;
}
