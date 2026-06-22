'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { loginCoach, getOAuthUrl } from '../../actions';

export default function CoachLoginPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(event.currentTarget);

    const result = await loginCoach(formData);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/coach/dashboard');
    }
  }



  return (
    <AuthLayout 
      title="Acceso Entrenador" 
      subtitle="Tu centro de control de alto rendimiento"
      isAthlete={false}
    >
      <div className="space-y-6 relative z-10">


        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-750 text-xs text-center font-medium shadow-xs">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Correo Electrónico</label>
            <input 
              name="email" 
              type="email" 
              placeholder="coach@triatlonpro.com" 
              required 
              className="w-full bg-white border border-zinc-200 rounded-xl p-3.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-cyan-500 focus:bg-white transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Contraseña</label>
              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="text-[10px] text-cyan-600 hover:text-cyan-700 transition-colors font-bold uppercase tracking-wider"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <input 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              required 
              className="w-full bg-white border border-zinc-200 rounded-xl p-3.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-cyan-500 focus:bg-white transition-all font-mono"
            />
          </div>

          <button 
            className="w-full mt-4 py-4 rounded-xl text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-xs flex items-center justify-center disabled:opacity-50 cursor-pointer" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'Entrar al Panel'}
          </button>
        </form>

        <div className="text-center pt-4">
          <button 
            type="button" 
            onClick={() => router.push('/coach/register')}
            className="text-xs text-zinc-500 hover:text-cyan-600 transition-colors font-bold"
          >
            ¿No tienes cuenta? Regístrate aquí
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
