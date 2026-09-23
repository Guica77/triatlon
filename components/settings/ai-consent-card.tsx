'use client'
import { useState } from 'react'
import { setAIConsent } from '@/app/(app)/settings/privacy-actions'

export function AIConsentCard({ models, version, granted }: { models: string[]; version: string; granted: boolean }) {
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
    <p className="text-sm text-text-secondary">Si usas el asistente, tu consulta y el contexto pertinente de entrenamiento, recuperación, lesiones y preferencias nutricionales pueden enviarse a estos proveedores y modelos para generar la respuesta:</p>
    {models.length ? <ul className="list-disc space-y-1 pl-5 text-sm text-text-primary">{models.map(model => <li key={model}>{model}</li>)}</ul> : <p className="text-sm text-text-secondary">No hay proveedores de IA configurados en este momento.</p>}
    <p className="text-sm text-text-secondary">El tratamiento ocurre en la infraestructura del proveedor indicado; puede ser fuera del Espacio Económico Europeo. La región y las condiciones contractuales dependen de la configuración de producción y deben verificarse antes de distribuir la app.</p>
    <p className="text-sm text-text-secondary">Es opcional. Sin permiso, tus datos no se envían a esos proveedores de IA. Puedes retirarlo aquí; la retirada bloquea nuevos envíos y no borra automáticamente datos que un proveedor ya haya recibido. Las respuestas pueden contener errores y no sustituyen una valoración profesional.</p>
    <a className="text-sm underline" href="/legal/privacidad">Consultar la política de privacidad</a>
    <div><button type="button" disabled={busy || !models.length} onClick={change} className="rounded-lg border border-border-default px-4 py-3 text-sm font-semibold disabled:opacity-50">
      {busy ? 'Guardando…' : allowed ? 'Retirar permiso para IA' : 'Permitir el envío de estos datos a IA'}
    </button></div>
    <p role="status" className="text-sm text-text-secondary">{message || (allowed ? 'Permiso activo.' : 'Sin permiso: no se enviarán datos a IA.')}</p>
  </section>
}
