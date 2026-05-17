'use client';

import * as React from 'react';
import { login, signup, signInWithOAuth } from './actions';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Apple } from 'lucide-react'; // Usamos iconos limpios o SVG custom

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(event.currentTarget);

    const result = isSignUp ? await signup(formData) : await login(formData);
    if (result && result.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-light tracking-tight text-zinc-50">
            {isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </h1>
          <p className="text-sm text-zinc-400">
            {isSignUp 
              ? 'Únete a la plataforma de triatlón de alto rendimiento' 
              : 'Accede a tu plan de entrenamiento personalizado'}
          </p>
        </div>

        <ProCard className="space-y-6">
          
          {/* Social Logins */}
          <div className="space-y-3">
            <AnimatedButton 
              variant="secondary" 
              className="w-full font-normal opacity-50 cursor-not-allowed"
              disabled
              type="button"
              title="Próximamente disponible"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 5.26c.61-.75 1.02-1.8 1.02-2.85 0-.09-.01-.19-.03-.28-.96.04-2.07.64-2.71 1.4-.56.66-.99 1.73-.99 2.76 0 .1.02.21.03.22 1.02-.04 2.07-.5 2.68-1.25z"/>
              </svg>
              Continuar con Apple (Próximamente)
            </AnimatedButton>
            <AnimatedButton 
              variant="secondary" 
              className="w-full font-normal"
              onClick={() => signInWithOAuth('google')}
              type="button"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </AnimatedButton>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-[var(--color-border)]"></div>
            <span className="flex-shrink mx-4 text-xs text-zinc-500 uppercase tracking-widest">o con email</span>
            <div className="flex-grow border-t border-[var(--color-border)]"></div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            {isSignUp && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400">Nombre</label>
                  <input 
                    name="firstName" 
                    type="text" 
                    required 
                    className="w-full bg-[#121214] border border-[var(--color-border)] rounded-xl p-3 text-sm text-zinc-100 outline-none focus:border-zinc-400 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-400">Apellidos</label>
                  <input 
                    name="lastName" 
                    type="text" 
                    required 
                    className="w-full bg-[#121214] border border-[var(--color-border)] rounded-xl p-3 text-sm text-zinc-100 outline-none focus:border-zinc-400 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Correo Electrónico</label>
              <input 
                name="email" 
                type="email" 
                placeholder="atleta@triatlon.com" 
                required 
                className="w-full bg-[#121214] border border-[var(--color-border)] rounded-xl p-3 text-sm text-zinc-100 outline-none focus:border-zinc-400 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Contraseña</label>
              <input 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                required 
                className="w-full bg-[#121214] border border-[var(--color-border)] rounded-xl p-3 text-sm text-zinc-100 outline-none focus:border-zinc-400 transition-colors"
              />
            </div>

            <AnimatedButton variant="primary" className="w-full mt-2" type="submit" disabled={loading}>
              {loading ? 'Procesando...' : (isSignUp ? 'Crear Cuenta' : 'Entrar al Plan')}
            </AnimatedButton>

          </form>

          {/* Toggle mode */}
          <div className="text-center pt-2">
            <button 
              type="button" 
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              {isSignUp 
                ? '¿Ya tienes cuenta? Inicia sesión aquí' 
                : '¿No tienes cuenta? Regístrate ahora'}
            </button>
          </div>

        </ProCard>

      </div>
    </div>
  );
}
