'use client'
import { useState } from 'react'
import { reportChatMessage, setChatBlock } from '@/app/(app)/chat/safety-actions'

export function ChatSafety({ userId, messageId, kind = 'direct' }: { userId:string; messageId?:string; kind?:'direct'|'group' }) {
  const [open,setOpen]=useState(false), [busy,setBusy]=useState(false), [reason,setReason]=useState(''), [feedback,setFeedback]=useState('')
  async function run(action:()=>Promise<{error?:string}>, success:string) {
    setBusy(true);setFeedback('')
    try { const result=await action();setFeedback(result.error || success) }
    catch {setFeedback('No se pudo completar la solicitud. Inténtalo de nuevo.')}
    finally {setBusy(false)}
  }
  return <div className="relative">
    <button type="button" onClick={()=>setOpen(!open)} aria-expanded={open} className="min-h-11 rounded-lg px-2 text-xs underline">Seguridad</button>
    {open && <div className="absolute right-0 z-40 w-64 rounded-xl border border-border-default bg-surface-card p-4 shadow-xl space-y-3">
      <p className="text-xs">El bloqueo impide nuevos mensajes directos y oculta sus mensajes de grupo al volver a cargar. Puedes deshacerlo aquí.</p>
      <button type="button" disabled={busy} onClick={()=>run(()=>setChatBlock(userId,true),'Usuario bloqueado.')} className="min-h-11 text-sm underline">Bloquear usuario</button>
      <button type="button" disabled={busy} onClick={()=>run(()=>setChatBlock(userId,false),'Bloqueo retirado.')} className="min-h-11 text-sm underline">Desbloquear</button>
      {messageId && <form onSubmit={e=>{e.preventDefault();void run(()=>reportChatMessage(messageId,kind,reason),'Denuncia registrada para revisión.')}} className="space-y-2">
        <label className="block text-xs">Motivo de la denuncia<textarea required minLength={5} maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)} className="mt-2 w-full rounded border bg-surface-hover p-2" /></label>
        <button type="submit" disabled={busy} className="min-h-11 text-sm underline">Denunciar mensaje</button>
      </form>}
      <p role="status" className="text-xs">{busy?'Procesando…':feedback}</p>
    </div>}
  </div>
}
