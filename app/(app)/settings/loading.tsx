export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-zinc-950 pb-24 animate-pulse">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-8 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-zinc-800" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-zinc-800 rounded-lg" />
            <div className="h-3 w-48 bg-zinc-800 rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="h-3 w-24 bg-zinc-800 rounded-lg" />
            <div className="h-32 bg-zinc-800 rounded-xl" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <div className="h-3 w-24 bg-zinc-800 rounded-lg" />
                <div className="h-3 w-full bg-zinc-800 rounded-lg" />
                <div className="h-3 w-5/6 bg-zinc-800 rounded-lg" />
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <div className="h-3 w-24 bg-zinc-800 rounded-lg" />
                <div className="h-3 w-full bg-zinc-800 rounded-lg" />
                <div className="h-3 w-5/6 bg-zinc-800 rounded-lg" />
              </div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div className="h-3 w-32 bg-zinc-800 rounded-lg" />
              <div className="h-3 w-full bg-zinc-800 rounded-lg" />
              <div className="h-3 w-4/6 bg-zinc-800 rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <div className="h-3 w-24 bg-zinc-800 rounded-lg" />
                <div className="h-32 bg-zinc-800 rounded-xl" />
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
                <div className="h-3 w-24 bg-zinc-800 rounded-lg" />
                <div className="h-32 bg-zinc-800 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}