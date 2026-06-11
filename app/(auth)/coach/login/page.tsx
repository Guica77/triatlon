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

  async function handleGoogleLogin() {
    setError(null);
    const res = await getOAuthUrl('google'); // No role specified, just login
    if (res?.url) {
      window.location.href = res.url;
    } else if (res?.error) {
      setError(`Error con Google: ${res.error}`);
    }
  }

  return (
    <AuthLayout 
      title="Acceso Entrenador" 
      subtitle="Tu centro de control de alto rendimiento"
      isAthlete={false}
    >
      <div className="space-y-6 relative z-10">
        <button 
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium py-3.5 rounded-xl border border-zinc-800 transition-all hover:border-zinc-700 shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Continuar con Google
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium shadow-inner">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Correo Electrónico</label>
            <input 
              name="email" 
              type="email" 
              placeholder="coach@triatlonpro.com" 
              required 
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-cyan-500/50 focus:bg-zinc-900 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Contraseña</label>
              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="text-[10px] text-orange-400 hover:text-orange-300 transition-colors font-bold uppercase tracking-wider"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <input 
              name="password" 
              type="password" 
              placeholder="••••••••" 
              required 
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-orange-500/50 focus:bg-zinc-900 transition-all font-mono"
            />
          </div>

          <button 
            className="w-full mt-4 py-4 rounded-xl text-sm font-black text-black bg-white hover:bg-zinc-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center disabled:opacity-50" 
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
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-medium"
          >
            ¿No tienes cuenta? Regístrate aquí
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
