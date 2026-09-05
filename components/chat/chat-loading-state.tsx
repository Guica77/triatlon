export function ChatLoadingState() {
  return (
    <div role="status" aria-live="polite" className="flex flex-1 flex-col justify-center gap-5 p-6">
      <div aria-hidden="true" className="space-y-4 motion-safe:animate-pulse">
        <div className="h-14 w-3/4 rounded-2xl rounded-tl-sm bg-surface-card" />
        <div className="ml-auto h-12 w-2/3 rounded-2xl rounded-tr-sm bg-surface-hover" />
        <div className="h-14 w-1/2 rounded-2xl rounded-tl-sm bg-surface-card" />
      </div>
      <p className="text-center text-sm text-text-muted">Cargando conversación…</p>
    </div>
  )
}
