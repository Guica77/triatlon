import * as React from 'react';

export default function ResumenLoading() {
  return (
    <div className="min-h-screen bg-surface-app w-full pb-24 animate-pulse">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8 space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-hover shrink-0" />
          <div className="space-y-2">
            <div className="h-4 bg-surface-hover rounded w-40" />
            <div className="h-3 bg-surface-hover rounded w-28" />
          </div>
        </div>

        {/* Anillo skeleton */}
        <div className="rounded-2xl border border-border-default bg-surface-card shadow-card p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-40 h-40 rounded-full bg-surface-hover shrink-0" />
          <div className="flex-1 space-y-3 w-full">
            <div className="h-3 bg-surface-hover rounded w-24 mx-auto sm:mx-0" />
            <div className="h-7 bg-surface-hover rounded w-2/3 mx-auto sm:mx-0" />
            <div className="h-4 bg-surface-hover rounded w-1/2 mx-auto sm:mx-0" />
          </div>
        </div>

        {/* Métricas skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border-default bg-surface-card shadow-card p-4 space-y-3">
              <div className="h-4 bg-surface-hover rounded w-1/2" />
              <div className="h-8 bg-surface-hover rounded w-3/4" />
            </div>
          ))}
        </div>

        {/* Barras skeleton */}
        <div className="rounded-2xl border border-border-default bg-surface-card shadow-card p-5 space-y-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-surface-hover rounded w-1/3" />
              <div className="h-2.5 bg-surface-hover rounded-full" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
