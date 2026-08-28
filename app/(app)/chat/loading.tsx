import * as React from 'react';

export default function ChatLoading() {
  return (
    <div className="h-[100dvh] bg-[#f3f4f6] flex flex-col overflow-hidden animate-pulse pb-[env(safe-area-inset-bottom)] sm:pb-0">
      {/* Header Skeleton */}
      <header className="border-b border-zinc-200 bg-white px-4 sm:px-6 pt-[env(safe-area-inset-top)] pb-3 sm:pb-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3 w-full max-w-xs">
          <div className="w-9 h-9 rounded-xl bg-surface-hover shrink-0" />
          <div className="space-y-2 w-full">
            <div className="h-4 bg-surface-hover rounded w-2/3" />
            <div className="h-3 bg-zinc-200 rounded w-1/2" />
          </div>
        </div>
        <div className="w-36 h-9 bg-surface-hover rounded-xl shrink-0" />
      </header>

      {/* Chat Messages Body Skeleton */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-4 flex-1 flex flex-col gap-6 overflow-hidden justify-between pb-24 sm:pb-6">
        
        {/* Chat History Bubbles */}
        <div className="space-y-6 overflow-hidden flex-1 pt-4">
          {/* Bubble 1: Left (Coach) */}
          <div className="flex gap-3 items-start max-w-md">
            <div className="w-8 h-8 rounded-full bg-surface-hover shrink-0" />
            <div className="space-y-1.5 w-full">
              <div className="h-3 bg-zinc-200 rounded w-1/4" />
              <div className="p-3.5 bg-white border border-zinc-200 rounded-2xl rounded-tl-none space-y-1">
                <div className="h-3.5 bg-surface-hover rounded w-11/12" />
                <div className="h-3.5 bg-surface-hover rounded w-3/4" />
              </div>
            </div>
          </div>

          {/* Bubble 2: Right (Athlete) */}
          <div className="flex gap-3 items-start max-w-md ml-auto justify-end">
            <div className="space-y-1.5 w-full flex flex-col items-end">
              <div className="h-3 bg-zinc-200 rounded w-1/4" />
              <div className="p-3.5 bg-cyan-100 border border-cyan-200/50 rounded-2xl rounded-tr-none space-y-1 w-full">
                <div className="h-3.5 bg-surface-hover rounded w-11/12" />
                <div className="h-3.5 bg-surface-hover rounded w-1/2" />
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-hover shrink-0" />
          </div>

          {/* Bubble 3: Left (Coach) */}
          <div className="flex gap-3 items-start max-w-md">
            <div className="w-8 h-8 rounded-full bg-surface-hover shrink-0" />
            <div className="space-y-1.5 w-full">
              <div className="h-3 bg-zinc-200 rounded w-1/4" />
              <div className="p-3.5 bg-white border border-zinc-200 rounded-2xl rounded-tl-none space-y-1">
                <div className="h-3.5 bg-surface-hover rounded w-5/6" />
              </div>
            </div>
          </div>
        </div>

        {/* Input Bar Placeholder */}
        <div className="p-4 bg-white border border-zinc-200 rounded-2xl flex gap-3 items-center shrink-0">
          <div className="flex-1 h-10 bg-bg-hover rounded-xl" />
          <div className="w-12 h-10 bg-surface-hover rounded-xl" />
        </div>

      </main>
    </div>
  );
}
