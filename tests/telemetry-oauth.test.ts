import { beforeEach, describe, expect, it, vi } from 'vitest'
const h = vi.hoisted(() => ({ records: [] as any[] }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: () => {
  const filters: Record<string,unknown> = {}; let after=''
  const chain:any = { insert: async (row:any) => {h.records.push(row);return {error:null}},
    delete:()=>chain,eq:(key:string,value:unknown)=>{filters[key]=value;return chain},gt:(_key:string,value:string)=>{after=value;return chain},select:()=>chain,
    maybeSingle:async()=>{const index=h.records.findIndex(r=>Object.entries(filters).every(([k,v])=>r[k]===v)&&r.expires_at>after);return {data:index<0?null:h.records.splice(index,1)[0]}} }
  return chain
} }) }))
import { issueTelemetryState, consumeTelemetryState } from '@/lib/auth/telemetry-oauth'
describe('one-use OAuth state bound to the user and browser', () => {
  beforeEach(()=>{h.records=[]})
  it('rejects absent, modified and cross-session states',async()=>{
    const state=await issueTelemetryState('a','/dashboard')
    expect(await consumeTelemetryState('a',null,state)).toBeNull()
    expect(await consumeTelemetryState('a',state,'different')).toBeNull()
    expect(await consumeTelemetryState('b',state,state)).toBeNull()
    expect(await consumeTelemetryState('a',state,state)).toBe('/dashboard')
  })
  it('cannot be replayed',async()=>{
    const state=await issueTelemetryState('a','/settings')
    expect(await consumeTelemetryState('a',state,state)).toBe('/settings')
    expect(await consumeTelemetryState('a',state,state)).toBeNull()
  })
  it('rejects expiry and stores only a hash',async()=>{
    const state=await issueTelemetryState('a','/settings')
    expect(h.records[0].state_hash).not.toBe(state)
    h.records[0].expires_at='2000-01-01T00:00:00.000Z'
    expect(await consumeTelemetryState('a',state,state)).toBeNull()
  })
})
