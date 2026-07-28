export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header skeleton */}
        <div className="space-y-3">
          <div className="h-6 w-64 bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-4 w-96 bg-zinc-800 rounded-lg animate-pulse" />
        </div>

        {/* KPI cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-3">
              <div className="h-9 w-9 bg-zinc-800 rounded-xl animate-pulse" />
              <div className="h-8 w-20 bg-zinc-800 rounded-lg animate-pulse" />
              <div className="h-3 w-32 bg-zinc-800 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="h-4 w-40 bg-zinc-800 rounded-lg animate-pulse" />
              <div className="h-[200px] bg-zinc-800 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 space-y-4">
          <div className="h-4 w-32 bg-zinc-800 rounded-lg animate-pulse" />
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-4 py-3 border-b border-zinc-800/50">
              <div className="h-8 w-8 bg-zinc-800 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-40 bg-zinc-800 rounded-lg animate-pulse" />
                <div className="h-2 w-28 bg-zinc-800 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}