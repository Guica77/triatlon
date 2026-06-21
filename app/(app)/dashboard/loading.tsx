import * as React from 'react';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#f3f4f6] pb-24 animate-pulse">
      {/* Sticky Header Skeleton */}
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
        {/* Nivel 1 */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-100">
          <div className="flex items-center gap-3 w-full max-w-sm">
            <div className="w-10 h-10 rounded-xl bg-zinc-200 shrink-0" />
            <div className="space-y-2 w-full">
              <div className="h-4 bg-zinc-200 rounded w-1/2" />
              <div className="h-3 bg-zinc-200 rounded w-1/3" />
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-zinc-150 shrink-0" />
        </div>

        {/* Nivel 2 */}
        <div className="px-6 py-2.5 bg-zinc-50/50 flex items-center gap-2">
          <div className="w-28 h-7 rounded-full bg-zinc-200" />
          <div className="w-24 h-7 rounded-full bg-zinc-200" />
          <div className="w-28 h-7 rounded-full bg-zinc-200" />
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="max-w-4xl mx-auto px-6 pt-8 space-y-8">
        {/* Objective Config Card Skeleton */}
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl flex items-center justify-between">
          <div className="space-y-2 w-2/3">
            <div className="h-3 bg-zinc-150 rounded w-1/4" />
            <div className="h-5 bg-zinc-200 rounded w-1/2" />
          </div>
          <div className="w-24 h-9 bg-zinc-200 rounded-xl" />
        </div>

        {/* Form Status / Readiness Widget Skeleton */}
        <div className="p-6 bg-white border border-zinc-200 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-zinc-200" />
            <div className="h-4 bg-zinc-200 rounded w-1/4" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-16 bg-zinc-100 rounded-xl" />
            <div className="h-16 bg-zinc-100 rounded-xl" />
            <div className="h-16 bg-zinc-100 rounded-xl" />
          </div>
        </div>

        {/* Tab Selection Area Skeleton */}
        <div className="space-y-4">
          <div className="flex border-b border-zinc-200 gap-6">
            <div className="h-8 bg-zinc-200 rounded w-24 pb-2" />
            <div className="h-8 bg-zinc-150 rounded w-24 pb-2" />
          </div>

          {/* Tab content placeholder: Workout card & Weekly Navigation */}
          <div className="space-y-6">
            <div className="p-4 bg-white border border-zinc-200 rounded-2xl flex items-center justify-between">
              <div className="w-20 h-10 bg-zinc-100 rounded" />
              <div className="flex-1 max-w-sm mx-4 space-y-2">
                <div className="h-4 bg-zinc-200 rounded w-3/4" />
                <div className="h-3 bg-zinc-150 rounded w-1/2" />
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-200" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-48 bg-white border border-zinc-200 rounded-2xl" />
              <div className="h-48 bg-white border border-zinc-200 rounded-2xl" />
              <div className="h-48 bg-white border border-zinc-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
