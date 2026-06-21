import * as React from 'react';

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-[#f3f4f6] pb-24 animate-pulse">
      {/* Top Navbar Skeleton */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 w-full max-w-xs">
          <div className="w-9 h-9 rounded-xl bg-zinc-200 shrink-0" />
          <div className="space-y-2 w-full">
            <div className="h-4 bg-zinc-200 rounded w-2/3" />
            <div className="h-3 bg-zinc-150 rounded w-1/2" />
          </div>
        </div>
        <div className="w-36 h-9 bg-zinc-200 rounded-xl shrink-0" />
      </header>

      {/* Main Grid Content Skeleton */}
      <main className="max-w-5xl mx-auto px-6 pt-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Race Goal Card Skeleton */}
          <div className="lg:col-span-1 p-6 bg-white border border-zinc-200 rounded-2xl h-96 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-6 bg-zinc-200 rounded w-1/3" />
              <div className="space-y-2">
                <div className="h-4 bg-zinc-150 rounded w-2/3" />
                <div className="h-4 bg-zinc-150 rounded w-1/2" />
              </div>
            </div>
            <div className="h-32 bg-zinc-100 rounded-xl" />
          </div>

          {/* Right Column: Physiological, Sweat Test and Tech Integrations */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Card 1: Physiological Card Skeleton */}
              <div className="p-6 bg-white border border-zinc-200 rounded-2xl h-56 flex flex-col justify-between">
                <div className="h-4 bg-zinc-200 rounded w-1/2" />
                <div className="space-y-2">
                  <div className="h-3 bg-zinc-100 rounded w-full" />
                  <div className="h-3 bg-zinc-100 rounded w-5/6" />
                </div>
                <div className="h-10 bg-zinc-200 rounded-xl" />
              </div>

              {/* Card 2: Sweat Test Card Skeleton */}
              <div className="p-6 bg-white border border-zinc-200 rounded-2xl h-56 flex flex-col justify-between">
                <div className="h-4 bg-zinc-200 rounded w-1/2" />
                <div className="space-y-2">
                  <div className="h-3 bg-zinc-100 rounded w-full" />
                  <div className="h-3 bg-zinc-100 rounded w-5/6" />
                </div>
                <div className="h-10 bg-zinc-200 rounded-xl" />
              </div>

            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Card 3: Telemetry Connect Card Skeleton */}
              <div className="p-6 bg-white border border-zinc-200 rounded-2xl h-56 flex flex-col justify-between">
                <div className="h-4 bg-zinc-200 rounded w-1/2" />
                <div className="space-y-2">
                  <div className="h-3 bg-zinc-100 rounded w-full" />
                </div>
                <div className="h-12 bg-zinc-200 rounded-xl" />
              </div>

              {/* Card 4: Billing Card Skeleton */}
              <div className="p-6 bg-white border border-zinc-200 rounded-2xl h-56 flex flex-col justify-between">
                <div className="h-4 bg-zinc-200 rounded w-1/2" />
                <div className="space-y-2">
                  <div className="h-3 bg-zinc-100 rounded w-full" />
                </div>
                <div className="h-12 bg-zinc-200 rounded-xl" />
              </div>

            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}
