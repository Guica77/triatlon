import * as React from 'react';

export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-[#f3f4f6] pb-24 animate-pulse">
      {/* Top Navbar Skeleton */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 w-full max-w-sm">
          <div className="w-9 h-9 rounded-xl bg-zinc-200 shrink-0" />
          <div className="space-y-2 w-full">
            <div className="h-4 bg-zinc-200 rounded w-2/3" />
            <div className="h-3 bg-zinc-150 rounded w-1/2" />
          </div>
        </div>
        <div className="w-36 h-9 bg-zinc-200 rounded-xl" />
      </header>

      {/* Main Content Skeleton */}
      <main className="max-w-5xl mx-auto px-6 pt-8 space-y-8">
        {/* Header Text Skeleton */}
        <div className="space-y-2 w-full max-w-md">
          <div className="h-3 bg-zinc-250 rounded w-1/4" />
          <div className="h-4 bg-zinc-200 rounded w-3/4" />
        </div>

        {/* Bento Grid Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: PMC Chart skeleton (Height 380px roughly) */}
          <div className="p-6 bg-white border border-zinc-200 rounded-2xl h-80 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-zinc-200 rounded w-1/3" />
              <div className="h-3 bg-zinc-150 rounded w-1/2" />
            </div>
            <div className="h-40 bg-zinc-100 rounded-xl" />
          </div>

          {/* Card 2: Weekly TSS skeleton */}
          <div className="p-6 bg-white border border-zinc-200 rounded-2xl h-80 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-zinc-200 rounded w-1/3" />
              <div className="h-3 bg-zinc-150 rounded w-1/2" />
            </div>
            <div className="h-40 bg-zinc-100 rounded-xl" />
          </div>

          {/* Card 3: Sport Distribution skeleton */}
          <div className="p-6 bg-white border border-zinc-200 rounded-2xl h-80 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-zinc-200 rounded w-1/3" />
              <div className="h-3 bg-zinc-150 rounded w-1/2" />
            </div>
            <div className="h-40 bg-zinc-100 rounded-xl" />
          </div>

          {/* Card 4: Pace/Power History (Span 2) */}
          <div className="md:col-span-2 p-6 bg-white border border-zinc-200 rounded-2xl h-80 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-zinc-200 rounded w-1/4" />
              <div className="h-3 bg-zinc-150 rounded w-1/3" />
            </div>
            <div className="h-40 bg-zinc-100 rounded-xl" />
          </div>

          {/* Card 5: Training Zones (Span 2) */}
          <div className="md:col-span-2 p-6 bg-white border border-zinc-200 rounded-2xl h-80 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="h-4 bg-zinc-200 rounded w-1/4" />
              <div className="h-3 bg-zinc-150 rounded w-1/3" />
            </div>
            <div className="h-40 bg-zinc-100 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
