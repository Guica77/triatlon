'use client'

import * as React from 'react'
import { BookOpen, FileText, Link2, PlayCircle, Plus, ShieldCheck, Users, X } from 'lucide-react'
import { archiveTriathlonResource, saveTriathlonResource } from '@/app/(app)/biblioteca/actions'

type Resource = { id: string; title: string; category: string; resource_type: 'document' | 'video' | 'link'; visibility: string; content: string; source_url: string | null; owner_id: string; created_at: string }
type Athlete = { id: string; name: string }

const categoryLabel: Record<string, string> = { natacion: 'Natación', ciclismo: 'Ciclismo', carrera: 'Carrera', fuerza: 'Fuerza', recuperacion: 'Recuperación', nutricion: 'Nutrición', material: 'Material', competicion: 'Competición', planificacion: 'Planificación' }
const visibilityLabel: Record<string, string> = { private: 'Solo yo', athlete: 'Compartido con atleta', team: 'Equipo' }

export function ResourceLibrary({ resources, athletes, isCoach }: { resources: Resource[]; athletes: Athlete[]; isCoach: boolean }) {
  const [open, setOpen] = React.useState(false)
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [filter, setFilter] = React.useState<'all' | Resource['resource_type']>('all')
  const shown = resources.filter(resource => filter === 'all' || resource.resource_type === filter)

  async function submit(formData: FormData) {
    setPending(true); setError(null)
    const result = await saveTriathlonResource({
      title: String(formData.get('title') || ''), category: String(formData.get('category') || ''), resourceType: String(formData.get('resourceType') || ''),
      visibility: String(formData.get('visibility') || ''), content: String(formData.get('content') || ''), sourceUrl: String(formData.get('sourceUrl') || ''), athleteId: String(formData.get('athleteId') || '') || undefined,
    })
    setPending(false)
    if (result.error) setError(result.error); else { setOpen(false); setNotice(result.notice || null) }
  }

  return <div className="min-h-screen bg-bg-app pb-24">
    <main className="apple-athlete-content mx-auto max-w-2xl px-4 pb-10 pt-7 sm:px-6">
      <header className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Tu conocimiento</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary">Biblioteca</h1><p className="mt-2 max-w-md text-sm leading-relaxed text-text-secondary">Material de triatlón que la IA puede usar solo en el contexto autorizado.</p></div>
        <button onClick={() => setOpen(true)} className="flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-white shadow-sm"><Plus className="h-4 w-4" />Añadir</button>
      </header>
      {notice && <p role="status" className="mt-4 rounded-2xl border border-border-default bg-surface-card px-4 py-3 text-sm leading-relaxed text-text-secondary">{notice}</p>}
      <div className="mt-6 rounded-2xl border border-border-default bg-surface-card p-4"><div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600"/><p className="text-sm leading-relaxed text-text-secondary"><strong className="text-text-primary">Privacidad primero.</strong> Tus recursos privados no se comparten. Solo entra contenido de preparación de triatlón, recuperación y rendimiento.</p></div></div>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">{([['all','Todo'],['document','Documentos'],['video','Vídeos'],['link','Enlaces']] as const).map(([key,label]) => <button key={key} onClick={() => setFilter(key)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium ${filter === key ? 'bg-text-primary text-white' : 'bg-surface-card text-text-secondary ring-1 ring-border-default'}`}>{label}</button>)}</div>
      <section className="mt-5 overflow-hidden rounded-2xl border border-border-default bg-surface-card">{shown.length ? shown.map((resource, index) => <ResourceRow key={resource.id} resource={resource} divider={index > 0} own={resource.owner_id === '' || true} />) : <div className="px-5 py-12 text-center"><BookOpen className="mx-auto h-7 w-7 text-text-muted"/><p className="mt-3 font-medium text-text-primary">Tu biblioteca está lista</p><p className="mt-1 text-sm text-text-secondary">Añade un documento, vídeo o enlace de triatlón.</p></div>}</section>
    </main>
    {open && <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center sm:p-5"><form action={submit} className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-bg-app p-5 shadow-2xl sm:max-w-lg sm:rounded-3xl"><div className="flex items-center justify-between"><div><h2 className="text-xl font-semibold text-text-primary">Añadir a la biblioteca</h2><p className="mt-1 text-sm text-text-secondary">La IA usará solo estas notas, no descargará el enlace.</p></div><button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-text-secondary"><X className="h-5 w-5"/></button></div>
      <label className="mt-5 block text-sm font-medium text-text-primary">Título<input name="title" required maxLength={240} className="mt-2 w-full rounded-xl border border-border-default bg-surface-card px-3 py-3 text-base" placeholder="Estrategia de hidratación para calor"/></label>
      <div className="mt-4 grid grid-cols-2 gap-3"><label className="text-sm font-medium text-text-primary">Tipo<select name="resourceType" defaultValue="document" className="mt-2 w-full rounded-xl border border-border-default bg-surface-card px-3 py-3"><option value="document">Documento</option><option value="video">Vídeo</option><option value="link">Enlace</option></select></label><label className="text-sm font-medium text-text-primary">Tema<select name="category" defaultValue="planificacion" className="mt-2 w-full rounded-xl border border-border-default bg-surface-card px-3 py-3">{Object.entries(categoryLabel).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
      <label className="mt-4 block text-sm font-medium text-text-primary">Enlace opcional<input name="sourceUrl" type="url" className="mt-2 w-full rounded-xl border border-border-default bg-surface-card px-3 py-3" placeholder="https://…"/></label>
      <label className="mt-4 block text-sm font-medium text-text-primary">Notas para la IA<textarea name="content" required minLength={20} maxLength={12000} rows={5} className="mt-2 w-full rounded-xl border border-border-default bg-surface-card px-3 py-3" placeholder="Resume las ideas, pautas o fragmentos que quieres tener en cuenta."/></label>
      <label className="mt-4 block text-sm font-medium text-text-primary">Quién puede usarlo<select name="visibility" defaultValue="private" className="mt-2 w-full rounded-xl border border-border-default bg-surface-card px-3 py-3"><option value="private">Solo yo</option>{isCoach ? <><option value="athlete">Compartir con un atleta</option><option value="team">Compartir con el equipo</option></> : <option value="athlete">Compartir con mi entrenador</option>}</select></label>
      {isCoach && athletes.length > 0 ? <label className="mt-4 block text-sm font-medium text-text-primary">Atleta<select name="athleteId" defaultValue={athletes[0].id} className="mt-2 w-full rounded-xl border border-border-default bg-surface-card px-3 py-3">{athletes.map(athlete => <option key={athlete.id} value={athlete.id}>{athlete.name}</option>)}</select></label> : !isCoach ? <input type="hidden" name="athleteId" value="self" /> : null}
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}<button disabled={pending} className="mt-5 min-h-12 w-full rounded-xl bg-accent px-4 text-sm font-semibold text-white disabled:opacity-50">{pending ? 'Guardando…' : 'Guardar recurso'}</button>
    </form></div>}
  </div>
}

function ResourceRow({ resource, divider }: { resource: Resource; divider: boolean; own: boolean }) { const Icon = resource.resource_type === 'video' ? PlayCircle : resource.resource_type === 'link' ? Link2 : FileText; return <article className={`${divider ? 'border-t border-border-default' : ''} p-4`}><div className="flex gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><Icon className="h-5 w-5"/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h2 className="font-medium text-text-primary">{resource.title}</h2><span className="text-xs text-text-muted">{visibilityLabel[resource.visibility] || 'Compartido'}</span></div><p className="mt-1 line-clamp-2 text-sm leading-relaxed text-text-secondary">{resource.content}</p><div className="mt-2 flex items-center gap-2 text-xs text-text-muted"><span>{categoryLabel[resource.category]}</span>{resource.source_url ? <a href={resource.source_url} target="_blank" rel="noreferrer" className="text-accent">Abrir fuente</a> : null}</div></div></div></article> }
