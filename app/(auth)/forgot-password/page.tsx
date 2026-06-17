'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { sendResetPasswordEmail } from '../actions';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    const formData = new FormData(event.currentTarget);

    const result = await sendResetPasswordEmail(formData);
    
    if (result.error) {
      setError(result.error);
    } else {
      setSuccessMessage(
        '¡Enlace de recuperación enviado con éxito! Revisa tu bandeja de entrada para continuar.'
      );
    }
    setLoading(false);
  }

  return (
    <AuthLayout 
      title="Recuperar Acceso" 
      subtitle="Te enviaremos un enlace de recuperación"
      isAthlete={true}
    >
      <div className="space-y-6 relative z-10">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-750 text-xs text-center font-medium shadow-xs">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-750 text-xs text-center leading-relaxed font-medium shadow-xs">
              {successMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">Correo Electrónico</label>
            <input 
              name="email" 
              type="email" 
              placeholder="tu@correo.com" 
              required 
              className="w-full bg-white border border-zinc-200 rounded-xl p-3.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-cyan-500 focus:bg-white transition-all"
            />
          </div>

          <button 
            className="w-full mt-4 py-4 rounded-xl text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-xs flex items-center justify-center disabled:opacity-50 cursor-pointer" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Procesando...' : 'Enviar Enlace de Recuperación'}
          </button>
        </form>

        <div className="text-center pt-4">
          <button 
            type="button" 
            onClick={() => router.push('/login')}
            className="text-xs text-zinc-500 hover:text-cyan-600 transition-colors font-bold"
          >
            ← Volver a Iniciar Sesión
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
