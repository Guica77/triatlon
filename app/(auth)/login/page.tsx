'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';

export default function LoginGatewayPage() {
  const router = useRouter();

  return (
    <AuthLayout 
      title="Bienvenido a TriatlonPro" 
      subtitle="Selecciona tu tipo de cuenta para continuar"
      isAthlete={true}
    >
      <div className="space-y-6 relative z-10">
        
        <div className="grid gap-4">
          <button
            onClick={() => router.push('/athlete/login')}
            className="relative group overflow-hidden rounded-2xl p-[1px]"
          >
            <span className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative h-full bg-zinc-950 px-6 py-8 rounded-[15px] flex flex-col items-center justify-center gap-3 transition-transform duration-300 group-hover:scale-[0.98]">
              <div className="p-3 bg-zinc-900 rounded-full">
                <span className="text-2xl">🏃‍♂️</span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors">Soy Atleta</h3>
                <p className="text-xs text-zinc-400 font-medium mt-1">Accede a tu plan de entrenamiento</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/coach/login')}
            className="relative group overflow-hidden rounded-2xl p-[1px]"
          >
            <span className="absolute inset-0 bg-gradient-to-br from-orange-500 to-rose-500 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative h-full bg-zinc-950 px-6 py-8 rounded-[15px] flex flex-col items-center justify-center gap-3 transition-transform duration-300 group-hover:scale-[0.98]">
              <div className="p-3 bg-zinc-900 rounded-full">
                <span className="text-2xl">📋</span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-black text-white group-hover:text-orange-300 transition-colors">Soy Entrenador</h3>
                <p className="text-xs text-zinc-400 font-medium mt-1">Accede a tu panel de control</p>
              </div>
            </div>
          </button>
        </div>

      </div>
    </AuthLayout>
  );
}
