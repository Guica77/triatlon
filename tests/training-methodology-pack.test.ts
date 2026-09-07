import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { compileMethodologyPack, CAVEAT } from '../scripts/training-methodology-pack.mjs'
import { composeAIContext, rankKnowledgeChunk } from '@/lib/ai-context'
const raw = readFileSync('knowledge/training-methodology/source.txt','utf8')
const pack = compileMethodologyPack(raw)
describe('training methodology knowledge pack', () => {
  it('is deterministic and its checked-in manifest matches the source', () => {
    expect(pack).toEqual(compileMethodologyPack(raw))
    expect(pack).toEqual(JSON.parse(readFileSync('knowledge/training-methodology/manifest.json','utf8')))
    expect(new Set(pack.chunks.map(c=>c.id)).size).toBe(pack.chunks.length)
  })
  it('keeps all 11 sections and 24 source references', () => {
    for(let n=1;n<=11;n++)expect(pack.chunks.some(c=>c.content.includes(`Sección ${n}:`))).toBe(true)
    expect(pack.chunks.filter(c=>c.content.includes('Referencia del documento aportado:'))).toHaveLength(24)
    for(const url of [...new Set(raw.match(/https:\/\/[^)\s]+/g))]) expect(pack.chunks.some(c=>c.content.includes(url))).toBe(true)
  })
  it('keeps every caveat and whole content within the runtime context cap', () => {
    for(const c of pack.chunks) { expect(c.content.startsWith(CAVEAT)).toBe(true); expect(c.content.length).toBeLessThanOrEqual(1200) }
  })
  it('changes document and chunk identities for a revised source', () => {
    const revised=compileMethodologyPack(raw.replace('Prepared: 7 September','Prepared: 8 September'))
    expect(revised.document.id).not.toBe(pack.document.id)
    expect(revised.chunks[0].id).not.toBe(pack.chunks[0].id)
  })
  it('retrieves relevant recovery guidance for a Spanish query and preserves its caveat in the prompt', () => {
    const knowledge=pack.chunks.map(c=>({...c,title:pack.document.title,category:pack.document.category,source:pack.document.source,sport_type:null}))
    const query='recuperación carga sueño fatiga RPE ACWR'
    const ranked=[...knowledge].sort((a,b)=>rankKnowledgeChunk(b,query)-rankKnowledgeChunk(a,query))
    expect(ranked[0].content).toContain('Sección 7:')
    const context=composeAIContext('test',{profile:null,plan:null,sessions:[],workouts:[],feedback:[],biometrics:[],telemetry:[]},[],knowledge,{query})
    expect(context.text).toContain(CAVEAT)
    expect(context.text).toContain('https://pubmed.ncbi.nlm.nih.gov/')
    expect(context.metadata.knowledgeCount).toBeGreaterThan(0)
  })
  it('rejects an incomplete or unrelated document', () => {
    expect(()=>compileMethodologyPack('other')).toThrow()
    expect(()=>compileMethodologyPack(raw.replace('11. Gaps','Gaps'))).toThrow()
  })
})
