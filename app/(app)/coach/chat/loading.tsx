import * as React from 'react';

export default function CoachChatLoading() {
  return (
    <div className="h-[100dvh] bg-[#f3f4f6] flex flex-col overflow-hidden animate-pulse pb-[env(safe-area-inset-bottom)] sm:pb-0">
      {/* Header Skeleton */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3 w-full max-w-xs">
          <div className="w-9 h-9 rounded-xl bg-zinc-200 shrink-0" />
          <div className="space-y-2 w-full">
            <div className="h-4 bg-zinc-200 rounded w-2/3" />
            <div className="h-3 bg-zinc-150 rounded w-1/2" />
          </div>
        </div>
        <div className="w-36 h-9 bg-zinc-200 rounded-xl shrink-0" />
      </header>

      {/* Level 2 Navigation Bar */}
      <div className="px-6 py-2.5 bg-zinc-50 flex items-center gap-2 border-b border-zinc-200/30 shrink-0">
        <div className="w-28 h-7 rounded-full bg-zinc-200" />
        <div className="w-24 h-7 rounded-full bg-zinc-200" />
      </div>

      {/* Chat Messages Body Skeleton */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-4 flex-1 flex flex-col gap-6 overflow-hidden justify-between pb-24 sm:pb-6">
        
        {/* Split view columns for Coach Chat (Sidebar + conversation) */}
        <div className="flex gap-6 h-full flex-1 overflow-hidden">
          
          {/* Left Sidebar list placeholder */}
          <div className="hidden sm:flex w-80 border-r border-zinc-200 flex-col shrink-0 bg-zinc-50/50 p-4 space-y-4">
            <div className="h-9 bg-zinc-200 rounded-xl w-full" />
            <div className="flex items-center gap-3 py-2 border-b border-zinc-100">
              <div className="w-9 h-9 rounded-full bg-zinc-200 shrink-0" />
              <div className="space-y-1.5 w-full">
                <div className="h-3.5 bg-zinc-200 rounded w-1/2" />
                <div className="h-3 bg-zinc-150 rounded w-1/3" />
              </div>
            </div>
            <div className="flex items-center gap-3 py-2 border-b border-zinc-100">
              <div className="w-9 h-9 rounded-full bg-zinc-200 shrink-0" />
              <div className="space-y-1.5 w-full">
                <div className="h-3.5 bg-zinc-200 rounded w-2/3" />
                <div className="h-3 bg-zinc-150 rounded w-1/4" />
              </div>
            </div>
            <div className="flex items-center gap-3 py-2 border-b border-zinc-100">
              <div className="w-9 h-9 rounded-full bg-zinc-200 shrink-0" />
              <div className="space-y-1.5 w-full">
                <div className="h-3.5 bg-zinc-200 rounded w-1/2" />
                <div className="h-3 bg-zinc-150 rounded w-1/3" />
              </div>
            </div>
          </div>

          {/* Right Message Viewport placeholder */}
          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* Chat History Bubbles */}
            <div className="space-y-6 overflow-hidden flex-1 pt-4">
              {/* Bubble 1: Left */}
              <div className="flex gap-3 items-start max-w-md">
                <div className="w-8 h-8 rounded-full bg-zinc-200 shrink-0" />
                <div className="space-y-1.5 w-full">
                  <div className="h-3 bg-zinc-150 rounded w-1/4" />
                  <div className="p-3.5 bg-white border border-zinc-200 rounded-2xl rounded-tl-none space-y-1">
                    <div className="h-3.5 bg-zinc-200 rounded w-11/12" />
                    <div className="h-3.5 bg-zinc-200 rounded w-3/4" />
                  </div>
                </div>
              </div>

              {/* Bubble 2: Right */}
              <div className="flex gap-3 items-start max-w-md ml-auto justify-end">
                <div className="space-y-1.5 w-full flex flex-col items-end">
                  <div className="h-3 bg-zinc-150 rounded w-1/4" />
                  <div className="p-3.5 bg-[#d7f3ff] border border-cyan-200/50 rounded-2xl rounded-tr-none space-y-1 w-full">
                    <div className="h-3.5 bg-zinc-200 rounded w-11/12" />
                    <div className="h-3.5 bg-zinc-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-200 shrink-0" />
              </div>
            </div>

            {/* Input Bar Placeholder */}
            <div className="p-4 bg-white border border-zinc-200 rounded-2xl flex gap-3 items-center shrink-0 mb-4 sm:mb-0">
              <div className="flex-1 h-10 bg-zinc-100 rounded-xl" />
              <div className="w-12 h-10 bg-zinc-200 rounded-xl" />
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
