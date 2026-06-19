'use client';
 
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Activity, Users, ArrowRight } from 'lucide-react';
 
export default function LoginGatewayPage() {
  const router = useRouter();
 
  return (
    <AuthLayout 
      title="Bienvenido a TriatlonPro" 
      subtitle="Selecciona tu tipo de cuenta para continuar"
      isAthlete={true}
    >
      <div className="space-y-4 relative z-10">
        
        <div className="flex flex-col gap-4">
          
          {/* Athlete Card */}
          <button
            onClick={() => router.push('/athlete/login')}
            className="group w-full bg-white border border-zinc-200 rounded-2xl p-5 text-left transition-all hover:bg-gradient-to-br hover:from-white hover:to-cyan-50/15 hover:border-cyan-300 hover:shadow-md cursor-pointer flex items-center gap-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-all duration-500" />
            
            <div className="w-12 h-12 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="text-base font-black text-zinc-900 tracking-tight leading-tight group-hover:text-cyan-700 transition-colors">
                Soy Atleta
              </h3>
              <p className="text-xs text-zinc-500 font-semibold leading-relaxed mt-1">
                Entrena con planes estructurados
              </p>
            </div>
            
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-cyan-650 group-hover:translate-x-1 transition-all shrink-0 ml-auto" />
          </button>
 
          {/* Coach Card */}
          <button
            onClick={() => router.push('/coach/login')}
            className="group w-full bg-white border border-zinc-200 rounded-2xl p-5 text-left transition-all hover:bg-gradient-to-br hover:from-white hover:to-amber-50/15 hover:border-amber-300 hover:shadow-md cursor-pointer flex items-center gap-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-all duration-500" />
            
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300">
              <Users className="w-6 h-6" />
            </div>
            
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="text-base font-black text-zinc-900 tracking-tight leading-tight group-hover:text-amber-700 transition-colors">
                Soy Entrenador
              </h3>
              <p className="text-xs text-zinc-500 font-semibold leading-relaxed mt-1">
                Gestiona tu roster de atletas
              </p>
            </div>
            
            <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-amber-650 group-hover:translate-x-1 transition-all shrink-0 ml-auto" />
          </button>
 
        </div>
 
      </div>
    </AuthLayout>
  );
}
