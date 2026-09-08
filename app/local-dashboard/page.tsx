import { notFound } from 'next/navigation'
import { Activity, Brain, Database, Users, UserMinus, FileText, CheckCircle2, CircleAlert } from 'lucide-react'
import { getBusinessMetrics } from '@/app/admin/actions'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type RagSnapshot = {
  documents: Array<{ id: string; title: string; category: string | null; active: boolean; chunks: number }>
  documentCount: number
  activeDocuments: number
  chunkCount: number
  activeChunks: number
  error?: string
}

async function getRagSnapshot(): Promise<RagSnapshot> {
  const db = createAdminClient() as any
  const [documentsResult, chunksResult] = await Promise.all([
    db.from('ai_knowledge_documents').select('id,title,category,active').order('created_at', { ascending: false }),
    db.from('ai_knowledge_chunks').select('id,document_id,active'),
  ])

  if (documentsResult.error || chunksResult.error) {
    return {
      documents: [], documentCount: 0, activeDocuments: 0, chunkCount: 0, activeChunks: 0,
      error: 'No se pudo consultar el estado del RAG en Supabase.',
    }
  }

  const chunks = chunksResult.data || []
  const documents = (documentsResult.data || []).map((document: any) => ({
    id: document.id,
    title: document.title || 'Sin título',
    category: document.category || null,
    active: Boolean(document.active),
    chunks: chunks.filter((chunk: any) => chunk.document_id === document.id).length,
  }))

  return {
    documents,
    documentCount: documents.length,
    activeDocuments: documents.filter((document: { active: boolean }) => document.active).length,
    chunkCount: chunks.length,
    activeChunks: chunks.filter((chunk: any) => chunk.active).length,
  }
}

function number(value: number) {
  return new Intl.NumberFormat('es-ES').format(value)
}

export default async function LocalOperationsDashboard() {
  if (process.env.NODE_ENV === 'production') notFound()

  const [metricsResult, ragResult] = await Promise.allSettled([
    getBusinessMetrics({ allowLocal: true }),
    getRagSnapshot(),
  ])
  const metrics = metricsResult.status === 'fulfilled' ? metricsResult.value : null
  const rag = ragResult.status === 'fulfilled'
    ? ragResult.value
    : { documents: [], documentCount: 0, activeDocuments: 0, chunkCount: 0, activeChunks: 0, error: 'No se pudo consultar el RAG.' }

  return (
    <main className="min-h-screen bg-bg-app px-4 py-8 text-text-primary sm:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-3 border-b border-border-default pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-bike">TriWaveX · Local</p>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Panel de operaciones</h1>
            <p className="mt-2 text-sm text-text-secondary">Datos reales de Supabase en modo lectura.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-bike/30 bg-bike/10 px-3 py-1.5 text-xs font-bold text-bike">
            <span className="h-2 w-2 rounded-full bg-bike" /> Solo local
          </span>
        </header>

        {!metrics && (
          <section className="rounded-xl border border-warning/30 bg-warning/10 p-5 text-sm text-text-secondary">
            <CircleAlert className="mb-2 h-5 w-5 text-warning" />
            No se pudieron cargar las métricas de negocio. Comprueba la conexión local con Supabase.
          </section>
        )}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Churn mensual" value={metrics ? `${metrics.monthlyChurnRate}%` : '—'} icon={UserMinus} />
          <Metric label="Usuarios totales" value={metrics ? number(metrics.totalUsers) : '—'} icon={Users} />
          <Metric label="MAU" value={metrics ? number(metrics.mau) : '—'} icon={Activity} />
          <Metric label="MRR" value={metrics ? `${metrics.mrr.toFixed(2)} €` : '—'} icon={Database} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-xl border border-border-default bg-bg-card p-5">
            <div className="mb-5 flex items-center gap-3">
              <Brain className="h-5 w-5 text-swim" />
              <div><h2 className="font-bold">RAG de entrenamiento</h2><p className="text-xs text-text-muted">Estado real de documentos y chunks</p></div>
            </div>
            {rag.error ? <p className="text-sm text-warning">{rag.error}</p> : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat label="Documentos" value={rag.documentCount} />
                <Stat label="Activos" value={rag.activeDocuments} />
                <Stat label="Chunks" value={rag.chunkCount} />
                <Stat label="Chunks activos" value={rag.activeChunks} />
              </div>
            )}
          </div>
          <div className="rounded-xl border border-border-default bg-bg-card p-5">
            <div className="mb-4 flex items-center gap-3"><FileText className="h-5 w-5 text-bike" /><h2 className="font-bold">Documentos RAG</h2></div>
            <div className="space-y-3">
              {rag.documents.length === 0 && <p className="text-sm text-text-muted">No hay documentos cargados.</p>}
              {rag.documents.map((document) => (
                <div key={document.id} className="flex items-center justify-between gap-3 border-b border-border-subtle pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0"><p className="truncate text-sm font-semibold">{document.title}</p><p className="text-xs text-text-muted">{document.chunks} chunks{document.category ? ` · ${document.category}` : ''}</p></div>
                  <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-bold ${document.active ? 'text-bike' : 'text-text-muted'}`}><CheckCircle2 className="h-3.5 w-3.5" />{document.active ? 'Activo' : 'Inactivo'}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {metrics && <section className="rounded-xl border border-border-default bg-bg-card p-5">
          <div className="mb-4 flex items-center gap-3"><Users className="h-5 w-5 text-swim" /><h2 className="font-bold">Retención y actividad</h2></div>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <Stat label="Churn trimestral" value={`${metrics.quarterlyChurnRate}%`} />
            <Stat label="Usuarios premium" value={metrics.premiumUsers} />
            <Stat label="Conversión premium" value={`${metrics.premiumConversionRate}%`} />
            <Stat label="Entrenadores" value={metrics.totalCoaches} />
          </div>
        </section>}
      </div>
    </main>
  )
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Activity }) {
  return <div className="rounded-xl border border-border-default bg-bg-card p-5"><Icon className="mb-4 h-5 w-5 text-bike" /><p className="text-xs text-text-muted">{label}</p><p className="mt-1 text-2xl font-black tracking-tight">{value}</p></div>
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-lg border border-border-subtle bg-bg-hover/40 p-3"><p className="text-[11px] text-text-muted">{label}</p><p className="mt-1 text-lg font-black">{typeof value === 'number' ? number(value) : value}</p></div>
}
