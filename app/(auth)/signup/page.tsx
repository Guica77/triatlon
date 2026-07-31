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
      <div className="space-y-6 relative z-10 overflow-x-hidden w-full pb-24 sm:pb-8">

        <div className="grid gap-4">
          <button
            onClick={() => router.push('/athlete/register')}
            className="group block w-full bg-surface-hover border border-border-default rounded-xl p-6 transition-all hover:bg-surface-hover/50 hover:border-border-default cursor-pointer"
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-surface-card border border-border-default rounded-full">
                <span className="text-2xl">🏃‍♂️</span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-text-primary group-hover:text-swim transition-colors">Soy Atleta</h3>
                <p className="text-xs text-text-muted font-medium mt-1">Quiero un plan de entrenamiento</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/coach/register')}
            className="group block w-full bg-surface-hover border border-border-default rounded-xl p-6 transition-all hover:bg-surface-hover/50 hover:border-border-default cursor-pointer"
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-surface-card border border-border-default rounded-full">
                <span className="text-2xl">📋</span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-text-primary group-hover:text-swim transition-colors">Soy Entrenador</h3>
                <p className="text-xs text-text-muted font-medium mt-1">Quiero gestionar a mis atletas</p>
              </div>
            </div>
          </button>
        </div>

      </div>
    </AuthLayout>
  );
}
