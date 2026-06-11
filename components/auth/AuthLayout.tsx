import * as React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  isAthlete?: boolean;
}

export function AuthLayout({ children, title, subtitle, isAthlete = false }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 overflow-hidden font-sans">
      
      {/* Ambient Background Orbs */}
      <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] mix-blend-screen animate-pulse [animation-duration:8s] ${isAthlete ? 'bg-cyan-500/20' : 'bg-orange-500/20'}`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] mix-blend-screen animate-pulse [animation-duration:10s] [animation-delay:2s] ${isAthlete ? 'bg-indigo-500/20' : 'bg-rose-500/20'}`} />
      <div className={`absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full blur-[100px] mix-blend-screen ${isAthlete ? 'bg-indigo-500/10' : 'bg-orange-500/10'}`} />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

      <div className="relative w-full max-w-md space-y-8 z-10">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 shadow-2xl mb-2 backdrop-blur-xl">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={isAthlete ? "url(#cyan-gradient)" : "url(#orange-gradient)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <defs>
                <linearGradient id="cyan-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
                <linearGradient id="orange-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
              </defs>
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-500">
            {title}
          </h1>
          <p className="text-sm text-zinc-400 font-medium tracking-wide">
            {subtitle}
          </p>
        </div>

        <div className="p-8 rounded-[2rem] bg-zinc-950/40 border border-zinc-800/60 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Subtle card inner glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none" />
          {children}
        </div>
      </div>
    </div>
  );
}
