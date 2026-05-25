'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { updatePassword } from './actions';
import { ProCard } from '@/components/ui/pro-card';
import { AnimatedButton } from '@/components/ui/animated-button';
import { Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await updatePassword(password);
      if (res?.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err) {
      setError('Ha ocurrido un error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-light tracking-tight text-zinc-50">
            Establecer Nueva Contraseña
          </h1>
          <p className="text-sm text-zinc-400">
            Elige una contraseña segura para tu cuenta
          </p>
        </div>

        <ProCard className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs text-center leading-relaxed">
                ¡Contraseña restablecida con éxito! Redirigiéndote al panel de control...
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Nueva Contraseña</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required 
                  disabled={success || loading}
                  className="w-full bg-[#121214] border border-[var(--color-border)] rounded-xl p-3 pr-10 text-sm text-zinc-100 outline-none focus:border-zinc-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-zinc-400">Confirmar Contraseña</label>
              <input 
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••" 
                required 
                disabled={success || loading}
                className="w-full bg-[#121214] border border-[var(--color-border)] rounded-xl p-3 text-sm text-zinc-100 outline-none focus:border-zinc-400 transition-colors"
              />
            </div>

            <AnimatedButton 
              variant="primary" 
              className="w-full mt-2" 
              type="submit" 
              disabled={loading || success}
            >
              {loading ? 'Guardando...' : success ? '¡Guardada!' : 'Actualizar Contraseña'}
            </AnimatedButton>

          </form>

          {/* Toggle mode / Back */}
          <div className="text-center pt-2">
            <button 
              type="button" 
              onClick={() => router.push('/login')}
              className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
              disabled={loading}
            >
              Volver al inicio de sesión
            </button>
          </div>
        </ProCard>

      </div>
    </div>
  );
}
