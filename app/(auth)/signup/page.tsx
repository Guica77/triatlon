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
            className="group block min-h-11 w-full rounded-xl border border-border-default bg-surface-hover p-6 transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-150 ease-out hover:bg-surface-hover/50 hover:border-border-default active:scale-[0.98] cursor-pointer motion-reduce:transition-opacity motion-reduce:active:scale-100"
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-surface-card border border-border-default rounded-full">
                <span className="text-2xl">🏃‍♂️</span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-text-primary group-hover:text-swim transition-[color] duration-150 ease-out motion-reduce:transition-opacity">Soy Atleta</h3>
                <p className="text-xs text-text-muted font-medium mt-1">Quiero un plan de entrenamiento</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/coach/register')}
            className="group block min-h-11 w-full rounded-xl border border-border-default bg-surface-hover p-6 transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-150 ease-out hover:bg-surface-hover/50 hover:border-border-default active:scale-[0.98] cursor-pointer motion-reduce:transition-opacity motion-reduce:active:scale-100"
          >
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-surface-card border border-border-default rounded-full">
                <span className="text-2xl">📋</span>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-text-primary group-hover:text-swim transition-[color] duration-150 ease-out motion-reduce:transition-opacity">Soy Entrenador</h3>
                <p className="text-xs text-text-muted font-medium mt-1">Quiero gestionar a mis atletas</p>
              </div>
            </div>
          </button>
        </div>

      </div>
    </AuthLayout>
  );
}
