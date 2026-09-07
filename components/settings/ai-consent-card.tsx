'use client'
import { useState } from 'react'
import { setAIConsent } from '@/app/(app)/settings/privacy-actions'

export function AIConsentCard({ providers, version, granted }: { providers: string[]; version: string; granted: boolean }) {
  const [allowed, setAllowed] = useState(granted)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function change() {
    setBusy(true); setMessage('')
    try {
      const result = await setAIConsent(!allowed, version)
      if (result.error) setMessage(result.error)
      else { setAllowed(!allowed); setMessage(allowed ? 'Permiso retirado. No se realizarán nuevos envíos a IA.' : 'Permiso guardado.') }
    } catch { setMessage('No se pudo guardar tu decisión. Inténtalo de nuevo.') }
    finally { setBusy(false) }
  }
  return <section className="rounded-xl border border-border-default bg-bg-card p-5 space-y-3">
    <h3 className="text-sm font-bold text-text-primary">Tus datos y la inteligencia artificial</h3>
    <p className="text-sm text-text-secondary">El asistente puede enviar tus consultas y contexto de entrenamiento, recuperación, lesiones y preferencias nutricionales a {providers.join(' y ') || 'un proveedor de IA, cuando esté configurado'}. Se utilizan para generar respuestas y buscar contexto relevante.</p>
    <p className="text-sm text-text-secondary">Es opcional. Sin este permiso puedes seguir usando el calendario y las herramientas que no dependen de IA. Puedes retirarlo aquí; la retirada evita nuevos envíos y no borra automáticamente datos ya tratados por terceros. Las respuestas pueden contener errores y no sustituyen una valoración profesional.</p>
    <a className="text-sm underline" href="/privacidad">Consultar la política de privacidad</a>
    <div><button type="button" disabled={busy || !providers.length} onClick={change} className="rounded-lg border border-border-default px-4 py-3 text-sm font-semibold disabled:opacity-50">
      {busy ? 'Guardando…' : allowed ? 'Retirar permiso para IA' : 'Permitir el envío de estos datos a IA'}
    </button></div>
    <p role="status" className="text-sm text-text-secondary">{message || (allowed ? 'Permiso activo.' : 'Sin permiso: no se enviarán datos a IA.')}</p>
  </section>
}
