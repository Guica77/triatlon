import * as React from 'react';

export default function CoachAthleteDetailLoading() {
  return (
    <div className="min-h-screen bg-[#f3f4f6] pb-24 animate-pulse">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-50 bg-white border-b border-zinc-200 shadow-sm">
        <div className="px-6 py-4 flex justify-between items-center border-b border-zinc-100">
          <div className="flex items-center gap-3 w-full max-w-sm">
            <div className="w-9 h-9 rounded-xl bg-zinc-200 shrink-0" />
            <div className="space-y-2 w-full">
              <div className="h-4 bg-zinc-200 rounded w-2/3" />
              <div className="h-3 bg-zinc-150 rounded w-1/2" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-9 h-9 rounded-xl bg-zinc-150 shrink-0" />
            <div className="w-9 h-9 rounded-xl bg-zinc-150 shrink-0" />
          </div>
        </div>

        {/* Level 2 Navigation Bar */}
        <div className="px-6 py-2.5 bg-zinc-50 flex items-center justify-between border-t border-zinc-200/30">
          <div className="flex gap-2">
            <div className="w-28 h-7 rounded-full bg-zinc-200" />
            <div className="w-28 h-7 rounded-full bg-zinc-200" />
          </div>
        </div>
      </header>

      {/* Main Content Skeleton */}
      <main className="max-w-6xl mx-auto px-6 pt-8 space-y-8">
        
        {/* Section Biometrics and Readiness */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Biometrics Card Skeleton */}
          <div className="p-6 bg-white border border-zinc-200 rounded-2xl space-y-4 shadow-sm">
            <div className="h-4 bg-zinc-200 rounded w-1/3" />
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="h-16 bg-zinc-100 rounded-xl" />
              <div className="h-16 bg-zinc-100 rounded-xl" />
            </div>
          </div>

          {/* FormStatusWidget Skeleton */}
          <div className="p-6 bg-white border border-zinc-200 rounded-2xl space-y-4 shadow-sm">
            <div className="h-4 bg-zinc-200 rounded w-1/4" />
            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="h-16 bg-zinc-100 rounded-xl" />
              <div className="h-16 bg-zinc-100 rounded-xl" />
              <div className="h-16 bg-zinc-100 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Advanced Builder Calendar Skeleton */}
        <div className="space-y-4 pt-4 border-t border-zinc-200">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-zinc-200 rounded w-1/3" />
            <div className="h-6 bg-zinc-150 rounded w-24" />
          </div>
          <div className="h-96 bg-white border border-zinc-200 rounded-2xl shadow-sm" />
        </div>

      </main>
    </div>
  );
}
