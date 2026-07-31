import * as React from 'react';

export default function CoachDashboardLoading() {
  return (
    <div className="min-h-screen bg-[#f3f4f6] pb-24 animate-pulse">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 bg-surface-card border-b border-border-default ">
        <div className="px-6 py-4 flex justify-between items-center border-b border-border-default/60">
          <div className="flex items-center gap-3 w-full max-w-sm">
            <div className="w-10 h-10 rounded-xl bg-surface-hover shrink-0" />
            <div className="space-y-2 w-full">
              <div className="h-4 bg-surface-hover rounded w-2/3" />
              <div className="h-3 bg-zinc-150 rounded w-1/2" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-9 h-9 rounded-xl bg-zinc-150 shrink-0" />
            <div className="w-9 h-9 rounded-xl bg-zinc-150 shrink-0" />
          </div>
        </div>

        {/* Level 2 Navigation Bar */}
        <div className="px-6 py-2.5 bg-surface-hover flex items-center justify-between border-t border-border-default/30">
          <div className="flex gap-2">
            <div className="w-28 h-7 rounded-full bg-surface-hover" />
            <div className="w-28 h-7 rounded-full bg-surface-hover" />
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="max-w-6xl mx-auto px-6 pt-8 space-y-6">
        
        {/* Title / Section Roster */}
        <div className="flex justify-between items-center py-2">
          <div className="h-5 bg-zinc-250 rounded w-48" />
          <div className="h-8 bg-surface-hover rounded-xl w-32" />
        </div>

        {/* Athlete Roster Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-5 bg-surface-card border border-border-default rounded-2xl space-y-4 ">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-surface-hover shrink-0" />
                <div className="space-y-2 w-full">
                  <div className="h-4 bg-surface-hover rounded w-3/4" />
                  <div className="h-3 bg-zinc-150 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3.5 bg-surface-hover rounded w-full" />
                <div className="h-3.5 bg-surface-hover rounded w-5/6" />
              </div>
              <div className="pt-2 border-t border-zinc-100 flex justify-between gap-3">
                <div className="h-8 bg-zinc-150 rounded-lg w-1/2" />
                <div className="h-8 bg-surface-hover rounded-lg w-1/2" />
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
