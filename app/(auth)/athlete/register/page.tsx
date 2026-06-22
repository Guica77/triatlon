'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { registerAthlete, getOAuthUrl } from '../../actions';

export default function AthleteRegisterPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(event.currentTarget);

    const result = await registerAthlete(formData);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.emailConfirmRequired) {
      setSuccessMessage(
        '¡Cuenta creada con éxito! Te hemos enviado un correo de confirmación. Por favor, revisa tu bandeja de entrada (y la carpeta de spam o correo no deseado) para activar tu cuenta antes de iniciar sesión.'
      );
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  }



  return (
    <AuthLayout 
      title="Crear tu Legado" 
      subtitle="La plataforma definitiva de alto rendimiento"
      isAthlete={true}
    >
      <div className="space-y-6 relative z-10">


        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-55 border border-red-200 text-red-750 text-xs text-center font-medium shadow-xs">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-750 text-xs text-center leading-relaxed font-medium shadow-xs">
              {successMessage}
            </div>
          )}

          {!successMessage && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Nombre</label>
                  <input 
                    id="firstName"
                    name="firstName" 
                    type="text" 
                    required 
                    placeholder="Nombre"
                    className="w-full bg-white border border-zinc-200 rounded-xl p-3.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-cyan-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Apellidos</label>
                  <input 
                    id="lastName"
                    name="lastName" 
                    type="text" 
                    required 
                    placeholder="Apellidos"
                    className="w-full bg-white border border-zinc-200 rounded-xl p-3.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-cyan-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Correo Electrónico</label>
                <input 
                  name="email" 
                  type="email" 
                  placeholder="atleta@triatlonpro.com" 
                  required 
                  className="w-full bg-white border border-zinc-200 rounded-xl p-3.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-cyan-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Contraseña</label>
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
                {loading ? 'Procesando...' : 'Crear mi Cuenta'}
              </button>
            </>
          )}
        </form>

        <div className="text-center pt-4">
          <button 
            type="button" 
            onClick={() => router.push('/athlete/login')}
            className="text-xs text-zinc-500 hover:text-cyan-600 transition-colors font-bold"
          >
            ¿Ya eres miembro? Inicia sesión aquí
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
