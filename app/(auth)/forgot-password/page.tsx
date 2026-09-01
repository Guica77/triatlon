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
      <div className="space-y-6 relative z-10 overflow-x-hidden w-full pb-24 sm:pb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs text-center font-medium">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-bike/10 border border-bike/30 text-bike text-xs text-center leading-relaxed font-medium">
              {successMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="forgot-password-email" className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Correo Electrónico</label>
            <input
              id="forgot-password-email"
              name="email"
              type="email"
              placeholder="tu@correo.com"
              required
              className="w-full rounded-xl border border-border-default bg-surface-card p-3.5 text-sm text-text-primary placeholder-text-muted outline-none transition-[background-color,color,border-color,box-shadow] duration-150 ease-out focus:border-swim focus:ring-1 focus:ring-swim/40 motion-reduce:transition-opacity"
            />
          </div>

          <button
            className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-swim py-4 text-sm font-bold text-text-primary transition-[background-color,color,border-color,box-shadow,opacity,transform] duration-150 ease-out hover:bg-swim/90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer motion-reduce:transition-opacity motion-reduce:active:scale-100"
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
            className="min-h-11 rounded-lg px-2 text-xs font-bold text-text-muted transition-[color,opacity,transform] duration-150 ease-out hover:text-swim active:scale-[0.97] motion-reduce:transition-opacity motion-reduce:active:scale-100"
          >
            ← Volver a Iniciar Sesión
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
