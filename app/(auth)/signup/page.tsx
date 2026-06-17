'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';

export default function SignupGatewayPage() {
  const router = useRouter();

  return (
    <AuthLayout 
      title="Crear tu Legado" 
      subtitle="Selecciona cómo quieres registrarte"
      isAthlete={true}
    >
      <div className="space-y-6 relative z-10">
        
        <div className="grid gap-4">
          <button
            onClick={() => router.push('/athlete/register')}
            className="group block w-full bg-zinc-50 border border-zinc-200 rounded-xl p-6 transition-all hover:bg-zinc-100/50 hover:border-zinc-300 shadow-sm cursor-pointer"
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-white border border-zinc-200 rounded-full shadow-xs">
                <span className="text-2xl">🏃‍♂️</span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-zinc-800 group-hover:text-cyan-600 transition-colors">Soy Atleta</h3>
                <p className="text-xs text-zinc-500 font-medium mt-1">Quiero un plan de entrenamiento</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/coach/register')}
            className="group block w-full bg-zinc-50 border border-zinc-200 rounded-xl p-6 transition-all hover:bg-zinc-100/50 hover:border-zinc-300 shadow-sm cursor-pointer"
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-white border border-zinc-200 rounded-full shadow-xs">
                <span className="text-2xl">📋</span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-zinc-800 group-hover:text-cyan-600 transition-colors">Soy Entrenador</h3>
                <p className="text-xs text-zinc-500 font-medium mt-1">Quiero gestionar a mis atletas</p>
              </div>
            </div>
          </button>
        </div>

      </div>
    </AuthLayout>
  );
}
