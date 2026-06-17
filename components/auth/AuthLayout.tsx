import * as React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  isAthlete?: boolean;
}

export function AuthLayout({ children, title, subtitle, isAthlete = false }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 overflow-hidden font-sans">
      
      <div className="relative w-full max-w-md space-y-8 z-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white border border-zinc-200 shadow-xs mb-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-cyan-600 animate-pulse" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            {title}
          </h1>
          <p className="text-sm text-zinc-500 font-medium tracking-wide">
            {subtitle}
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-white border border-zinc-200 shadow-md relative overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
